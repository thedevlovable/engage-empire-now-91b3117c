import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

function botToken(): string {
  return Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
}

async function deriveWebhookSecret(seed: string): Promise<string> {
  const data = new TextEncoder().encode(`telegram-webhook:${seed}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeEqual(a: string | null, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function tg(method: string, body: Record<string, unknown>) {
  const token = botToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not configured");
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return await res.json().catch(() => ({}));
}

function allowedChats(): Set<string> {
  const ids = [
    Deno.env.get("TELEGRAM_ADMIN_CHAT_ID_1"),
    Deno.env.get("TELEGRAM_ADMIN_CHAT_ID_2"),
    Deno.env.get("TELEGRAM_CHAT_ID"),
  ].filter((v): v is string => !!v && v.trim().length > 0);
  return new Set(ids.map((s) => s.trim()));
}

async function getUsdToInr(): Promise<number> {
  try {
    const r = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    const j = await r.json();
    const rate = Number(j?.rates?.INR);
    if (rate > 0) return rate;
  } catch (_) { /* ignore */ }
  return 84;
}

async function fetchLiveBalances(chatId: number) {
  const { data: accounts, error } = await supabase
    .from("provider_accounts")
    .select("id,name,api_url,api_key,balance_currency,is_active")
    .eq("is_active", true)
    .order("name");

  if (error) {
    await tg("sendMessage", { chat_id: chatId, text: `❌ DB error: ${error.message}` });
    return;
  }
  if (!accounts?.length) {
    await tg("sendMessage", { chat_id: chatId, text: "⚠️ No active provider accounts found." });
    return;
  }

  await tg("sendMessage", { chat_id: chatId, text: `🔄 Checking <b>${accounts.length}</b> providers...`, parse_mode: "HTML" });

  const usdToInr = await getUsdToInr();
  const results = await Promise.all(accounts.map(async (acc: any) => {
    try {
      const fd = new URLSearchParams();
      fd.append("key", acc.api_key);
      fd.append("action", "balance");
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      const resp = await fetch(acc.api_url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: fd.toString(),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const text = await resp.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { error: text }; }
      if (data.error) {
        await supabase.from("provider_accounts").update({
          balance_checked_at: new Date().toISOString(),
          last_balance_error: typeof data.error === "string" ? data.error : JSON.stringify(data.error),
        }).eq("id", acc.id);
        return { name: acc.name, error: String(data.error).slice(0, 80) };
      }
      const balance = parseFloat(data.balance ?? "0");
      const currency = (data.currency ?? acc.balance_currency ?? "USD").toUpperCase();
      await supabase.from("provider_accounts").update({
        balance, balance_currency: currency,
        balance_checked_at: new Date().toISOString(),
        last_balance_error: null,
      }).eq("id", acc.id);
      const inr = currency === "USD" ? balance * usdToInr : balance;
      return { name: acc.name, balance, currency, inr };
    } catch (e: any) {
      return { name: acc.name, error: e.message || "Network error" };
    }
  }));

  let totalInr = 0;
  const lines = results.map((r: any) => {
    if (r.error) return `❌ <b>${r.name}</b>\n   <i>${r.error}</i>`;
    totalInr += r.inr;
    const emoji = r.inr < 50 ? "🔴" : r.inr < 200 ? "🟡" : "🟢";
    return `${emoji} <b>${r.name}</b>\n   ₹${r.inr.toFixed(2)}`;
  });

  const msg = `💰 <b>Provider Balances</b>\n\n${lines.join("\n\n")}\n\n━━━━━━━━━━━━━━\n<b>Total: ₹${totalInr.toFixed(2)}</b>\n<i>Updated: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</i>`;
  await tg("sendMessage", { chat_id: chatId, text: msg, parse_mode: "HTML" });
}

function adminChats(): string[] {
  const ids = [
    Deno.env.get("TELEGRAM_ADMIN_CHAT_ID_1"),
    Deno.env.get("TELEGRAM_ADMIN_CHAT_ID_2"),
    Deno.env.get("TELEGRAM_CHAT_ID"),
  ].filter((v): v is string => !!v && v.trim().length > 0);
  return Array.from(new Set(ids.map((s) => s.trim())));
}

async function sendTestNotifications(chatId: number) {
  const chats = adminChats();
  const ts = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const depositMsg = [
    `💰 <b>Deposit Success</b> (TEST)`,
    ``,
    `👤 <b>User:</b> test@example.com`,
    `💵 <b>Amount:</b> ₹500.00 ($5.56)`,
    `🏦 <b>New Balance:</b> ₹1250.00`,
    `💳 <b>Method:</b> ZAPUPI`,
    `🆔 <b>Order:</b> <code>TEST-DEP-${Date.now()}</code>`,
    `<i>${ts}</i>`,
  ].join("\n");
  const withdrawMsg = [
    `🔴 <b>Manual Withdrawal (Admin)</b> (TEST)`,
    ``,
    `👤 <b>User:</b> test@example.com`,
    `💵 <b>Amount:</b> ₹200.00`,
    `🏦 <b>New Balance:</b> ₹1050.00`,
    `🛡️ <b>Admin:</b> admin@example.com`,
    `📝 <b>Notes:</b> Test withdrawal from /test command`,
    `<i>${ts}</i>`,
  ].join("\n");

  let sentDep = 0, sentWith = 0;
  for (const c of chats) {
    const r1 = await tg("sendMessage", { chat_id: c, text: depositMsg, parse_mode: "HTML" });
    if ((r1 as any)?.ok) sentDep++;
    const r2 = await tg("sendMessage", { chat_id: c, text: withdrawMsg, parse_mode: "HTML" });
    if ((r2 as any)?.ok) sentWith++;
  }

  await tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `✅ <b>Test notifications sent</b>\n\nAdmin chats: <b>${chats.length}</b>\nDeposit sent: <b>${sentDep}</b>\nWithdrawal sent: <b>${sentWith}</b>`,
  });
}

async function handleCommand(cmd: string, chatId: number) {
  const c = cmd.toLowerCase().split("@")[0].trim();
  if (c === "/balance" || c === "/bal" || c === "/b" || c === "/balances") {
    await fetchLiveBalances(chatId);
  } else if (c === "/test") {
    await sendTestNotifications(chatId);
  } else if (c === "/id" || c === "/whoami") {
    await tg("sendMessage", { chat_id: chatId, text: `Chat ID: <code>${chatId}</code>`, parse_mode: "HTML" });
  } else if (c === "/start" || c === "/help") {
    await tg("sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: `👋 <b>Extips Panel Admin Bot</b>\n\nCommands:\n\n/balance (or /bal, /b) — live provider balances\n/test — send sample deposit + withdrawal notifications\n/id — show this chat's ID\n/help — show this message`,
    });
  } else {
    await tg("sendMessage", { chat_id: chatId, text: `❓ Unknown command. Send /help.` });
  }
}

