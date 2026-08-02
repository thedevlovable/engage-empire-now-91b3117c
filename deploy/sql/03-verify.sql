-- ============================================================
-- 03-verify.sql — Import ke baad source vs target comparison
-- EXPECTED column me Lovable Cloud ke actual numbers hard-coded hain
-- (snapshot: migration ke din liya gaya).
-- Chalane ka tareeka:
--   docker exec -i extips-db psql -U postgres -d postgres -f - < deploy/sql/03-verify.sql
-- Har row ka STATUS 'OK' hona chahiye. Ek bhi 'MISMATCH' => import adhoora hai.
-- ============================================================
WITH actual AS (
  SELECT 'auth.users'               AS tbl, (SELECT count(*) FROM auth.users)                     AS got, 481::bigint AS expected
  UNION ALL SELECT 'profiles',                (SELECT count(*) FROM public.profiles),                481
  UNION ALL SELECT 'wallets',                 (SELECT count(*) FROM public.wallets),                 481
  UNION ALL SELECT 'user_roles',              (SELECT count(*) FROM public.user_roles),              481
  UNION ALL SELECT 'subscriptions',           (SELECT count(*) FROM public.subscriptions),           481
  UNION ALL SELECT 'orders',                  (SELECT count(*) FROM public.orders),                    0
  UNION ALL SELECT 'engagement_orders',       (SELECT count(*) FROM public.engagement_orders),      1961
  UNION ALL SELECT 'engagement_order_items',  (SELECT count(*) FROM public.engagement_order_items), 5493
  UNION ALL SELECT 'organic_run_schedule',    (SELECT count(*) FROM public.organic_run_schedule),  51490
  UNION ALL SELECT 'transactions',            (SELECT count(*) FROM public.transactions),           2475
  UNION ALL SELECT 'services',                (SELECT count(*) FROM public.services),                 17
  UNION ALL SELECT 'providers',               (SELECT count(*) FROM public.providers),                 5
  UNION ALL SELECT 'provider_accounts',       (SELECT count(*) FROM public.provider_accounts),         4
  UNION ALL SELECT 'service_provider_mapping',(SELECT count(*) FROM public.service_provider_mapping), 21
  UNION ALL SELECT 'zapupi_deposits',         (SELECT count(*) FROM public.zapupi_deposits),         559
  UNION ALL SELECT 'oxapay_deposits',         (SELECT count(*) FROM public.oxapay_deposits),         109
  UNION ALL SELECT 'support_tickets',         (SELECT count(*) FROM public.support_tickets),          41
)
SELECT tbl, expected, got,
       CASE WHEN got = expected THEN 'OK' ELSE 'MISMATCH  <<<<<' END AS status
  FROM actual ORDER BY status DESC, tbl;

-- ---------- Money must match to the last paisa ----------
SELECT 'wallet_total_balance' AS metric,
       115.252757::numeric    AS expected,
       ROUND(SUM(balance)::numeric, 6) AS got,
       CASE WHEN ROUND(SUM(balance)::numeric,6) = 115.252757 THEN 'OK' ELSE 'MISMATCH  <<<<<' END AS status
  FROM public.wallets;

-- ---------- Auth health (login tootne ke top 3 reasons) ----------
SELECT 'users_without_bcrypt_hash' AS check, count(*) AS bad,
       CASE WHEN count(*) = 0 THEN 'OK' ELSE 'FIX: 01-auth-fix.sql chalao' END AS status
  FROM auth.users WHERE encrypted_password IS NULL OR encrypted_password NOT LIKE '$2%'
UNION ALL
SELECT 'users_with_null_tokens', count(*),
       CASE WHEN count(*) = 0 THEN 'OK' ELSE 'FIX: 01-auth-fix.sql chalao' END
  FROM auth.users WHERE confirmation_token IS NULL OR recovery_token IS NULL
UNION ALL
SELECT 'users_missing_instance_id_or_aud', count(*),
       CASE WHEN count(*) = 0 THEN 'OK' ELSE 'FIX: 01-auth-fix.sql chalao' END
  FROM auth.users WHERE instance_id IS NULL OR COALESCE(aud,'') = ''
UNION ALL
SELECT 'users_missing_email_identity', count(*),
       CASE WHEN count(*) = 0 THEN 'OK' ELSE 'FIX: 01-auth-fix.sql chalao' END
  FROM auth.users u WHERE u.email IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider='email')
UNION ALL
SELECT 'unconfirmed_emails', count(*),
       CASE WHEN count(*) = 0 THEN 'OK' ELSE 'FIX: 01-auth-fix.sql chalao' END
  FROM auth.users WHERE email_confirmed_at IS NULL;

-- ---------- Admin role bacha hai? ----------
SELECT 'admin_users' AS check, count(*) AS got,
       CASE WHEN count(*) >= 1 THEN 'OK' ELSE 'MISMATCH: koi admin nahi!' END AS status
  FROM public.user_roles WHERE role = 'admin';

-- ---------- RLS har user table par ON hai? ----------
SELECT 'tables_without_rls' AS check, count(*) AS got,
       CASE WHEN count(*) = 0 THEN 'OK' ELSE 'WARNING: RLS off — dump adhoora' END AS status
  FROM pg_tables t
 WHERE t.schemaname = 'public'
   AND NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                    WHERE n.nspname='public' AND c.relname=t.tablename AND c.relrowsecurity);

-- ---------- GRANTs aaye? (PostgREST inke bina 401/permission denied dega) ----------
SELECT 'tables_missing_authenticated_grant' AS check, count(*) AS got,
       CASE WHEN count(*) = 0 THEN 'OK' ELSE 'FIX: GRANT statements re-run karo' END AS status
  FROM pg_tables t
 WHERE t.schemaname='public'
   AND NOT has_table_privilege('authenticated', format('public.%I', t.tablename), 'SELECT');

-- ---------- Triggers + functions count (informational) ----------
SELECT 'db_functions' AS what, count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
UNION ALL
SELECT 'triggers', count(*) FROM pg_trigger WHERE NOT tgisinternal;
