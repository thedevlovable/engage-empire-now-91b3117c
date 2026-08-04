// TEMPORARY: creates the mirror project's schema over a direct Postgres connection.
// Delete this function once the mirror tables exist.
import postgres from "npm:postgres@3.4.5";
import { MIRROR_SCHEMA_SQL } from "./schema.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json; charset=utf-8",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), { status, headers: cors });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  // Only callable with the primary project's service role key.
  const auth = req.headers.get("Authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceKey || auth !== `Bearer ${serviceKey}`) {
    return json({ error: "unauthorized" }, 401);
  }

  if (new URL(req.url).searchParams.get("diag") === "1") {
    const raw = Deno.env.get("MIRROR_SUPABASE_URL") ?? "";
    const base = raw.replace(/\/+$/, "");
    const key = Deno.env.get("MIRROR_SUPABASE_SERVICE_KEY") ?? "";
    const r = await fetch(`${base}/rest/v1/providers?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    return json({
      mirror_url_shape: base.replace(/https:\/\/([^.]{4})[^.]*/, "https://$1***"),
      has_trailing_path: new URL(base).pathname,
      rest_status: r.status,
      rest_body: (await r.text()).slice(0, 300),
    });
  }

  const dbUrl = Deno.env.get("MIRROR_DB_URL");
  if (!dbUrl) return json({ error: "MIRROR_DB_URL not configured" }, 500);

  const sql = postgres(dbUrl, { prepare: false, max: 1, ssl: "require" });
  try {
    await sql.unsafe(MIRROR_SCHEMA_SQL);

    // Data API needs explicit grants + a schema-cache reload to see new tables.
    await sql.unsafe(`
      GRANT USAGE ON SCHEMA public TO service_role, authenticated, anon;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
      NOTIFY pgrst, 'reload schema';
    `);

    const tables = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    return json({
      ok: true,
      table_count: tables.length,
      tables: tables.map((t) => t.table_name),
    });
  } catch (e) {
    console.error("mirror-setup failed:", String(e));
    return json({ ok: false, error: String(e) }, 500);
  } finally {
    await sql.end({ timeout: 5 });
  }
});
