# Extips Panel — VPS Self-Host Runbook

Ye folder poora migration toolkit hai. Har phase ka script/config yahin hai.
Purana project **kabhi touch nahi hota** — sab kuch alag project name, alag network,
alag ports, alag directory par chalta hai.

## Naming / port map (purane project se clash-free)

| Cheez | Value |
|---|---|
| Compose project name | `extips` |
| Container prefix | `extips-` |
| Docker network | `extips-net` |
| Install dir | `/opt/extips/` |
| Kong HTTP | `8100` |
| Kong HTTPS | `8543` |
| Postgres | `5533` |
| Studio | `3100` |
| Analytics | `4100` |
| Pooler | `6643` |

## Migration baseline (source = Lovable Cloud, snapshot liya gaya)

Import ke baad ye numbers **exactly match** hone chahiye:

| Table | Rows |
|---|---|
| auth.users | 481 |
| profiles | 481 |
| wallets | 481 (total balance `115.252757`) |
| user_roles | 481 |
| subscriptions | 481 |
| orders | 0 |
| engagement_orders | 1961 |
| engagement_order_items | 5493 |
| organic_run_schedule | 51490 |
| transactions | 2475 |
| services | 17 |
| providers | 5 |
| provider_accounts | 4 |
| service_provider_mapping | 21 |
| zapupi_deposits | 559 |
| oxapay_deposits | 109 |
| support_tickets | 41 |

`deploy/sql/03-verify.sql` ye sab automatically check karta hai.

## Phase order

| Phase | Kaam | File |
|---|---|---|
| 1 | Cloud se dump nikalna | product UI: **Cloud → Advanced settings → Export data** |
| 2 | VPS par stack khada karna | `docker-compose.override.yml` + `.env.example` |
| 3 | Data import + auth fix | `import.sh`, `sql/01-auth-fix.sql`, `sql/02-reset-sequences.sql` |
| 3b | Verify | `sql/03-verify.sql` |
| 4 | Edge functions | `deploy-edge-functions.sh` |
| 5 | Cron → systemd timers | `systemd/install-timers.sh` |
| 6 | Reverse proxy + SSL | `caddy/extips.Caddyfile` |
| 7 | Frontend build/deploy | `update.sh` |
| 9 | Maintenance | `backup.sh`, `health-check.sh`, `repair-wallets.sh`, `sql/optimize-db.sql` |

## ⚠️ Kabhi mat chalana (purana project mar jayega)

```
docker system prune          # purane project ke volumes/images udega
docker compose down          # -p flag ke bina => galat project band hoga
docker volume prune
```

Sahi tareeka: **hamesha `-p extips` flag ke saath**, aur override file specify karke.

```bash
cd /opt/extips/supabase/docker
docker compose -p extips -f docker-compose.yml -f /opt/extips/docker-compose.override.yml ps
```
