// TEMPORARY migration helper — delete after self-host migration is complete.
// Streams table data as SQL INSERT statements so the VPS can pipe it into psql.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const TOKEN = Deno.env.get("MIGRATE_EXPORT_TOKEN") ?? "";

const PUBLIC_TABLES = [
  "providers", "provider_accounts", "services", "service_provider_mapping",
  "platform_settings", "engagement_bundles", "bundle_items",
  "profiles", "user_roles", "wallets", "subscriptions", "subscription_requests",
  "orders", "engagement_orders", "engagement_order_items", "organic_run_schedule",
  "transactions", "deposits", "zapupi_deposits", "oxapay_deposits",
  "support_tickets", "chat_conversations", "chat_messages",
  "popup_ads", "admin_audit_log", "internal_cron_tokens",
];

function lit(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "text/plain; charset=utf-8",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  if (!TOKEN || token !== TOKEN) {
    return new Response("-- forbidden\n", { status: 403, headers: cors });
  }

  const table = url.searchParams.get("table") ?? "";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 2000), 5000);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  if (table === "__list") {
    const out: string[] = [];
    for (const t of PUBLIC_TABLES) {
      const { count } = await admin.from(t).select("*", { count: "exact", head: true });
      out.push(`${t}=${count ?? 0}`);
    }
    const { data: au } = await admin.rpc("export_auth_users");
    out.push(`auth_users=${(au as unknown[] | null)?.length ?? 0}`);
    return new Response(out.join("\n") + "\n", { headers: cors });
  }

  if (table === "auth_users") {
    const { data, error } = await admin.rpc("export_auth_users");
    if (error) return new Response(`-- error: ${error.message}\n`, { status: 500, headers: cors });
    const rows = (data ?? []) as Record<string, unknown>[];
    const lines = [
      "BEGIN;",
      "SET session_replication_role = replica;",
    ];

    for (const r of rows) {
      lines.push(
        `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, last_sign_in_at, raw_user_meta_data, raw_app_meta_data, phone, is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token) VALUES (` +
          `'00000000-0000-0000-0000-000000000000', ${lit(r.id)}, ${lit(r.aud ?? "authenticated")}, ${lit(r.role ?? "authenticated")}, ${lit(r.email)}, ${lit(r.encrypted_password)}, ${lit(r.email_confirmed_at ?? r.created_at)}, ${lit(r.created_at)}, ${lit(r.updated_at)}, ${lit(r.last_sign_in_at)}, ${lit(r.raw_user_meta_data ?? {})}, ${lit(r.raw_app_meta_data ?? { provider: "email", providers: ["email"] })}, ${lit(r.phone)}, ${lit(r.is_super_admin ?? false)}, '', '', '', '', '', '', '', '') ON CONFLICT (id) DO NOTHING;`,
      );
      lines.push(
        `INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES (gen_random_uuid(), ${lit(r.id)}, ${lit(r.id)}, ${lit({ sub: r.id, email: r.email, email_verified: true, phone_verified: false })}, 'email', ${lit(r.last_sign_in_at)}, ${lit(r.created_at)}, ${lit(r.updated_at)}) ON CONFLICT (provider, provider_id) DO NOTHING;`,
      );
    }
    lines.push("SET session_replication_role = DEFAULT;", "COMMIT;", `-- exported ${rows.length} users`);
    return new Response(lines.join("\n") + "\n", { headers: cors });
  }

  if (!PUBLIC_TABLES.includes(table)) {
    return new Response(`-- unknown table: ${table}\n`, { status: 400, headers: cors });
  }

  const { data, error } = await admin
    .from(table)
    .select("*")
    .range(offset, offset + limit - 1);
  if (error) return new Response(`-- error: ${error.message}\n`, { status: 500, headers: cors });

  const rows = (data ?? []) as Record<string, unknown>[];
  const lines: string[] = ["BEGIN;", "SET session_replication_role = replica;"];
  for (const r of rows) {
    const cols = Object.keys(r);
    lines.push(
      `INSERT INTO public.${table} (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${cols.map((c) => lit(r[c])).join(", ")}) ON CONFLICT DO NOTHING;`,
    );
  }
  lines.push("SET session_replication_role = DEFAULT;", "COMMIT;", `-- ${table}: ${rows.length} rows (offset ${offset})`);
  return new Response(lines.join("\n") + "\n", { headers: cors });
});
