-- ============================================================
-- 01-auth-fix.sql  —  auth.users import ke baad CHALANA ZAROORI
-- Ye wahi 4 gotchas fix karta hai jo self-hosted GoTrue par login toDbroorhi todte hain.
-- Idempotent hai — kitni baar bhi chala sakta hai.
-- ============================================================

-- (1) NULL token columns -> GoTrue 500 "converting NULL to string is unsupported"
--     Sab token/state columns ko '' karna hai, NULL nahi.
UPDATE auth.users SET
  confirmation_token      = COALESCE(confirmation_token, ''),
  recovery_token          = COALESCE(recovery_token, ''),
  email_change_token_new  = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change            = COALESCE(email_change, ''),
  phone_change            = COALESCE(phone_change, ''),
  phone_change_token      = COALESCE(phone_change_token, ''),
  reauthentication_token  = COALESCE(reauthentication_token, '')
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change_token_new IS NULL
   OR email_change_token_current IS NULL
   OR email_change IS NULL
   OR phone_change IS NULL
   OR phone_change_token IS NULL
   OR reauthentication_token IS NULL;

-- (2) instance_id / aud / role missing -> "Invalid login credentials" despite correct password
UPDATE auth.users SET
  instance_id = COALESCE(instance_id, '00000000-0000-0000-0000-000000000000'::uuid),
  aud         = COALESCE(NULLIF(aud, ''), 'authenticated'),
  role        = COALESCE(NULLIF(role, ''), 'authenticated')
WHERE instance_id IS NULL
   OR COALESCE(aud, '')  = ''
   OR COALESCE(role, '') = '';

-- (3) confirmed_at GENERATED column hai -> usko chhoona nahi.
--     Sirf email_confirmed_at set karo; confirmed_at khud calculate ho jayega.
UPDATE auth.users
   SET email_confirmed_at = COALESCE(email_confirmed_at, created_at, now())
 WHERE email_confirmed_at IS NULL;

-- (4) identities: email provider row missing ho to password login fail hota hai.
--     Same UUID reuse karo — koi naya user id nahi banana.
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
       'email', u.id::text, u.last_sign_in_at, COALESCE(u.created_at, now()), now()
  FROM auth.users u
 WHERE u.email IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM auth.identities i
      WHERE i.user_id = u.id AND i.provider = 'email'
   );

-- (5) Sanity: bcrypt hash intact hai? ($2a$ / $2b$ se start hona chahiye)
--     Ye rows login NAHI kar payenge — inko report karo, silently ignore mat karo.
DO $$
DECLARE bad int;
BEGIN
  SELECT count(*) INTO bad FROM auth.users
   WHERE encrypted_password IS NULL
      OR encrypted_password NOT LIKE '$2%';
  IF bad > 0 THEN
    RAISE WARNING 'ATTENTION: % user(s) ka password hash missing/corrupt hai — inko manual reset chahiye.', bad;
  ELSE
    RAISE NOTICE 'OK: sabhi users ke bcrypt hashes valid hain.';
  END IF;
END $$;

-- (6) Roles/permissions jo dump me kabhi-kabhi miss ho jaate hain
GRANT USAGE ON SCHEMA auth TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
