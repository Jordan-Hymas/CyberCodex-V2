-- Run as the migration owner AFTER migrations, and again when adding tables.
-- Set the password separately with psql's: \password cybercodex_app
-- Never put a real password in this file or source control.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cybercodex_app') THEN
    CREATE ROLE cybercodex_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
END $$;
REVOKE ALL ON SCHEMA cybercodex FROM PUBLIC;
GRANT USAGE ON SCHEMA cybercodex TO cybercodex_app;
DO $$
DECLARE t text; api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA cybercodex FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA cybercodex FROM %I', api_role);
    END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['User','Account','Session','VerificationToken','CourseProgress','UserExercise','Badge','UserBadge','UserFollow','LoginAttempt','LinuxLabSession'] LOOP
    EXECUTE format('REVOKE ALL ON TABLE cybercodex.%I FROM PUBLIC', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE cybercodex.%I TO cybercodex_app', t);
    EXECUTE format('ALTER TABLE cybercodex.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS app_server_access ON cybercodex.%I', t);
    EXECUTE format('CREATE POLICY app_server_access ON cybercodex.%I TO cybercodex_app USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
-- The server role intentionally handles all learners; Next.js must check user
-- identity/ownership. Supabase Auth JWTs are not used by this Auth.js app.
-- Do not grant this role to anon/authenticated or use it in browser code.
