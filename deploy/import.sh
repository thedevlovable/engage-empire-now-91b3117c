#!/usr/bin/env bash
# ============================================================
# import.sh — Lovable Cloud dump ko naye VPS stack me import karta hai
#
# Usage:
#   sudo bash /opt/extips/deploy/import.sh /root/extips-cloud-dump.sql
#
# NOTE: purane project ko chhoota nahi — sirf extips-db container se baat karta hai.
# ============================================================
set -euo pipefail

DUMP="${1:-}"
DB_CONTAINER="extips-db"
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

red()  { printf '\033[31m%s\033[0m\n' "$*"; }
grn()  { printf '\033[32m%s\033[0m\n' "$*"; }
ylw()  { printf '\033[33m%s\033[0m\n' "$*"; }

[[ -n "$DUMP" ]] || { red "Usage: bash import.sh <dump-file.sql>"; exit 1; }
[[ -f "$DUMP" ]] || { red "Dump file nahi mila: $DUMP"; exit 1; }

# --- Safety: sirf extips-db par kaam karega, aur wo chal raha ho ---
if ! docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  red "Container '$DB_CONTAINER' running nahi hai."
  ylw "Pehle stack start karo:"
  ylw "  cd /opt/extips/supabase/docker && docker compose -p extips -f docker-compose.yml -f /opt/extips/docker-compose.override.yml up -d"
  exit 1
fi

psql_run() { docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=0 "$@"; }

grn "==> [0/5] Target DB me pehle se data hai kya? (safety check)"
EXISTING=$(psql_run -At -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" || echo 0)
ylw "    public schema me abhi $EXISTING table(s) hain."
if [[ "$EXISTING" -gt 5 ]]; then
  red "!! WARNING: target DB already populated lag raha hai."
  red "!! Dubara import karne se duplicate/conflict errors aayenge."
  read -rp "Aage badhna hai? (type: yes) " ok
  [[ "$ok" == "yes" ]] || { ylw "Aborted — kuch change nahi hua."; exit 0; }
fi

grn "==> [1/5] Dump restore (schema + data + RLS + triggers + functions + grants)"
ylw "    Bade dump me time lagega. 'already exists' warnings normal hain."
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres < "$DUMP" \
  2> >(tee /tmp/extips-import-errors.log >&2) || true
ylw "    Errors/warnings yahan save hue: /tmp/extips-import-errors.log"

grn "==> [2/5] Auth fixes (NULL tokens, instance_id, aud, identities, email_confirmed_at)"
psql_run -f - < "$DEPLOY_DIR/sql/01-auth-fix.sql"

grn "==> [3/5] Sequences reset"
psql_run -f - < "$DEPLOY_DIR/sql/02-reset-sequences.sql"

grn "==> [4/5] pg_cron jobs disable (self-hosted par unreliable — systemd timers use karenge)"
psql_run -c "DO \$\$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job;
    RAISE NOTICE 'saare pg_cron jobs unschedule ho gaye';
  ELSE
    RAISE NOTICE 'pg_cron installed nahi hai — kuch karne ki zaroorat nahi';
  END IF;
END \$\$;" || true

grn "==> [5/5] Verification (source vs target)"
psql_run -f - < "$DEPLOY_DIR/sql/03-verify.sql"

echo
grn "================ IMPORT DONE ================"
ylw "Upar ke table me HAR row ka status 'OK' hona chahiye."
ylw "Ek bhi 'MISMATCH' dikhe to /tmp/extips-import-errors.log check karo."
ylw "Next: bash deploy/deploy-edge-functions.sh"
