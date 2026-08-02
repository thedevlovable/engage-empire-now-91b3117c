#!/usr/bin/env bash
# ============================================================
# deploy-edge-functions.sh
# Saari edge functions ko self-hosted functions container me le jaata hai
# aur secrets inject + verify karta hai.
#
# Usage: sudo bash /opt/extips/deploy/deploy-edge-functions.sh
# ============================================================
set -euo pipefail

PROJECT="extips"
FN_CONTAINER="extips-functions"
DOCKER_DIR="/opt/extips/supabase/docker"
REPO_DIR="/opt/extips/app"                 # jahan git repo clone hai
ENV_FILE="$DOCKER_DIR/.env"
OVERRIDE="/opt/extips/docker-compose.override.yml"

grn(){ printf '\033[32m%s\033[0m\n' "$*"; }
red(){ printf '\033[31m%s\033[0m\n' "$*"; }
ylw(){ printf '\033[33m%s\033[0m\n' "$*"; }

[[ -f "$ENV_FILE" ]] || { red ".env nahi mila: $ENV_FILE (deploy/.env.example se banao)"; exit 1; }
[[ -d "$REPO_DIR/supabase/functions" ]] || { red "functions folder nahi mila: $REPO_DIR/supabase/functions"; exit 1; }

grn "==> [1/5] Function code copy -> $DOCKER_DIR/volumes/functions/"
mkdir -p "$DOCKER_DIR/volumes/functions"
rsync -a --delete \
  --exclude '*_test.ts' --exclude '*.test.ts' \
  "$REPO_DIR/supabase/functions/" "$DOCKER_DIR/volumes/functions/"
COUNT=$(find "$DOCKER_DIR/volumes/functions" -maxdepth 1 -mindepth 1 -type d | wc -l)
grn "    $COUNT function(s) copy hui"

grn "==> [2/5] main entrypoint (self-hosted router) likh raha hoon"
mkdir -p "$DOCKER_DIR/volumes/functions/main"
cat > "$DOCKER_DIR/volumes/functions/main/index.ts" <<'MAINTS'
// Self-hosted edge runtime router. /functions/v1/<name> -> volumes/functions/<name>/index.ts
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

serve(async (req: Request) => {
  const url = new URL(req.url);
  const name = url.pathname.replace(/^\/+/, "").split("/")[0];

  if (!name || name === "main") {
    return new Response("ok", { status: 200 });
  }

  const servicePath = `/home/deno/functions/${name}`;
  try {
    const worker = await EdgeRuntime.userWorkers.create({
      servicePath,
      memoryLimitMb: 256,
      workerTimeoutMs: 400_000,          // long-running cron functions ke liye
      noModuleCache: false,
      envVars: Object.entries(Deno.env.toObject()),
    });
    return await worker.fetch(req);
  } catch (e) {
    console.error(`worker fail [${name}]:`, e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
MAINTS

grn "==> [3/5] Required secrets ki checklist verify"
REQUIRED=(
  SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY SUPABASE_DB_URL
  ZAPUPI_TOKEN_KEY ZAPUPI_SECRET_KEY OXAPAY_MERCHANT_API_KEY
  TELEGRAM_BOT_TOKEN TELEGRAM_ADMIN_CHAT_ID INTERNAL_CRON_TOKEN
)
MISSING=0
for k in "${REQUIRED[@]}"; do
  v=$(grep -E "^${k}=" "$ENV_FILE" | head -1 | cut -d= -f2- || true)
  if [[ -z "$v" || "$v" == "CHANGE_ME" ]]; then
    red "    MISSING/UNSET: $k"; MISSING=$((MISSING+1))
  else
    grn "    ok: $k"
  fi
done
if [[ "$MISSING" -gt 0 ]]; then
  red "$MISSING secret(s) set nahi hain — $ENV_FILE me fill karo, phir dubara chalao."
  exit 1
fi

grn "==> [4/5] functions container restart (sirf extips-functions, baaki kuch nahi)"
cd "$DOCKER_DIR"
docker compose -p "$PROJECT" -f docker-compose.yml -f "$OVERRIDE" up -d --force-recreate functions
sleep 6

grn "==> [5/5] Container ke andar secrets verify"
for k in "${REQUIRED[@]}"; do
  if docker exec "$FN_CONTAINER" printenv | grep -q "^${k}="; then
    grn "    injected: $k"
  else
    red "    NOT injected: $k  (docker-compose.override.yml me env_file check karo)"
  fi
done

echo
grn "==> Smoke test"
BASE="http://127.0.0.1:8100/functions/v1"
ANON=$(grep -E '^ANON_KEY=' "$ENV_FILE" | cut -d= -f2-)
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/cron-status" \
        -H "Authorization: Bearer $ANON" -H 'Content-Type: application/json' -d '{}' || echo 000)
if [[ "$code" =~ ^(200|401|403)$ ]]; then
  grn "    functions runtime zinda hai (HTTP $code)"
else
  red "    functions runtime jawab nahi de raha (HTTP $code)"
  ylw "    logs: docker logs --tail 100 $FN_CONTAINER"
fi

echo
ylw "Reminder — self-hosted gotchas jo code me already handle hone chahiye:"
ylw "  * auth.getClaims() self-hosted par nahi chalta  -> auth.getUser() use karo"
ylw "  * kong:8000 se function->function call fail hoti hai -> request origin se URL banao"
ylw "  * CORS helper ka galat import => function boot hi nahi hoti -> local corsHeaders"
ylw "  * payment return URL me '&amp;' ko '&' me clean karo"
