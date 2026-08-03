#!/usr/bin/env bash
# Restore ORIGINAL passwords (bcrypt hashes) into the self-hosted auth.users.
# Never prints hashes, tokens or passwords. Does NOT touch profiles/wallets/orders.
set -euo pipefail

JSON_FILE="${1:-/opt/migration/06_auth_users.json}"
DB_CONTAINER="${DB_CONTAINER:-}"

if [ ! -s "$JSON_FILE" ]; then
  echo "ERROR: $JSON_FILE missing or empty — aborting import."
  exit 1
fi

if [ -z "$DB_CONTAINER" ]; then
  DB_CONTAINER="$(docker ps --format '{{.Names}}' | grep -Ei 'supabase[-_]db|extips-db|(^|[-_])db($|[-_])' | head -1 || true)"
fi
if [ -z "$DB_CONTAINER" ]; then
  echo "ERROR: postgres container not found. Set DB_CONTAINER=<name> and retry."
  exit 1
fi
echo "DB container: $DB_CONTAINER"

PSQL() { docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 "$@"; }

TSV="$(mktemp /tmp/authmig.XXXXXX.tsv)"
trap 'rm -f "$TSV"' EXIT

python3 - "$JSON_FILE" "$TSV" <<'PY'
import json, sys, re
raw = json.load(open(sys.argv[1]))
users = raw.get("users") if isinstance(raw, dict) else raw
if not users:
    sys.exit("ERROR: no users in export file")
bc = re.compile(r'^\$2[aby]\$')
def esc(v):
    if v is None: return r'\N'
    s = v if isinstance(v, str) else json.dumps(v)
    return s.replace('\\', '\\\\').replace('\t', ' ').replace('\n', ' ').replace('\r', ' ')
rows = skipped = 0
with open(sys.argv[2], 'w') as f:
    for u in users:
        uid, email, pw = u.get('id'), (u.get('email') or '').strip().lower(), u.get('encrypted_password') or ''
        if not uid or not email or not bc.match(pw):
            skipped += 1
            continue
        f.write('\t'.join([
            esc(uid), esc(email), esc(pw),
            esc(u.get('email_confirmed_at')),
            esc(u.get('raw_user_meta_data') or {}),
            esc(u.get('raw_app_meta_data') or {"provider": "email", "providers": ["email"]}),
            esc(u.get('created_at')), esc(u.get('updated_at') or u.get('created_at')),
            esc(u.get('last_sign_in_at')), esc(u.get('phone')),
        ]) + '\n')
        rows += 1
print(f"exported_rows_valid={rows} skipped_invalid_hash_or_missing_fields={skipped}")
if rows == 0:
    sys.exit("ERROR: no valid bcrypt rows to import")
PY

echo "Loading staging table..."
PSQL -q <<'SQL'
CREATE SCHEMA IF NOT EXISTS migration_tmp;
DROP TABLE IF EXISTS migration_tmp.src;
CREATE TABLE migration_tmp.src (
  id uuid, email text, pw text, email_confirmed_at timestamptz,
  meta jsonb, app_meta jsonb, created_at timestamptz, updated_at timestamptz,
  last_sign_in_at timestamptz, phone text
);
SQL
PSQL -q -c "COPY migration_tmp.src FROM STDIN" < "$TSV"

echo "Applying users (transaction)..."
PSQL -q <<'SQL'
BEGIN;

-- 1. Match by UUID
UPDATE auth.users t SET
  encrypted_password = s.pw,
  email              = COALESCE(t.email, s.email),
  email_confirmed_at = COALESCE(t.email_confirmed_at, s.email_confirmed_at, s.created_at, now()),
  raw_user_meta_data = COALESCE(t.raw_user_meta_data, s.meta),
  raw_app_meta_data  = COALESCE(t.raw_app_meta_data, s.app_meta),
  updated_at         = now()
FROM migration_tmp.src s
WHERE t.id = s.id;

-- 2. Fallback match by email (different UUID on this backend)
UPDATE auth.users t SET
  encrypted_password = s.pw,
  email_confirmed_at = COALESCE(t.email_confirmed_at, s.email_confirmed_at, s.created_at, now()),
  updated_at         = now()
FROM migration_tmp.src s
WHERE lower(t.email) = s.email AND t.id <> s.id;

-- 3. Insert missing users with SAME uuid + email
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, last_sign_in_at, raw_user_meta_data, raw_app_meta_data,
  phone, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new,
  email_change, email_change_token_current, phone_change, phone_change_token,
  reauthentication_token
)
SELECT '00000000-0000-0000-0000-000000000000', s.id, 'authenticated', 'authenticated',
       s.email, s.pw, COALESCE(s.email_confirmed_at, s.created_at, now()),
       COALESCE(s.created_at, now()), COALESCE(s.updated_at, now()), s.last_sign_in_at,
       s.meta, s.app_meta, s.phone, false, '', '', '', '', '', '', '', ''
FROM migration_tmp.src s
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = s.id)
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = s.email);

-- 4. Missing email identities
INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider,
                             last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email,
                          'email_verified', true, 'phone_verified', false),
       'email', u.last_sign_in_at, COALESCE(u.created_at, now()), now()
FROM auth.users u
WHERE u.email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM auth.identities i
                  WHERE i.user_id = u.id AND i.provider = 'email');

-- 5. Self-hosted GoTrue compatibility (confirmed_at is generated — never updated)
UPDATE auth.users SET
  confirmation_token         = COALESCE(confirmation_token, ''),
  recovery_token             = COALESCE(recovery_token, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change               = COALESCE(email_change, ''),
  phone_change               = COALESCE(phone_change, ''),
  phone_change_token         = COALESCE(phone_change_token, ''),
  reauthentication_token     = COALESCE(reauthentication_token, ''),
  aud                        = COALESCE(NULLIF(aud, ''), 'authenticated'),
  role                       = COALESCE(NULLIF(role, ''), 'authenticated'),
  instance_id                = COALESCE(instance_id, '00000000-0000-0000-0000-000000000000'),
  email_confirmed_at         = COALESCE(email_confirmed_at, created_at, now());

COMMIT;
SQL

echo "--- Result counts ---"
PSQL -Atc "
SELECT 'staged_rows=' || count(*) FROM migration_tmp.src
UNION ALL SELECT 'total_users=' || count(*) FROM auth.users
UNION ALL SELECT 'matched_by_uuid=' || count(*) FROM auth.users u JOIN migration_tmp.src s ON s.id = u.id
UNION ALL SELECT 'restored_hashes=' || count(*) FROM auth.users u JOIN migration_tmp.src s ON lower(u.email) = s.email AND u.encrypted_password = s.pw
UNION ALL SELECT 'valid_bcrypt_hashes=' || count(*) FROM auth.users WHERE encrypted_password ~ '^\$2[aby]\$'
UNION ALL SELECT 'email_identities=' || count(*) FROM auth.identities WHERE provider = 'email'
UNION ALL SELECT 'null_token_rows=' || count(*) FROM auth.users
  WHERE confirmation_token IS NULL OR recovery_token IS NULL OR email_change IS NULL
     OR email_change_token_new IS NULL OR email_change_token_current IS NULL
     OR phone_change IS NULL OR phone_change_token IS NULL OR reauthentication_token IS NULL;"

PSQL -q -c "DROP SCHEMA IF EXISTS migration_tmp CASCADE;"
echo "Auth password import complete."
