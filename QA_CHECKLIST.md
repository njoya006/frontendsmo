QA Checklist: Diagnostics & CI normalization

Pre-merge
- [ ] Confirm all changed diagnostic pages load locally and show the API base resolved from `window.CHOPSMO_CONFIG` when available.
- [ ] Verify `.github/workflows/grocery-list-endpoint-tests.yml` exists at repo root.
- [ ] Add `API_TOKEN` secret in repo settings if the grocery-list endpoint requires auth.
- [ ] Ensure no other `.github/workflows` copies exist in subdirectories.

Post-merge
- [ ] Trigger the workflow manually via Actions -> Grocery List Endpoint Tests -> Run workflow and verify it completes.
- [ ] Observe logs for JSON/CSV test steps.
- [ ] Validate production `https://api.chopsmo.site` CORS settings allow `https://www.chopsmo.site`.

Manual checks
- [ ] Open `test-connection.html` from the built site and click "Test Basic Connection". Expect success against `https://api.chopsmo.site/api/`.
- [ ] Run `search-api-test.html` and confirm search results are returned for common terms ("chicken", "pasta").
- [ ] Run `recipe-diagnostic.html` and confirm recipe list is returned.

Rollback
- If CI fails due to auth errors, set `API_BASE` secret to target staging or set `API_TOKEN` to a valid token for testing.
