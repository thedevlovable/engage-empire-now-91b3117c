-- mirror-recovery-import.sql
-- RUN THIS IN THE MIRROR PROJECT'S SQL EDITOR (only during recovery).
-- Recreates auth.users + auth.identities from public.auth_mirror with the
-- ORIGINAL password hashes, so users log in with their old email/password.
-- Safe to re-run: no duplicates are created.

BEGIN;

-- 1) Insert missing users (same UUID, same bcrypt hash, email confirmed)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, last_sign_in_at, raw_user_meta_data, raw_app_meta_data,
  phone, is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  m.user_id,
  'authenticated',
  'authenticated',
  lower(m.email),
  m.encrypted_password,
  COALESCE(m.email_confirmed_at, m.created_at, now()),
  COALESCE(m.created_at, now()),
  now(),
  m.last_sign_in_at,
  COALESCE(m.raw_user_meta_data, '{}'::jsonb),
  COALESCE(m.raw_app_meta_data, '{"provider":"email","providers":["email"]}'::jsonb),
  m.phone,
  false, '', '', '', '', '', '', '', ''
FROM public.auth_mirror m
WHERE m.email IS NOT NULL
  AND m.encrypted_password IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = m.user_id)
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(m.email));

-- 2) Refresh password hash / confirmation for users that already exist
UPDATE auth.users u
SET encrypted_password = m.encrypted_password,
    email_confirmed_at = COALESCE(u.email_confirmed_at, m.email_confirmed_at, m.created_at, now()),
    raw_user_meta_data = COALESCE(u.raw_user_meta_data, m.raw_user_meta_data, '{}'::jsonb),
    raw_app_meta_data = COALESCE(u.raw_app_meta_data, m.raw_app_meta_data, '{"provider":"email","providers":["email"]}'::jsonb),
    aud = COALESCE(NULLIF(u.aud, ''), 'authenticated'),
    role = COALESCE(NULLIF(u.role, ''), 'authenticated'),
    confirmation_token = COALESCE(u.confirmation_token, ''),
    recovery_token = COALESCE(u.recovery_token, ''),
    email_change_token_new = COALESCE(u.email_change_token_new, ''),
    email_change_token_current = COALESCE(u.email_change_token_current, ''),
    email_change = COALESCE(u.email_change, ''),
    phone_change = COALESCE(u.phone_change, ''),
    phone_change_token = COALESCE(u.phone_change_token, ''),
    reauthentication_token = COALESCE(u.reauthentication_token, ''),
    updated_at = now()
FROM public.auth_mirror m
WHERE u.id = m.user_id
  AND m.encrypted_password IS NOT NULL
  AND u.encrypted_password IS DISTINCT FROM m.encrypted_password;

-- 3) Email identities (required by GoTrue for email login)
INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
SELECT gen_random_uuid(), u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email,
                          'email_verified', true, 'phone_verified', false),
       'email', u.last_sign_in_at, COALESCE(u.created_at, now()), now()
FROM auth.users u
JOIN public.auth_mirror m ON m.user_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
);

-- 4) Verify
DO $$
DECLARE mirrored int; restored int; identities int;
BEGIN
  SELECT count(*) INTO mirrored FROM public.auth_mirror WHERE encrypted_password IS NOT NULL;
  SELECT count(*) INTO restored FROM auth.users u
    JOIN public.auth_mirror m ON m.user_id = u.id
    WHERE u.encrypted_password = m.encrypted_password;
  SELECT count(*) INTO identities FROM auth.identities i
    JOIN public.auth_mirror m ON m.user_id = i.user_id WHERE i.provider = 'email';
  RAISE NOTICE 'MIRROR_RECOVERY mirrored=% hashes_ok=% identities=%', mirrored, restored, identities;
  IF restored < mirrored THEN
    RAISE WARNING 'Some users were not restored (email conflict under a different UUID?)';
  END IF;
END $$;

COMMIT;

-- Post-check
SELECT
  (SELECT count(*) FROM public.auth_mirror) AS auth_mirror_rows,
  (SELECT count(*) FROM auth.users)         AS auth_users,
  (SELECT count(*) FROM auth.identities WHERE provider = 'email') AS email_identities;
