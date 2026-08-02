-- ============================================================
-- 02-reset-sequences.sql
-- Data import ke baad sequences peeche reh jaate hain -> naya insert
-- "duplicate key value violates unique constraint" deta hai.
-- Ye script public schema ki HAR sequence ko uske column ke max par set karta hai.
-- Safe + idempotent.
-- ============================================================
DO $$
DECLARE
  r record;
  v_max bigint;
BEGIN
  FOR r IN
    SELECT s.relname            AS seq,
           t.relname            AS tbl,
           a.attname            AS col
      FROM pg_class s
      JOIN pg_depend d   ON d.objid = s.oid AND d.classid = 'pg_class'::regclass
      JOIN pg_class t    ON t.oid = d.refobjid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
      JOIN pg_namespace n ON n.oid = s.relnamespace
     WHERE s.relkind = 'S' AND n.nspname = 'public'
  LOOP
    EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM public.%I', r.col, r.tbl) INTO v_max;
    EXECUTE format('SELECT setval(''public.%I'', %s, true)', r.seq, GREATEST(v_max, 1));
    RAISE NOTICE 'sequence %  ->  % (from %.%)', r.seq, GREATEST(v_max, 1), r.tbl, r.col;
  END LOOP;
END $$;

-- order_number sequences alag se confirm karo (ye user-facing numbers hain)
SELECT 'orders.order_number max'            AS what, COALESCE(MAX(order_number),0) AS val FROM public.orders
UNION ALL
SELECT 'engagement_orders.order_number max', COALESCE(MAX(order_number),0)         FROM public.engagement_orders;
