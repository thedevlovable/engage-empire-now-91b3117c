// TEMPORARY auth migration export — DELETE after migration is verified.
// Returns auth.users rows (including bcrypt password hashes) as JSON so the
// self-hosted VPS can restore original passwords. Protected by MIGRATION_TOKEN.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json; charset=utf-8",
};

// Constant-time comparison (never logs either value).
function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const expected = Deno.env.get("MIGRATION_TOKEN") ?? "";
  const url = new URL(req.url);
  const provided =
    (req.headers.get("x-migration-token") ?? url.searchParams.get("token") ?? "").trim();

  if (!expected || !provided || !safeEqual(provided, expected)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: cors,
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await admin.rpc("export_auth_users");
  if (error) {
    console.error("export failed"); // no token/hash in logs
    return new Response(JSON.stringify({ error: "export_failed" }), {
      status: 500,
      headers: cors,
    });
  }

  const all = (data ?? []) as Record<string, unknown>[];

  // Pagination: page/per_page, default returns everything.
  const perPage = Math.max(1, Math.min(Number(url.searchParams.get("per_page") ?? all.length || 1), 5000));
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const start = (page - 1) * perPage;
  const slice = all.slice(start, start + perPage);

  const users = slice.map((r) => ({
    id: r.id,
    email: r.email,
    encrypted_password: r.encrypted_password,
    email_confirmed_at: r.email_confirmed_at ?? r.created_at,
    raw_user_meta_data: r.raw_user_meta_data ?? {},
    raw_app_meta_data: r.raw_app_meta_data ?? { provider: "email", providers: ["email"] },
    created_at: r.created_at,
    updated_at: r.updated_at ?? r.created_at,
    last_sign_in_at: r.last_sign_in_at ?? null,
    phone: r.phone ?? null,
    aud: r.aud ?? "authenticated",
    role: r.role ?? "authenticated",
  }));

  return new Response(
    JSON.stringify({ total: all.length, page, per_page: perPage, users }, null, 2),
    { headers: cors },
  );
});
