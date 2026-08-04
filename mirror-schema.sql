-- mirror-schema.sql — run this in the MIRROR Supabase project's SQL Editor
-- Data-only mirror: same columns + primary keys. No FKs / RLS / triggers.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  "id" uuid,
  "actor_id" uuid,
  "actor_email" text,
  "target_user_id" uuid,
  "target_email" text,
  "action" text,
  "amount_usd" numeric,
  "amount_inr" numeric,
  "notes" text,
  "ip_address" text,
  "user_agent" text,
  "metadata" jsonb,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.bundle_items (
  "id" uuid,
  "bundle_id" uuid,
  "service_id" uuid,
  "engagement_type" text,
  "ratio_percent" numeric,
  "is_base" boolean,
  "default_drip_qty_per_run" integer,
  "default_drip_interval" integer,
  "default_drip_interval_unit" text,
  "sort_order" integer,
  "created_at" timestamptz,
  "price_per_k" numeric,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  "id" uuid,
  "user_id" uuid,
  "user_email" text,
  "user_name" text,
  "status" text,
  "last_message_at" timestamptz,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  "id" uuid,
  "conversation_id" uuid,
  "sender_id" uuid,
  "sender_role" text,
  "message" text,
  "is_read" boolean,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.deposits (
  "id" uuid,
  "user_id" uuid,
  "amount" numeric,
  "currency" text,
  "payment_method" text,
  "proof_url" text,
  "status" text,
  "admin_notes" text,
  "reviewed_by" uuid,
  "reviewed_at" timestamptz,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.engagement_bundles (
  "id" uuid,
  "name" text,
  "platform" text,
  "provider_id" text,
  "description" text,
  "icon" text,
  "is_active" boolean,
  "sort_order" integer,
  "use_custom_ratios" boolean,
  "ai_organic_enabled" boolean,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.engagement_order_items (
  "id" uuid,
  "engagement_order_id" uuid,
  "engagement_type" text,
  "service_id" uuid,
  "quantity" integer,
  "price" numeric,
  "drip_qty_per_run" integer,
  "drip_interval" integer,
  "drip_interval_unit" text,
  "speed_preset" text,
  "is_enabled" boolean,
  "status" text,
  "provider_order_id" text,
  "error_message" text,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  "start_count" bigint,
  "current_count" bigint,
  "target_count" bigint,
  "delivered_count" bigint,
  "remaining_count" bigint,
  "progress_percentage" numeric,
  "last_synced_at" timestamptz,
  "max_observed_count" bigint,
  "completion_locked_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.engagement_orders (
  "id" uuid,
  "order_number" integer,
  "user_id" uuid,
  "bundle_id" uuid,
  "link" text,
  "base_quantity" integer,
  "total_price" numeric,
  "is_organic_mode" boolean,
  "variance_percent" integer,
  "peak_hours_enabled" boolean,
  "status" text,
  "error_message" text,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  "completed_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.internal_cron_tokens (
  "name" text,
  "token" text,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("name")
);

CREATE TABLE IF NOT EXISTS public.orders (
  "id" uuid,
  "order_number" integer,
  "user_id" uuid,
  "service_id" uuid,
  "link" text,
  "quantity" integer,
  "price" numeric,
  "status" text,
  "start_count" integer,
  "remains" integer,
  "provider_order_id" text,
  "is_drip_feed" boolean,
  "drip_runs" integer,
  "drip_interval" integer,
  "drip_interval_unit" text,
  "drip_quantity_per_run" integer,
  "is_organic_mode" boolean,
  "variance_percent" integer,
  "peak_hours_enabled" boolean,
  "error_message" text,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  "current_count" bigint,
  "target_count" bigint,
  "delivered_count" bigint,
  "remaining_count" bigint,
  "progress_percentage" numeric,
  "last_synced_at" timestamptz,
  "max_observed_count" bigint,
  "completion_locked_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.organic_run_schedule (
  "id" uuid,
  "order_id" uuid,
  "run_number" integer,
  "scheduled_at" timestamptz,
  "quantity_to_send" integer,
  "base_quantity" integer,
  "variance_applied" integer,
  "peak_multiplier" numeric,
  "status" text,
  "provider_order_id" text,
  "provider_response" jsonb,
  "error_message" text,
  "started_at" timestamptz,
  "completed_at" timestamptz,
  "engagement_order_item_id" uuid,
  "provider_start_count" integer,
  "provider_remains" integer,
  "provider_status" text,
  "provider_charge" numeric,
  "last_status_check" timestamptz,
  "retry_count" integer,
  "provider_account_id" uuid,
  "created_at" timestamptz,
  "provider_account_name" text,
  "rotation_lock_key" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.oxapay_deposits (
  "id" uuid,
  "order_id" text,
  "track_id" text,
  "user_id" uuid,
  "amount_usd" numeric,
  "amount_inr" numeric,
  "pay_currency" text,
  "status" text,
  "credited" boolean,
  "payment_url" text,
  "raw_payload" jsonb,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.oxapay_webhook_events (
  "id" uuid,
  "event_hash" text,
  "order_id" text,
  "track_id" text,
  "status" text,
  "signature_valid" boolean,
  "processed" boolean,
  "source_ip" text,
  "payload" jsonb,
  "credit_result" jsonb,
  "notes" text,
  "received_at" timestamptz,
  "tx_hash" text,
  "pay_currency" text,
  "expected_amount" numeric,
  "received_amount" numeric,
  "amount_match" boolean,
  "http_method" text,
  "headers" jsonb,
  "user_agent" text,
  "signature_expected" text,
  "signature_received" text,
  "raw_body" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  "id" uuid,
  "maintenance_mode" boolean,
  "global_markup_percent" numeric,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.popup_ads (
  "id" uuid,
  "youtube_video_id" text,
  "title" text,
  "description" text,
  "enabled" boolean,
  "skip_after_seconds" integer,
  "last_force_trigger" timestamptz,
  "version" integer,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  "starts_at" timestamptz,
  "ends_at" timestamptz,
  "video_layout" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.profiles (
  "id" uuid,
  "user_id" uuid,
  "email" text,
  "full_name" text,
  "api_key" text,
  "currency" text,
  "telegram_chat_id" text,
  "telegram_notifications_enabled" boolean,
  "organic_variance_percent" integer,
  "organic_peak_hours_enabled" boolean,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  "avatar_url" text,
  "telegram_id" text,
  "telegram_username" text,
  "is_organic_mode_default" boolean,
  "organic_ratios" jsonb,
  "is_banned" boolean,
  "banned_reason" text,
  "banned_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.provider_accounts (
  "id" uuid,
  "provider_id" text,
  "name" text,
  "api_key" text,
  "api_url" text,
  "priority" integer,
  "is_active" boolean,
  "last_used_at" timestamptz,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  "balance" numeric,
  "balance_currency" text,
  "balance_checked_at" timestamptz,
  "low_balance_threshold" numeric,
  "last_low_balance_alert_at" timestamptz,
  "last_balance_error" text,
  "delivery_multiplier" numeric,
  "cooldown_until" timestamptz,
  "last_error" text,
  "last_error_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.providers (
  "id" text,
  "name" text,
  "api_url" text,
  "api_key" text,
  "is_active" boolean,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.razorpay_webhook_events (
  "id" uuid,
  "event_id" text,
  "event_type" text,
  "payment_id" text,
  "payload" jsonb,
  "processed_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.rotation_alert_state (
  "alert_key" text,
  "last_count" integer,
  "last_alerted_at" timestamptz,
  "resolved_at" timestamptz,
  PRIMARY KEY ("alert_key")
);

CREATE TABLE IF NOT EXISTS public.service_provider_mapping (
  "id" uuid,
  "service_id" uuid,
  "provider_account_id" uuid,
  "provider_service_id" text,
  "sort_order" integer,
  "is_active" boolean,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.services (
  "id" uuid,
  "provider_id" text,
  "provider_service_id" text,
  "name" text,
  "category" text,
  "description" text,
  "price" numeric,
  "min_quantity" integer,
  "max_quantity" integer,
  "speed" text,
  "quality" text,
  "drip_feed_enabled" boolean,
  "is_active" boolean,
  "start_time" text,
  "refill" text,
  "cancel_allowed" text,
  "drop_type" text,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.subscription_requests (
  "id" uuid,
  "user_id" uuid,
  "full_name" text,
  "email" text,
  "phone" text,
  "plan_type" text,
  "message" text,
  "status" text,
  "reviewed_by" uuid,
  "reviewed_at" timestamptz,
  "admin_notes" text,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  "id" uuid,
  "user_id" uuid,
  "plan_type" text,
  "status" text,
  "activated_at" timestamptz,
  "expires_at" timestamptz,
  "activated_by" uuid,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  "id" uuid,
  "user_id" uuid,
  "subject" text,
  "message" text,
  "category" text,
  "priority" text,
  "status" text,
  "order_id" uuid,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.transactions (
  "id" uuid,
  "user_id" uuid,
  "type" text,
  "amount" numeric,
  "balance_after" numeric,
  "order_id" uuid,
  "description" text,
  "payment_method" text,
  "payment_reference" text,
  "status" text,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  "id" uuid,
  "user_id" uuid,
  "role" text,
  "created_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.wallets (
  "id" uuid,
  "user_id" uuid,
  "balance" numeric,
  "total_deposited" numeric,
  "total_spent" numeric,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.zapupi_deposits (
  "id" uuid,
  "user_id" uuid,
  "order_id" text,
  "amount_inr" numeric,
  "amount_usd" numeric,
  "status" text,
  "credited" boolean,
  "txn_id" text,
  "utr" text,
  "payment_url" text,
  "gateway_response" jsonb,
  "created_at" timestamptz,
  "updated_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.zapupi_webhook_events (
  "id" uuid,
  "event_key" text,
  "order_id" text,
  "txn_id" text,
  "utr" text,
  "status" text,
  "source" text,
  "payload" jsonb,
  "received_at" timestamptz,
  "expected_amount" numeric,
  "received_amount" numeric,
  "amount_match" boolean,
  "http_method" text,
  "headers" jsonb,
  "source_ip" text,
  "user_agent" text,
  "verification_notes" text,
  "processed" boolean,
  "credit_result" jsonb,
  "raw_body" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.backup_state (
  k text PRIMARY KEY,
  last_sync timestamptz,
  rows bigint
);

CREATE TABLE IF NOT EXISTS public.auth_mirror (
  user_id uuid PRIMARY KEY,
  email text,
  encrypted_password text,
  phone text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb,
  raw_app_meta_data jsonb,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  synced_at timestamptz
);

-- Only service_role writes into the mirror; RLS on with no policies.
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.bundle_items TO service_role;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.chat_conversations TO service_role;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.deposits TO service_role;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.engagement_bundles TO service_role;
ALTER TABLE public.engagement_bundles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.engagement_order_items TO service_role;
ALTER TABLE public.engagement_order_items ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.engagement_orders TO service_role;
ALTER TABLE public.engagement_orders ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.internal_cron_tokens TO service_role;
ALTER TABLE public.internal_cron_tokens ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.organic_run_schedule TO service_role;
ALTER TABLE public.organic_run_schedule ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.oxapay_deposits TO service_role;
ALTER TABLE public.oxapay_deposits ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.oxapay_webhook_events TO service_role;
ALTER TABLE public.oxapay_webhook_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.popup_ads TO service_role;
ALTER TABLE public.popup_ads ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.provider_accounts TO service_role;
ALTER TABLE public.provider_accounts ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.providers TO service_role;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.razorpay_webhook_events TO service_role;
ALTER TABLE public.razorpay_webhook_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.rotation_alert_state TO service_role;
ALTER TABLE public.rotation_alert_state ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.service_provider_mapping TO service_role;
ALTER TABLE public.service_provider_mapping ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.subscription_requests TO service_role;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.zapupi_deposits TO service_role;
ALTER TABLE public.zapupi_deposits ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.zapupi_webhook_events TO service_role;
ALTER TABLE public.zapupi_webhook_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.backup_state TO service_role;
ALTER TABLE public.backup_state ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.auth_mirror TO service_role;
ALTER TABLE public.auth_mirror ENABLE ROW LEVEL SECURITY;
