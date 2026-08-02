#!/usr/bin/env bash
# ============================================================
# health-check.sh — containers + endpoints + queue health
# Usage: bash /opt/extips/deploy/health-check.sh
# Read-only. Kuch restart/delete nahi karta.
# ============================================================
set -uo pipefail

PROJECT="extips"
DOMAIN="${EXTIPS_DOMAIN:-panel.example.com}"
API_DOMAIN="${EXTIPS_API_DOMAIN:-api.panel.example.com}"
DB_CONTAINER="extips-db"
FAIL=0

grn(){ printf '\033[32m%s\033[0m\n' "$*"; }
red(){ printf '\033[31m%s\033[0m\n' "$*"; FAIL=1; }
ylw(){ printf '\033[33m%s\033[0m\n' "$*"; }

echo "=========== 1. EXTIPS CONTAINERS ==========="
for c in extips-db extips-kong extips-auth extips-rest extips-storage extips-functions extips-realtime; do
  st=$(docker inspect -f '{{.State.Status}}' "$c" 2>/dev/null || echo "missing")
  [[ "$st" == "running" ]] && grn "  $c: running" || red "  $c: $st"
done

echo
echo "=========== 2. PURANA PROJECT SAFE HAI? ==========="
OTHER=$(docker ps --format '{{.Names}}\t{{.Status}}' | grep -v '^extips-' || true)
if [[ -n "$OTHER" ]]; then
  echo "$OTHER" | while IFS= read -r l; do grn "  $l"; done
else
  ylw "  koi non-extips container running nahi hai (check karo ye expected hai)"
fi

echo
echo "=========== 3. ENDPOINTS ==========="
check_url() {
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$1" || echo 000)
  if [[ "$code" =~ ^(200|301|302|401|404)$ ]]; then grn "  $1 -> $code"; else red "  $1 -> $code"; fi
}
check_url "http://127.0.0.1:8100/rest/v1/"
check_url "http://127.0.0.1:8100/auth/v1/health"
check_url "https://$DOMAIN"
check_url "https://$API_DOMAIN/auth/v1/health"

echo
echo "=========== 4. DATABASE ==========="
if docker exec "$DB_CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then
  grn "  postgres: accepting connections"
  docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -At -c "
    SELECT 'users=' || (SELECT count(*) FROM auth.users)
        || ' | wallet_total=' || (SELECT ROUND(COALESCE(SUM(balance),0)::numeric,4) FROM public.wallets)
        || ' | eng_orders=' || (SELECT count(*) FROM public.engagement_orders)
        || ' | db_size=' || pg_size_pretty(pg_database_size('postgres'));" | sed 's/^/  /'
else
  red "  postgres: NOT ready"
fi

echo
echo "=========== 5. DELIVERY QUEUE ==========="
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -At -F' | ' -c "
  SELECT 'overdue_pending=' || count(*) FILTER (WHERE status='pending' AND scheduled_at <= now()),
         'pending_total='   || count(*) FILTER (WHERE status='pending'),
         'failed_24h='      || count(*) FILTER (WHERE status='failed' AND created_at > now()-interval '24 hours'),
         'done_1h='         || count(*) FILTER (WHERE status='completed' AND completed_at > now()-interval '1 hour')
    FROM public.organic_run_schedule;" 2>/dev/null | sed 's/^/  /' || red "  queue query fail"

echo
echo "=========== 6. TIMERS ==========="
systemctl list-timers --all 2>/dev/null | grep -E 'extips|NEXT' | sed 's/^/  /' || ylw "  koi extips timer nahi mila"

echo
echo "=========== 7. DISK / MEMORY ==========="
df -h / | tail -1 | sed 's/^/  /'
free -h | sed -n '2p' | sed 's/^/  /'

echo
[[ "$FAIL" -eq 0 ]] && grn "===== ALL CHECKS PASSED =====" || red "===== KUCH CHECKS FAIL HUE (upar red lines dekho) ====="
exit $FAIL
