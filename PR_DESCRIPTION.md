## PR: Normalize diagnostics, CI, and API host

This PR centralizes diagnostic test pages to use the shared ChopSmo API configuration, promotes the CI workflow to the repository root, and removes a misplaced legacy workflow.

What changed
- Added `Frontend/diagnostic-config.js` (helper to resolve API base from `window.CHOPSMO_CONFIG` or default to `https://api.chopsmo.site`).
- Updated diagnostic pages (`test-connection.html`, `search-api-test.html`, `recipe-test.html`, `recipe-fix-tools.html`, `recipe-diagnostic.html`) to use the helper instead of hard-coded `pythonanywhere` host.
- Created `.github/workflows/grocery-list-endpoint-tests.yml` at repo root with defaults to `https://api.chopsmo.site` and support for `secrets.API_BASE` and `secrets.API_TOKEN`.
- Removed old `Frontend/.github/workflows/grocery-list-endpoint-tests.yml` to prevent duplicate workflows.

Why
- Prevents mixed hosts and stale test targets. Makes diagnostics portable and consistent with the live API host.
- Ensures GitHub Actions picks up the workflow (workflows must live in repo-root `.github/workflows`).

Notes
- This PR does not change production runtime code (app logic remains same). Next steps: align frontend payloads with API request/response shapes and implement missing features.
