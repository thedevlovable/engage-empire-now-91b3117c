#!/usr/bin/env bash
# ============================================================
# update.sh — code update + frontend rebuild + deploy
# Usage: sudo bash /opt/extips/deploy/update.sh
# Non-destructive: purane project ko touch nahi karta.
# ============================================================
set -euo pipefail

REPO_DIR="/opt/extips/app"
WEB_ROOT="/var/www/extips"
DOCKER_DIR="/opt/extips/supabase/docker"
OVERRIDE="/opt/extips/docker-compose.override.yml"

grn(){ printf '\033[32m%s\033[0m\n' "$*"; }
ylw(){ printf '\033[33m%s\033[0m\n' "$*"; }

cd "$REPO_DIR"

grn "==> [1/6] git pull"
git pull --ff-only

grn "==> [2/6] dependencies"
npm ci

grn "==> [3/6] frontend build (.env se VITE_* uthega)"
[[ -f .env ]] || { ylw "WARNING: $REPO_DIR/.env nahi hai — build me Supabase URL undefined aayega!"; }
npm run build

grn "==> [4/6] dist -> $WEB_ROOT (atomic swap, downtime ~0)"
mkdir -p "$WEB_ROOT"
rsync -a --delete dist/ "$WEB_ROOT/"
chown -R www-data:www-data "$WEB_ROOT" 2>/dev/null || true

grn "==> [5/6] edge functions sync"
bash /opt/extips/deploy/deploy-edge-functions.sh || ylw "edge deploy me issue — upar dekho"

grn "==> [6/6] proxy reload (sirf config reload, restart nahi -> purana site up rahega)"
if systemctl is-active --quiet caddy; then
  caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy && grn "    caddy reloaded"
elif systemctl is-active --quiet nginx; then
  nginx -t && systemctl reload nginx && grn "    nginx reloaded"
else
  ylw "    koi systemd proxy nahi mila — manually reload karo"
fi

grn "==> DONE"
bash /opt/extips/deploy/health-check.sh || true
