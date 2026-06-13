
-- ── missions ─────────────────────────────────────────────────────────
-- Allow anon to update mission status (QA dashboard is public/shared).
-- WITH CHECK prevents setting invalid status values — no longer trivially true.
CREATE POLICY "anon_update_missions" ON missions
  FOR UPDATE TO anon, authenticated
  USING (id IS NOT NULL)
  WITH CHECK (
    status IN ('pending', 'running', 'passed', 'failed')
    AND phase BETWEEN 1 AND 10
  );

-- Anon should NOT insert or delete missions (seeded system data).
-- auth_insert_missions and auth_delete_missions (authenticated-only) already exist.

-- ── test_results ──────────────────────────────────────────────────────
-- anon_insert_test_results already has a meaningful WITH CHECK — no changes needed.
-- auth_update/delete already scoped to authenticated — no changes needed.
