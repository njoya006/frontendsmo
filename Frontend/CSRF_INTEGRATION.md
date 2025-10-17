CSRF Integration Guide

Purpose
This file explains how to integrate `Frontend/csrf-helpers.js` into the SPA and the minimal backend settings the server must expose so cross-origin credentialed logins work from `https://www.chopsmo.site` to `https://api.chopsmo.site`.

Quick integration (copy/paste)

1) Include the helper before your app code (plain HTML):

<script src="/Frontend/csrf-helpers.js"></script>
<script>
  // Optional: call ensureCsrf explicitly before rendering login form
  csrfHelpers.ensureCsrf();
  // If using axios:
  // csrfHelpers.axiosSetup(axios);
</script>

2) Using fetch for login (example):

const login = async (credentials) => {
  const res = await csrfHelpers.fetchWithCsrf('https://api.chopsmo.site/api/users/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return res.json();
};

3) Using axios (example):

// at app init
csrfHelpers.axiosSetup(axios);

// then regular axios call will include credentials and X-CSRFToken
axios.post('https://api.chopsmo.site/api/users/login/', credentials).then(...)

What the backend must provide (Checklist for backend team)
- Add `https://www.chopsmo.site` to Django `CSRF_TRUSTED_ORIGINS` (include scheme):
  CSRF_TRUSTED_ORIGINS = ['https://www.chopsmo.site']

- Ensure CORS allows credentials and the origin:
  CORS_ALLOWED_ORIGINS = ['https://www.chopsmo.site']
  CORS_ALLOW_CREDENTIALS = True

- CSRF cookie settings for cross-site contexts:
  CSRF_COOKIE_SAMESITE = 'None'
  CSRF_COOKIE_SECURE = True
  # Ensure CSRF_COOKIE_HTTPONLY = False so client can read cookie if needed

- Ensure some safe GET endpoint sets the CSRF cookie (e.g., `/api/csrf-debug/` using Django's `@ensure_csrf_cookie` decorator or render a template that calls `{% csrf_token %}`).

DevTools verification steps (copy/paste for QA)
- Application → Cookies: Verify `csrftoken` exists, Domain `.chopsmo.site`, SameSite `None`, Secure `true`.
- Network → POST `/api/users/login/`: Verify Request Headers contain `Cookie: csrftoken=...` and `X-CSRFToken: ...`.

Notes
- Modern browsers block cross-site cookies unless `SameSite=None` and `Secure=True`.
- If your frontend is served from `localhost` during dev, cross-site cookie behavior differs — test from the real origin when validating.

