#!/usr/bin/env bash
# ONE-SHOT auth migration: Cloud export -> /opt/migration/06_auth_users.json -> VPS auth.users
# Restores SAME UUID, SAME email, SAME OLD PASSWORD. No user data is deleted.
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/smmpanel}"
MIG_DIR="${MIG_DIR:-/opt/migration}"
STACK_DIR="${STACK_DIR:-/opt/supabase}"
JSON_FILE="$MIG_DIR/06_auth_users.json"

EXPORT_URL="https://nydafzsnbvsessixqvjl.supabase.co/functions/v1/migrate-auth-export"
MIGRATION_TOKEN="${MIGRATION_TOKEN:-mig_7Qk29xTdV4pLbR8mZs3Ywc6HnAe1Ug5J}"

mkdir -p "$MIG_DIR"

echo "==> 1/6 Downloading secure auth export from Cloud"
HTTP=$(curl -s -o "$JSON_FILE" -w '%{http_code}' \
  -H "x-migration-token: $MIGRATION_TOKEN" "$EXPORT_URL")
if [ "$HTTP" != "200" ] || [ ! -s "$JSON_FILE" ]; then
  echo "ERROR: export failed (http $HTTP). Import aborted."; rm -f "$JSON_FILE"; exit 1
fi
python3 - "$JSON_FILE" <<'PY'
import json,sys
d=json.load(open(sys.argv[1]))
u=d.get("users") if isinstance(d,dict) else d
if not u: sys.exit("ERROR: export contains 0 users — aborting.")
print(f"exported_users={len(u)}")
PY

echo "==> 2/6 Importing password hashes"
bash "$REPO_DIR/deploy/import-auth-passwords.sh" "$JSON_FILE"

echo "==> 3/6 Restarting auth container"
if [ -f "$STACK_DIR/docker/docker-compose.yml" ]; then
  (cd "$STACK_DIR/docker" && docker compose restart auth) || true
else
  docker restart "$(docker ps --format '{{.Names}}' | grep -Ei 'auth|gotrue' | head -1)" || true
fi
sleep 8

echo "==> 4/6 Old-password login test (credentials are NOT printed)"
API_BASE="${API_BASE:-https://extipspanel.com}"
ANON_KEY="${ANON_KEY:-$(grep -m1 '^ANON_KEY=' "$STACK_DIR/docker/.env" 2>/dev/null | cut -d= -f2-)}"
test_login() {
  read -rp "  $1 email: " E
  read -srp "  $1 old password: " P; echo
  CODE=$(curl -s -o /tmp/lt.json -w '%{http_code}' \
    -X POST "$API_BASE/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
    -d "{\"email\":\"$E\",\"password\":\"$P\"}")
  if grep -q '"access_token"' /tmp/lt.json 2>/dev/null; then
    echo "  RESULT: $1 LOGIN_SUCCESS"
  else
    echo "  RESULT: $1 LOGIN_FAILED (http $CODE)"; FAILED=1
  fi
  rm -f /tmp/lt.json; unset E P
}
FAILED=0
test_login "ADMIN"
test_login "USER"

if [ "$FAILED" = "1" ]; then
  echo "==> Re-running hash sync once (HASH_MISMATCH recovery)"
  bash "$REPO_DIR/deploy/import-auth-passwords.sh" "$JSON_FILE"
  (cd "$STACK_DIR/docker" && docker compose restart auth) || true
  sleep 8
  FAILED=0; test_login "RETRY"
fi

echo "==> 5/6 Removing local export file"
shred -u "$JSON_FILE" 2>/dev/null || rm -f "$JSON_FILE"

echo "==> 6/6 Done."
if [ "$FAILED" = "1" ]; then
  echo "STATUS: login still failing — tell Lovable to re-check the Cloud export."
  exit 1
fi
echo "STATUS: OLD EMAIL + OLD PASSWORD LOGIN WORKING ON VPS."
echo "Ab Lovable chat me likho: 'migration done, cleanup karo' — main export function aur token delete kar dunga."