serve(async (req) => {
  if (req.method === "GET") {
    const url = new URL(req.url);
    // Setup endpoint: GET ?setup=1 with service-role Authorization → registers webhook + commands
    if (url.searchParams.get("setup") === "1") {
      // No auth required: this endpoint only (re)registers OUR own webhook URL and
      // command list against Telegram — an attacker calling it can't leak anything
      // or redirect the webhook away from us.
      const bt = botToken();
      if (!bt) return new Response(JSON.stringify({ error: "TELEGRAM_BOT_TOKEN not set" }), { status: 500, headers: { "Content-Type": "application/json" } });
      const secret = await deriveWebhookSecret(bt);
      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-webhook`;
      const setRes = await tg("setWebhook", {
        url: webhookUrl,
        secret_token: secret,
        allowed_updates: ["message", "edited_message"],
        drop_pending_updates: true,
      });
      const cmdRes = await tg("setMyCommands", {
        commands: [
          { command: "balance", description: "Live provider balances" },
          { command: "bal", description: "Live provider balances (short)" },
          { command: "b", description: "Live provider balances (shortest)" },
          { command: "id", description: "Show this chat's ID" },
          { command: "help", description: "Show help" },
        ],
      });
      const info = await tg("getWebhookInfo", {});
      return new Response(JSON.stringify({ setWebhook: setRes, setMyCommands: cmdRes, webhookInfo: info, webhook_url: webhookUrl }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, service: "telegram-webhook" }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const token = botToken();
  if (!token) return new Response("Not configured", { status: 500 });

  const expected = await deriveWebhookSecret(token);
  const actual = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (!safeEqual(actual, expected)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const message = update?.message ?? update?.edited_message;
  const chatId = message?.chat?.id;
  const text: string = message?.text ?? "";

  if (!chatId || !text) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const allowed = allowedChats();
  if (allowed.size > 0 && !allowed.has(String(chatId))) {
    await tg("sendMessage", { chat_id: chatId, text: `⛔ Unauthorized chat. Your ID: ${chatId}` });
    return new Response(JSON.stringify({ ok: true, unauthorized_chat: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (text.startsWith("/")) {
      await handleCommand(text, chatId);
    }
  } catch (e: any) {
    console.error("handler error", e);
    await tg("sendMessage", { chat_id: chatId, text: `❌ Error: ${e.message}` });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
