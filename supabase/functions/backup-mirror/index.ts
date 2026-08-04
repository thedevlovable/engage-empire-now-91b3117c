// backup-mirror — incremental backup of this project's data + auth users into a
// second (mirror) Supabase project, so the site can be brought up from the mirror
// if the main project goes down.
//
// Auth: x-cron-secret must match CRON_SHARED_SECRET or the token stored in
// public.internal_cron_tokens (name = 'backup-mirror'), OR
// Authorization: Bearer <service role key>.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const PAGE = 500;

// table -> { pk: conflict target, ts: incremental timestamp column (null = full copy) }
const TABLES: Record<string, { pk: string; ts: string | null }> = {
  providers: { pk: "id", ts: "updated_at" },
  provider_accounts: { pk: "id", ts: "updated_at" },
  services: { pk: "id", ts: "updated_at" },
  service_provider_mapping: { pk: "id", ts: "created_at" },
  platform_settings: { pk: "id", ts: "updated_at" },
  engagement_bundles: { pk: "id", ts: "updated_at" },
  bundle_items: { pk: "id", ts: "created_at" },
  profiles: { pk: "id", ts: "updated_at" },
  user_roles: { pk: "id", ts: "created_at" },
  wallets: { pk: "id", ts: "updated_at" },
  subscriptions: { pk: "id", ts: "updated_at" },
  subscription_requests: { pk: "id", ts: "updated_at" },
  orders: { pk: "id", ts: "updated_at" },
  engagement_orders: { pk: "id", ts: "updated_at" },
  engagement_order_items: { pk: "id", ts: "updated_at" },
  organic_run_schedule: { pk: "id", ts: "created_at" },
  transactions: { pk: "id", ts: "created_at" },
  deposits: { pk: "id", ts: "updated_at" },
  zapupi_deposits: { pk: "id", ts: "updated_at" },
  oxapay_deposits: { pk: "id", ts: "updated_at" },
  zapupi_webhook_events: { pk: "id", ts: "received_at" },
  oxapay_webhook_events: { pk: "id", ts: "received_at" },
  razorpay_webhook_events: { pk: "id", ts: null },
  support_tickets: { pk: "id", ts: "updated_at" },
  chat_conversations: { pk: "id", ts: "updated_at" },
  chat_messages: { pk: "id", ts: "created_at" },
  popup_ads: { pk: "id", ts: "updated_at" },
  admin_audit_log: { pk: "id", ts: "created_at" },
  internal_cron_tokens: { pk: "name", ts: "updated_at" },
  rotation_alert_state: { pk: "alert_key", ts: null },
};

function timingSafeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length === 0 || ea.length !== eb.length) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const MIRROR_URL = (Deno.env.get("MIRROR_SUPABASE_URL") ?? "").replace(/\/+$/, "");
  const MIRROR_KEY = Deno.env.get("MIRROR_SUPABASE_SERVICE_KEY") ?? "";

  const source = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // ---------- authorization ----------
  const provided = (req.headers.get("x-cron-secret") ?? "").trim();
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  let authorized = false;

  const cronSecret = Deno.env.get("CRON_SHARED_SECRET") ?? "";
  if (provided && cronSecret && timingSafeEqual(provided, cronSecret)) authorized = true;
  if (!authorized && bearer && timingSafeEqual(bearer, SERVICE_KEY)) authorized = true;
  if (!authorized && provided) {
    const { data } = await source
      .from("internal_cron_tokens")
      .select("token")
      .eq("name", "backup-mirror")
      .maybeSingle();
    if (data?.token && timingSafeEqual(provided, String(data.token))) authorized = true;
  }
  if (!authorized) return json({ error: "Unauthorized" }, 401);

  if (!MIRROR_URL || !MIRROR_KEY) return json({ error: "mirror_not_configured" }, 500);

  let full = false;
  try {
    const body = await req.json();
    full = body?.full === true;
  } catch { /* no body */ }

  const mirrorHeaders = {
    apikey: MIRROR_KEY,
    Authorization: `Bearer ${MIRROR_KEY}`,
    "Content-Type": "application/json",
  };

  // ---------- read last_sync marker from mirror ----------
  let since: string | null = null;
  if (!full) {
    try {
      const res = await fetch(
        `${MIRROR_URL}/rest/v1/backup_state?k=eq.backup-mirror&select=last_sync`,
        { headers: mirrorHeaders },
      );
      const rows = await res.json();
      if (Array.isArray(rows) && rows[0]?.last_sync) since = rows[0].last_sync as string;
    } catch (_e) { /* first run */ }
  }
  const mode = since ? "incremental" : "full";
  const startedAt = new Date().toISOString();

  async function upsert(table: string, rows: unknown[], onConflict: string) {
    const res = await fetch(
      `${MIRROR_URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
      {
        method: "POST",
        headers: { ...mirrorHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(rows),
      },
    );
    if (!res.ok) throw new Error(`mirror ${table} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  const report: Record<string, number | string> = {};
  let total = 0;

  // ---------- data tables ----------
  for (const [table, cfg] of Object.entries(TABLES)) {
    try {
      let offset = 0;
      let count = 0;
      for (;;) {
        let q = source.from(table).select("*").range(offset, offset + PAGE - 1);
        if (cfg.ts) q = q.order(cfg.ts, { ascending: true, nullsFirst: true });
        if (since && cfg.ts) q = q.gte(cfg.ts, since);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        const rows = data ?? [];
        if (rows.length === 0) break;
        await upsert(table, rows, cfg.pk);
        count += rows.length;
        offset += PAGE;
        if (rows.length < PAGE) break;
      }
      report[table] = count;
      total += count;
    } catch (e) {
      report[table] = `error: ${e instanceof Error ? e.message : String(e)}`;
      console.error(`backup-mirror table failed: ${table}`, e);
    }
  }

  // ---------- auth users (always full, hashes included) ----------
  try {
    let offset = 0;
    let users = 0;
    for (;;) {
      const { data, error } = await source.rpc("export_auth_users_for_backup", {
        p_limit: PAGE,
        p_offset: offset,
      });
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as Record<string, unknown>[];
      if (rows.length === 0) break;
      await upsert(
        "auth_mirror",
        rows.map((r) => ({
          user_id: r.id,
          email: r.email,
          encrypted_password: r.encrypted_password,
          phone: r.phone,
          email_confirmed_at: r.email_confirmed_at,
          raw_user_meta_data: r.raw_user_meta_data ?? {},
          raw_app_meta_data: r.raw_app_meta_data ?? { provider: "email", providers: ["email"] },
          created_at: r.created_at,
          last_sign_in_at: r.last_sign_in_at,
          synced_at: startedAt,
        })),
        "user_id",
      );
      users += rows.length;
      offset += PAGE;
      if (rows.length < PAGE) break;
    }
    report["auth_mirror"] = users;
    total += users;
  } catch (e) {
    report["auth_mirror"] = `error: ${e instanceof Error ? e.message : String(e)}`;
    console.error("backup-mirror auth sync failed", e);
  }

  // ---------- marker ----------
  const syncedAt = new Date().toISOString();
  try {
    await upsert("backup_state", [{ k: "backup-mirror", last_sync: syncedAt, rows: total }], "k");
  } catch (e) {
    report["backup_state"] = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  return json({ ok: true, mode, total_rows: total, tables: report, synced_at: syncedAt });
});
