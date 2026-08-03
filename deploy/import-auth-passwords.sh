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

# Detect postgres container if not provided
if [ -z "$DB_CONTAINER" ]; then
  DB_CONTAINER="$(docker ps --format '{{.Names}}' | grep -Ei 'supabase[-_]db|extips-db|(^|[-_])db($|[-_])' | head -1 || true)"
fi
if [ -z "$DB_CONTAINER" ]; then
  echo "ERROR: postgres container not found. Set DB_CONTAINER=<name> and retry."
  exit 1
fi
echo "DB container: $DB_CONTAINER"

PSQL="docker exec -i $DB_CONTAINER psql -U postgres -d postgres -v ON_ERROR_STOP=1"

# Normalize JSON to a flat array of users (accepts {users:[...]} or [...]).
TMP_JSON="$(mktemp /tmp/authmig.XXXXXX.json)"
trap 'rm -f "$TMP_JSON"' EXIT
python3 - "$JSON_FILE" "$TMP_JSON" <<'PY'
import json,sys
raw=json.load(open(sys.argv[1]))
users = raw.get("users") if isinstance(raw,dict) else raw
if not users:
    print("ERROR: no users in export file"); sys.exit(1)
out=[]
for u in users:
    if not u.get("id") or not u.get("email"): continue
    out.append(u)
if not out:
    print("ERROR: no valid user rows"); sys.exit(1)
json.dump(out, open(sys.argv[2],"w"))
print(f"parsed users: {len(out)}")
PY

echo "Loading staging table..."
$PSQL <<'SQL'
CREATE SCHEMA IF NOT EXISTS migration_tmp;
DROP TABLE IF EXISTS migration_tmp.auth_import;
CREATE TABLE migration_tmp.auth_import (doc jsonb);
SQL

# Stream JSON in as a single jsonb doc (no hash echoed to stdout)
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "COPY migration_tmp.auth_import (doc) FROM STDIN" < <(python3 -c '
import json,sys
d=open(sys.argv[1]).read()
sys.stdout.write(d.replace("\\","\\\\").replace("\r","").replace("\n","")+"\n")
' "$TMP_JSON")

echo "Applying users (transaction)..."
$PSQL <<'SQL'
BEGIN;

CREATE TEMP TABLE src AS
SELECT (u->>'id')::uuid                                   AS id,
       lower(btrim(u->>'email'))                          AS email,
       u->>'encrypted_password'                           AS pw,
       NULLIF(u->>'email_confirmed_at','')::timestamptz    AS email_confirmed_at,
       COALESCE(u->'raw_user_meta_data','{}'::jsonb)       AS meta,
       COALESCE(u->'raw_app_meta_data',
                '{"provider":"email","providers":["email"]}'::jsonb) AS app_meta,
       COALESCE(NULLIF(u->>'created_at','')::timestamptz, now()) AS created_at,
       COALESCE(NULLIF(u->>'updated_at','')::timestamptz, now()) AS updated_at,
       NULLIF(u->>'last_sign_in_at','')::timestamptz        AS last_sign_in_at,
       NULLIF(u->>'phone','')                              AS phone
FROM migration_tmp.auth_import, jsonb_array_elements(doc) AS u
WHERE u->>'encrypted_password' ~ '^\$2[aby]\$';

-- 1. UPDATE existing users matched by UUID
WITH upd AS (
  UPDATE auth.users t SET
    encrypted_password = s.pw,
    email              = COALESCE(t.email, s.email),
    email_confirmed_at = COALESCE(t.email_confirmed_at, s.email_confirmed_at, s.created_at),
    raw_user_meta_data = COALESCE(t.raw_user_meta_data, s.meta),
    raw_app_meta_data  = COALESCE(t.raw_app_meta_data, s.app_meta),
    updated_at         = now()
  FROM src s WHERE t.id = s.id
  RETURNING t.id
) SELECT count(*) AS updated_by_uuid FROM upd \gset _u
SELECT :'_uupdated_by_uuid' IS NOT NULL;

-- 2. UPDATE existing users matched by email (different UUID)
UPDATE auth.users t SET
  encrypted_password = s.pw,
  email_confirmed_at = COALESCE(t.email_confirmed_at, s.email_confirmed_at, s.created_at),
  updated_at         = now()
FROM src s
WHERE lower(t.email) = s.email
  AND t.id <> s.id
  AND NOT EXISTS (SELECT 1 FROM auth.users x WHERE x.id = s.id);

-- 3. INSERT missing users with SAME uuid + email
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, last_sign_in_at, raw_user_meta_data, raw_app_meta_data,
  phone, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new,
  email_change, email_change_token_current, phone_change, phone_change_token,
  reauthentication_token
)
SELECT '00000000-0000-0000-0000-000000000000', s.id, 'authenticated', 'authenticated',
       s.email, s.pw, COALESCE(s.email_confirmed_at, s.created_at),
       s.created_at, s.updated_at, s.last_sign_in_at, s.meta, s.app_meta,
       s.phone, false, '', '', '', '', '', '', '', ''
FROM src s
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
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = u.id AND i.provider = 'email'
  );

-- 5. GoTrue compatibility: NULL tokens -> empty string, safe defaults
UPDATE auth.users SET
  confirmation_token         = COALESCE(confirmation_token, ''),
  recovery_token             = COALESCE(recovery_token, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change               = COALESCE(email_change, ''),
  phone_change               = COALESCE(phone_change, ''),
  phone_change_token         = COALESCE(phone_change_token, ''),
  reauthentication_token     = COALESCE(reauthentication_token, ''),
  aud                        = COALESCE(NULLIF(aud,''), 'authenticated'),
  role                       = COALESCE(NULLIF(role,''), 'authenticated'),
  instance_id                = COALESCE(instance_id, '00000000-0000-0000-0000-000000000000'),
  email_confirmed_at         = COALESCE(email_confirmed_at, created_at, now())
WHERE confirmation_token IS NULL OR recovery_token IS NULL
   OR email_change_token_new IS NULL OR email_change_token_current IS NULL
   OR email_change IS NULL OR phone_change IS NULL OR phone_change_token IS NULL
   OR reauthentication_token IS NULL OR aud IS NULL OR aud = ''
   OR role IS NULL OR role = '' OR instance_id IS NULL
   OR email_confirmed_at IS NULL;

COMMIT;
SQL

echo "Verification:"
$PSQL -Atc "
SELECT 'total_users=' || count(*) FROM auth.users
UNION ALL SELECT 'valid_bcrypt_hashes=' || count(*) FROM auth.users WHERE encrypted_password ~ '^\$2[aby]\$'
UNION ALL SELECT 'email_identities=' || count(*) FROM auth.identities WHERE provider='email'
UNION ALL SELECT 'null_token_rows=' || count(*) FROM auth.users
  WHERE confirmation_token IS NULL OR recovery_token IS NULL OR email_change IS NULL
     OR email_change_token_new IS NULL OR email_change_token_current IS NULL
     OR phone_change IS NULL OR phone_change_token IS NULL OR reauthentication_token IS NULL;"

$PSQL -c "DROP SCHEMA IF EXISTS migration_tmp CASCADE;" >/dev/null
echo "Auth password import complete."
