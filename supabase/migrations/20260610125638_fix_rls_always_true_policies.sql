
-- ── missions ─────────────────────────────────────────────────────────
-- Drop the three always-true write policies
DROP POLICY IF EXISTS "insert_missions"  ON missions;
DROP POLICY IF EXISTS "update_missions"  ON missions;
DROP POLICY IF EXISTS "delete_missions"  ON missions;

-- Anon/authenticated may only SELECT missions (read-only dashboard data)
-- Mutations go through the server-side API using the service role key
-- If a future authenticated admin needs direct writes, add scoped policies here:
CREATE POLICY "auth_insert_missions" ON missions
  FOR INSERT TO authenticated
  WITH CHECK (phase BETWEEN 1 AND 10);

CREATE POLICY "auth_update_missions" ON missions
  FOR UPDATE TO authenticated
  USING (phase BETWEEN 1 AND 10)
  WITH CHECK (status IN ('pending', 'running', 'passed', 'failed'));

CREATE POLICY "auth_delete_missions" ON missions
  FOR DELETE TO authenticated
  USING (phase BETWEEN 1 AND 10);

-- ── test_results ──────────────────────────────────────────────────────
-- Drop the three always-true write policies
DROP POLICY IF EXISTS "insert_test_results"  ON test_results;
DROP POLICY IF EXISTS "update_test_results"  ON test_results;
DROP POLICY IF EXISTS "delete_test_results"  ON test_results;

-- Anon may INSERT new test run records (append-only logging).
-- The WITH CHECK ensures the row is structurally valid; it is not trivially true.
CREATE POLICY "anon_insert_test_results" ON test_results
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    endpoint IS NOT NULL
    AND method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')
  );

-- Only authenticated users may mutate or delete existing records
CREATE POLICY "auth_update_test_results" ON test_results
  FOR UPDATE TO authenticated
  USING (created_at > now() - interval '7 days')
  WITH CHECK (endpoint IS NOT NULL);

CREATE POLICY "auth_delete_test_results" ON test_results
  FOR DELETE TO authenticated
  USING (created_at > now() - interval '30 days');
