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

  const dbUrl = Deno.env.get("MIRROR_DB_URL");
  if (!dbUrl) return json({ error: "MIRROR_DB_URL not configured" }, 500);

  const sql = postgres(dbUrl, { prepare: false, max: 1, ssl: "require" });
  try {
    await sql.unsafe(MIRROR_SCHEMA_SQL);

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
