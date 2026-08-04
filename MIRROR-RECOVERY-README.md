# MIRROR RECOVERY — Emergency Runbook (15–20 min)

Main project down/suspended? Mirror project has all data + users (with original
password hashes) synced every 6 hours by the `backup-mirror` edge function.

## 0. One-time setup (do this NOW, before any outage)

1. Mirror project ke SQL Editor me `mirror-schema.sql` run karo (tables banayega).
2. Secrets already saved in main project: `MIRROR_SUPABASE_URL`,
   `MIRROR_SUPABASE_SERVICE_KEY`.
3. Cron `backup-mirror-6h` har 6 ghante chalta hai (`0 */6 * * *`).
4. Manual run (anytime):
   ```bash
   curl -X POST "https://<main-project>.supabase.co/functions/v1/backup-mirror" \
     -H "x-cron-secret: <token from internal_cron_tokens name='backup-mirror'>" \
     -H "Content-Type: application/json" -d '{"full":true}'
   ```

## 1. Restore users (login + old passwords)

Mirror project SQL Editor → run `mirror-recovery-import.sql`.
Output me `auth_users` ≈ `auth_mirror_rows` hona chahiye.

## 2. Auth settings in mirror project

- Email provider ON, **Confirm email OFF** (users already confirmed).
- Site URL + Redirect URLs = your domain (`https://extipspanel.com`, `https://www.extipspanel.com`).
- Google / other providers jo main project me the, wahi enable karo.

## 3. Frontend switch

`.env` (ya `.env.production`) me mirror values daalo:

```
VITE_SUPABASE_URL=https://<mirror-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<mirror project anon/publishable key>
VITE_SUPABASE_PROJECT_ID=<mirror-ref>
```

Then: `npm ci && npm run build` → deploy/serve `dist/`.

## 4. Edge functions + secrets

- `supabase/functions/*` mirror project me deploy karo.
- Secrets dobara set karo: `ZAPUPI_TOKEN_KEY`, `ZAPUPI_SECRET_KEY`,
  `OXAPAY_MERCHANT_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`,
  `INTERNAL_CRON_TOKEN`, `CRON_SHARED_SECRET`, plus `MIRROR_*` if you set up a
  new mirror-of-the-mirror.
- Payment gateways ke webhook URLs ko naye project URL par update karo.

## 5. Cron jobs re-schedule (mirror project SQL Editor)

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('organic-runs-minutely', '* * * * *', $$
  select net.http_post(
    url:='https://<mirror-ref>.supabase.co/functions/v1/execute-all-runs',
    headers:='{"Content-Type":"application/json","apikey":"<mirror anon key>"}'::jsonb,
    body:='{}'::jsonb);
$$);

select cron.schedule('check-order-status-every-5-min', '*/5 * * * *', $$
  select net.http_post(
    url:='https://<mirror-ref>.supabase.co/functions/v1/check-order-status',
    headers:='{"Content-Type":"application/json","apikey":"<mirror anon key>"}'::jsonb,
    body:='{}'::jsonb);
$$);
```

## 6. Final verify checklist

- [ ] Old email + old password se login ho raha hai
- [ ] Dashboard me name, email, wallet balance dikh raha hai
- [ ] Orders + engagement orders history dikh rahi hai
- [ ] Transactions / fund history dikh rahi hai
- [ ] Admin panel (`user_roles` admin row) accessible hai
- [ ] Services list load ho rahi hai (`services`, `provider_accounts`)
- [ ] Naya order place ho raha hai; sequence errors nahi
      (`select setval(pg_get_serial_sequence('orders','order_number'),
        (select coalesce(max(order_number),1) from orders));` — engagement_orders ke liye bhi)
- [ ] Maintenance mode OFF (`platform_settings.maintenance_mode = false`)
- [ ] Payment webhooks naye URL par test ho gaye

## Notes

- Mirror me RLS enabled hai lekin koi policy nahi — sirf service_role likh sakta hai.
  Recovery ke baad, jo tables app se padhni hain unke original policies
  (`supabase/migrations`) mirror me apply karna zaroori hai.
- Mirror ek data backup hai: triggers/functions/FKs nahi hain. Full app behaviour
  ke liye repo ki migrations mirror project pe apply karo.
