// TEMPORARY auth migration export — DELETE after migration is verified.
// Returns auth.users rows (including bcrypt password hashes) as JSON so the
// self-hosted VPS can restore original passwords. Protected by MIGRATION_TOKEN.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json; charset=utf-8",
};

function sqlText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlJson(value: unknown, fallback: Record<string, unknown>): string {
  const json = JSON.stringify(value ?? fallback).replaceAll("'", "''");
  return `'${json}'::jsonb`;
}

function buildImportSql(rows: Record<string, unknown>[]): string {
  const valid = rows.filter((row) =>
    typeof row.id === "string" &&
    typeof row.email === "string" &&
    typeof row.encrypted_password === "string" &&
    /^\$2[aby]\$/.test(row.encrypted_password)
  );
  if (valid.length === 0) throw new Error("no_valid_users");

  const values = valid.map((row) => `(
    ${sqlText(row.id)}::uuid,
    lower(${sqlText(row.email)}),
    ${sqlText(row.encrypted_password)},
    ${sqlText(row.email_confirmed_at ?? row.created_at)}::timestamptz,
    ${sqlJson(row.raw_user_meta_data, {})},
    ${sqlJson(row.raw_app_meta_data, { provider: "email", providers: ["email"] })},
    ${sqlText(row.created_at)}::timestamptz,
    ${sqlText(row.updated_at ?? row.created_at)}::timestamptz,
    ${sqlText(row.last_sign_in_at)}::timestamptz,
    ${sqlText(row.phone)}
  )`).join(",\n");

  return `\\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE auth_migration_src (
  id uuid PRIMARY KEY, email text NOT NULL, pw text NOT NULL,
  email_confirmed_at timestamptz, meta jsonb, app_meta jsonb,
  created_at timestamptz, updated_at timestamptz,
  last_sign_in_at timestamptz, phone text
) ON COMMIT DROP;
INSERT INTO auth_migration_src VALUES ${values};

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM auth_migration_src s
    JOIN auth.users u ON lower(u.email) = s.email
    WHERE u.id <> s.id
  ) THEN
    RAISE EXCEPTION 'UUID conflict: an email already exists under a different UUID';
  END IF;
END $$;

UPDATE auth.users u SET
  email = s.email,
  encrypted_password = s.pw,
  email_confirmed_at = COALESCE(u.email_confirmed_at, s.email_confirmed_at, s.created_at, now()),
  raw_user_meta_data = COALESCE(u.raw_user_meta_data, s.meta),
  raw_app_meta_data = COALESCE(u.raw_app_meta_data, s.app_meta),
  updated_at = now()
FROM auth_migration_src s WHERE u.id = s.id;

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, last_sign_in_at, raw_user_meta_data, raw_app_meta_data,
  phone, is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
)
SELECT
  '00000000-0000-0000-0000-000000000000', s.id, 'authenticated', 'authenticated',
  s.email, s.pw, COALESCE(s.email_confirmed_at, s.created_at, now()),
  COALESCE(s.created_at, now()), COALESCE(s.updated_at, now()), s.last_sign_in_at,
  s.meta, s.app_meta, s.phone, false, '', '', '', '', '', '', '', ''
FROM auth_migration_src s
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = s.id);

INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
SELECT gen_random_uuid(), u.id::text, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email,
    'email_verified', true, 'phone_verified', false),
  'email', u.last_sign_in_at, COALESCE(u.created_at, now()), now()
FROM auth.users u JOIN auth_migration_src s ON s.id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
);

UPDATE auth.users u SET
  confirmation_token = COALESCE(u.confirmation_token, ''),
  recovery_token = COALESCE(u.recovery_token, ''),
  email_change_token_new = COALESCE(u.email_change_token_new, ''),
  email_change_token_current = COALESCE(u.email_change_token_current, ''),
  email_change = COALESCE(u.email_change, ''),
  phone_change = COALESCE(u.phone_change, ''),
  phone_change_token = COALESCE(u.phone_change_token, ''),
  reauthentication_token = COALESCE(u.reauthentication_token, ''),
  aud = COALESCE(NULLIF(u.aud, ''), 'authenticated'),
  role = COALESCE(NULLIF(u.role, ''), 'authenticated'),
  instance_id = COALESCE(u.instance_id, '00000000-0000-0000-0000-000000000000'),
  email_confirmed_at = COALESCE(u.email_confirmed_at, u.created_at, now())
FROM auth_migration_src s WHERE u.id = s.id;

DO $$
DECLARE staged integer; restored integer; identities integer;
BEGIN
  SELECT count(*) INTO staged FROM auth_migration_src;
  SELECT count(*) INTO restored FROM auth.users u JOIN auth_migration_src s
    ON u.id = s.id WHERE u.encrypted_password = s.pw;
  SELECT count(*) INTO identities FROM auth.identities i JOIN auth_migration_src s
    ON i.user_id = s.id WHERE i.provider = 'email';
  IF staged <> restored OR staged <> identities THEN
    RAISE EXCEPTION 'Verification failed: staged %, hashes %, identities %', staged, restored, identities;
  END IF;
  RAISE NOTICE 'AUTH_MIGRATION_OK users=% hashes=% identities=%', staged, restored, identities;
END $$;
COMMIT;
`;
}

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

  const backendUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!backendUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "backend_not_configured" }), {
      status: 500,
      headers: cors,
    });
  }

  const admin = createClient(
    backendUrl,
    serviceKey,
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

  if (url.searchParams.get("format") === "sql") {
    try {
      return new Response(buildImportSql(all), {
        headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "no_valid_users" }), {
        status: 500,
        headers: cors,
      });
    }
  }

  // Pagination: page/per_page, default returns everything.
  const defaultPer = all.length > 0 ? all.length : 1;
  const perPage = Math.max(1, Math.min(Number(url.searchParams.get("per_page") ?? defaultPer), 5000));
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
