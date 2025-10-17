// csrf-helpers.js
// Small helper to ensure the backend sets the csrftoken for .chopsmo.site
// and to provide helper wrappers for fetch and axios.

(function (global) {
  const API_CSRF_URL = (global && global.CHOPSMO_CONFIG && global.CHOPSMO_CONFIG.apiBase)
    ? `${global.CHOPSMO_CONFIG.apiBase.replace(/\/$/, '')}/api/csrf-debug/`
    : 'https://api.chopsmo.site/api/csrf-debug/';

  function getCookie(name) {
    if (!document.cookie) return null;
    const match = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
    return match ? decodeURIComponent(match[1]) : null;
  }

  function getCsrfToken() {
    return getCookie('csrftoken');
  }

  // ensureCsrf: make a GET to the csrf debug endpoint with credentials
  // to force the server to set the csrf cookie for the api domain.
  async function ensureCsrf() {
    try {
      await fetch(API_CSRF_URL, { credentials: 'include', method: 'GET' });
    } catch (e) {
      // swallow - best effort; caller can still read cookie after
      console.warn('ensureCsrf: request failed', e);
    }
    return getCsrfToken();
  }

  function csrfHeaders(extra = {}) {
    const token = getCsrfToken();
    const headers = Object.assign({}, extra);
    if (token) headers['X-CSRFToken'] = token;
    return headers;
  }

  // fetch wrapper that includes credentials and sets X-CSRFToken for unsafe methods
  async function fetchWithCsrf(input, init = {}) {
    const method = (init && init.method) || 'GET';
    const isUnsafe = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
    const opts = Object.assign({}, init, { credentials: 'include' });
    opts.headers = Object.assign({}, opts.headers || {});
    if (isUnsafe) {
      // ensure token present; if not, attempt to fetch it
      if (!getCsrfToken()) await ensureCsrf();
      const token = getCsrfToken();
      if (token) opts.headers['X-CSRFToken'] = token;
    }
    return fetch(input, opts);
  }

  // axios setup helper
  function axiosSetup(axiosInstance) {
    if (!axiosInstance) return;
    // send cookies
    axiosInstance.defaults.withCredentials = true;
    // add request interceptor to add X-CSRFToken for unsafe methods
    axiosInstance.interceptors.request.use(async function (config) {
      const method = (config.method || 'get').toUpperCase();
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        if (!getCsrfToken()) await ensureCsrf();
        const token = getCsrfToken();
        if (token) config.headers['X-CSRFToken'] = token;
      }
      return config;
    }, function (error) {
      return Promise.reject(error);
    });
  }

  // Auto-run ensureCsrf on load (best-effort)
  if (typeof window !== 'undefined') {
    // run after a short delay so script can be loaded in head safely
    setTimeout(() => { ensureCsrf(); }, 200);
  }

  // export
  global.csrfHelpers = {
    ensureCsrf,
    getCsrfToken,
    csrfHeaders,
    fetchWithCsrf,
    axiosSetup,
    getCookie,
  };

})(window);
