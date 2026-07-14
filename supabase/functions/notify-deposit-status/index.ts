import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function adminChats(): string[] {
  const ids = [
    Deno.env.get('TELEGRAM_ADMIN_CHAT_ID_1'),
    Deno.env.get('TELEGRAM_ADMIN_CHAT_ID_2'),
    Deno.env.get('TELEGRAM_CHAT_ID'),
  ].filter((v): v is string => !!v && v.trim().length > 0)
  return Array.from(new Set(ids.map((s) => s.trim())))
}

async function tgSend(chat_id: string | number, text: string) {
  if (!BOT_TOKEN) return { skipped: true }
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    })
    return await r.json().catch(() => ({}))
  } catch (e) {
    return { error: String((e as Error).message || e) }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = req.headers.get('Authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
    if (!token || token !== SERVICE_ROLE) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({} as any))
    const { user_id, order_id, method, status, amount_inr, amount_usd, reason } = body || {}
    if (!user_id || !order_id || !status || !method) {
      return new Response(JSON.stringify({ error: 'missing_fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
    const [{ data: prof }, { data: wal }] = await Promise.all([
      admin.from('profiles').select('email, full_name, telegram_chat_id, telegram_notifications_enabled').eq('user_id', user_id).maybeSingle(),
      admin.from('wallets').select('balance').eq('user_id', user_id).maybeSingle(),
    ])

    const isSuccess = ['success','paid','credited','completed','confirmed'].includes(String(status).toLowerCase())
    const rate = 90
    const balInr = wal?.balance != null ? (Number(wal.balance) * rate).toFixed(2) : '?'
    const amtInrTxt = amount_inr != null ? `₹${Number(amount_inr).toFixed(2)}` : '—'
    const amtUsdTxt = amount_usd != null ? `$${Number(amount_usd).toFixed(2)}` : ''
    const methodLabel = String(method).toUpperCase()

    // ── User DM (if they linked their chat) ──
    let userSent = false
    if (BOT_TOKEN && prof?.telegram_chat_id && prof?.telegram_notifications_enabled !== false) {
      const userMsg = isSuccess
        ? [
            `✅ <b>Deposit Successful</b>`, ``,
            `💵 <b>Amount:</b> ${esc(amtInrTxt)}${amtUsdTxt ? ` (${esc(amtUsdTxt)})` : ''}`,
            `🏦 <b>New Balance:</b> ₹${esc(balInr)}`,
            `💳 <b>Method:</b> ${esc(methodLabel)}`,
            `🆔 <b>Order:</b> <code>${esc(order_id)}</code>`, ``,
            `Thank you! Aap ab order laga sakte hain. 🚀`,
          ].join('\n')
        : [
            `❌ <b>Deposit Failed</b>`, ``,
            `💵 <b>Amount:</b> ${esc(amtInrTxt)}`,
            `💳 <b>Method:</b> ${esc(methodLabel)}`,
            `🆔 <b>Order:</b> <code>${esc(order_id)}</code>`,
            reason ? `📛 <b>Reason:</b> ${esc(reason)}` : '', ``,
            `Agar amount kat gaya hai to support se contact karein.`,
          ].filter(Boolean).join('\n')
      const res = await tgSend(prof.telegram_chat_id, userMsg)
      userSent = !!(res as any)?.ok
    }

    // ── Admin channels (fan-out to both configured admin chats) ──
    const chats = adminChats()
    const tag = isSuccess ? '💰 <b>Deposit Success</b>' : '⚠️ <b>Deposit Failed</b>'
    const adminMsg = [
      `${tag} (${esc(methodLabel)})`, ``,
      `👤 <b>User:</b> ${esc(prof?.email ?? user_id)}`,
      `💵 <b>Amount:</b> ${esc(amtInrTxt)}${amtUsdTxt ? ` (${esc(amtUsdTxt)})` : ''}`,
      isSuccess ? `🏦 <b>New Balance:</b> ₹${esc(balInr)}` : '',
      `🆔 <b>Order:</b> <code>${esc(order_id)}</code>`,
      reason ? `📛 <b>Reason:</b> ${esc(reason)}` : '',
    ].filter(Boolean).join('\n')
    let adminOk = 0
    for (const c of chats) {
      const r = await tgSend(c, adminMsg)
      if ((r as any)?.ok) adminOk++
    }

    return new Response(JSON.stringify({ ok: true, user_sent: userSent, admin_sent: adminOk, admin_targets: chats.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
