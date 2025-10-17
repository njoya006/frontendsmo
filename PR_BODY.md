PR: Centralize auth + CSRF helpers, normalize auth headers, and add diagnostics

Summary

This PR centralizes frontend auth and CSRF behavior, fixes multipart recipe creation, and adds diagnostics helpers and docs to aid mobile login debugging. The goal is to standardize Authorization header construction, ensure the client can obtain/send CSRF cookies/headers across subdomains, and provide QA/dev checklists.

Files added/changed (high level)

- Added `Frontend/auth-utils.js` - centralized token normalization and Authorization header helpers.
- Added `Frontend/csrf-helpers.js` - auto-fetch CSRF cookie on load and helpers for fetch/axios.
- Updated many frontend modules to use `auth-utils.js` (Login, Signup, Recipes, Profile, etc.).
- Added `Frontend/CSRF_INTEGRATION.md` - integration snippets and DevTools checklist.
- Added `Frontend/scripts/smoke-test.ps1` - PowerShell smoke test for login and recipes endpoint.

Why this change

- Prevent duplicated/incorrect Authorization headers and inconsistent token formats.
- Allow the SPA to obtain a CSRF cookie from `api.chopsmo.site` and attach `X-CSRFToken` for unsafe requests.
- Provide clear debug instructions and a smoke-test to help triage mobile login failures caused by CSRF/CORS misconfiguration.

Backend actions required (blocking for mobile login)

1. Add the frontend origin to CSRF and CORS allowlists (include scheme):

- CSRF_TRUSTED_ORIGINS += ['https://www.chopsmo.site']
- CORS_ALLOWED_ORIGINS += ['https://www.chopsmo.site']
- CORS_ALLOW_CREDENTIALS = True

2. Ensure CSRF cookie settings allow cross-site usage:

- CSRF_COOKIE_SAMESITE = 'None'
- CSRF_COOKIE_SECURE = True
- (Optional) CSRF_COOKIE_DOMAIN = '.chopsmo.site' // if you want to scope explicitly
- Ensure CSRF_COOKIE_HTTPONLY = False if the client needs to read the cookie to set X-CSRFToken.

3. Ensure the server sets the `csrftoken` cookie on a safe GET (template render or an endpoint decorated with `@ensure_csrf_cookie`, e.g. `/api/csrf-debug/`).

Verification steps for backend and QA

- Use DevTools Application → Cookies to confirm `csrftoken` is set with Domain `.chopsmo.site`, SameSite None, Secure True.
- Use Network tab to verify the login POST includes `Cookie: csrftoken=...` and `X-CSRFToken: ...` headers.
- If failures persist, provide server logs for requests to `LogOriginMiddleware` and the POST 403/400 log output.

Notes

- This PR intentionally keeps auth logic centralized and non-invasive. Backend changes are required for secure cross-subdomain logins and cannot be fully worked around on the frontend.

Requested reviewers

- Backend engineer (CSRF/CORS changes)
- Frontend engineer (to integrate helpers where needed and run QA)
