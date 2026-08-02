#!/usr/bin/env bash
# ============================================================
# repair-wallets.sh — wallet balance vs transaction ledger mismatch
#
#   bash repair-wallets.sh            -> DRY RUN (sirf report, kuch change nahi)
#   bash repair-wallets.sh --apply    -> actual fix (confirm maangega)
#
# Logic: wallet.balance ko transactions ledger se recompute karta hai:
#        deposit + refund  (credit)  minus  order_payment  (debit)
# ============================================================
set -euo pipefail

DB_CONTAINER="extips-db"
APPLY="${1:-}"

grn(){ printf '\033[32m%s\033[0m\n' "$*"; }
red(){ printf '\033[31m%s\033[0m\n' "$*"; }
ylw(){ printf '\033[33m%s\033[0m\n' "$*"; }

psql_run(){ docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres "$@"; }

REPORT_SQL="
WITH ledger AS (
  SELECT user_id,
         ROUND(COALESCE(SUM(CASE WHEN type IN ('deposit','refund')  THEN amount ELSE 0 END),0)
             - COALESCE(SUM(CASE WHEN type IN ('order_payment','order') THEN amount ELSE 0 END),0), 6) AS expected
    FROM public.transactions WHERE status='completed' GROUP BY user_id
)
SELECT w.user_id, p.email,
       ROUND(w.balance::numeric,6) AS current_balance,
       COALESCE(l.expected,0)      AS ledger_balance,
       ROUND(w.balance::numeric - COALESCE(l.expected,0), 6) AS diff
  FROM public.wallets w
  LEFT JOIN ledger l  ON l.user_id = w.user_id
  LEFT JOIN public.profiles p ON p.user_id = w.user_id
 WHERE ABS(ROUND(w.balance::numeric - COALESCE(l.expected,0), 6)) > 0.000001
 ORDER BY ABS(w.balance::numeric - COALESCE(l.expected,0)) DESC;
"

grn "==> Mismatch report (dry run)"
psql_run -c "$REPORT_SQL"

COUNT=$(psql_run -At -c "SELECT count(*) FROM ($REPORT_SQL) x")
grn "==> Mismatched wallets: $COUNT"

if [[ "$COUNT" -eq 0 ]]; then
  grn "Sab wallets ledger se match karte hain. Kuch karne ki zaroorat nahi."
  exit 0
fi

if [[ "$APPLY" != "--apply" ]]; then
  ylw "Ye DRY RUN tha — koi balance change nahi hua."
  ylw "Fix karne ke liye: bash repair-wallets.sh --apply"
  exit 0
fi

red "!! WARNING: ye REAL user balances badlega ($COUNT wallets)."
red "!! Pehle backup lo: bash /opt/extips/deploy/backup.sh"
read -rp "Type 'REPAIR' to continue: " ok
[[ "$ok" == "REPAIR" ]] || { ylw "Aborted — kuch change nahi hua."; exit 0; }

psql_run -v ON_ERROR_STOP=1 <<SQL
BEGIN;
WITH ledger AS (
  SELECT user_id,
         ROUND(COALESCE(SUM(CASE WHEN type IN ('deposit','refund')  THEN amount ELSE 0 END),0)
             - COALESCE(SUM(CASE WHEN type IN ('order_payment','order') THEN amount ELSE 0 END),0), 6) AS expected
    FROM public.transactions WHERE status='completed' GROUP BY user_id
)
UPDATE public.wallets w
   SET balance = GREATEST(0, COALESCE(l.expected, 0)),
       updated_at = now()
  FROM ledger l
 WHERE l.user_id = w.user_id
   AND ABS(ROUND(w.balance::numeric - l.expected, 6)) > 0.000001;
COMMIT;
SQL

grn "==> Repair done. Re-verify:"
psql_run -c "$REPORT_SQL"
psql_run -At -c "SELECT 'new wallet total = ' || ROUND(SUM(balance)::numeric,6) FROM public.wallets;"
