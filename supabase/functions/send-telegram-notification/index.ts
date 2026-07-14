import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getBotToken(): string | null {
  return Deno.env.get("TELEGRAM_BOT_TOKEN") || null;
}

function getAdminChatIds(): string[] {
  const ids = [
    Deno.env.get("TELEGRAM_ADMIN_CHAT_ID_1"),
    Deno.env.get("TELEGRAM_ADMIN_CHAT_ID_2"),
    Deno.env.get("TELEGRAM_CHAT_ID"), // legacy fallback
  ].filter((v): v is string => !!v && v.trim().length > 0);
  return Array.from(new Set(ids.map((s) => s.trim())));
}

async function tgApi(method: string, body: Record<string, unknown>) {
  const token = getBotToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not configured");
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return await res.json().catch(() => ({}));
}

export async function sendToAllAdmins(opts: {
  text: string;
  parse_mode?: string;
  photo_url?: string;
}) {
  const chats = getAdminChatIds();
  const results: any[] = [];
  for (const chat_id of chats) {
    try {
      if (opts.photo_url) {
        let r = await tgApi("sendPhoto", {
          chat_id, photo: opts.photo_url, caption: opts.text, parse_mode: opts.parse_mode ?? "HTML",
        });
        if (!r?.ok) {
          r = await tgApi("sendMessage", {
            chat_id, text: opts.text, parse_mode: opts.parse_mode ?? "HTML", disable_web_page_preview: true,
          });
        }
        results.push({ chat_id, ok: !!r?.ok });
      } else {
        const r = await tgApi("sendMessage", {
          chat_id, text: opts.text, parse_mode: opts.parse_mode ?? "HTML", disable_web_page_preview: true,
        });
        results.push({ chat_id, ok: !!r?.ok, description: r?.description });
      }
    } catch (e) {
      results.push({ chat_id, ok: false, error: String((e as Error).message || e) });
    }
  }
  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    let authorized = !!token && !!serviceKey && token === serviceKey;
    if (!authorized && token) {
      try {
        const supa = createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceKey);
        const { data, error } = await supa.auth.getUser(token);
        if (!error && data?.user) {
          const { data: roleRow } = await supa
            .from("user_roles").select("role")
            .eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
          authorized = !!roleRow;
        }
      } catch (_) { authorized = false; }
    }
    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!getBotToken()) {
      return new Response(JSON.stringify({ skipped: true, reason: "TELEGRAM_BOT_TOKEN not set" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const chats = getAdminChatIds();
    if (chats.length === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no admin chat IDs configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, photo_url, parse_mode = "HTML" } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "No message provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await sendToAllAdmins({ text: message, parse_mode, photo_url });
    return new Response(JSON.stringify({ ok: results.some((r) => r.ok), results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
