// Small helper utilities to normalize auth token retrieval and Authorization headers
(function () {
    // Return normalized token string suitable for an Authorization header, or null
    window.getAuthToken = function () {
        try {
            const raw = (localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || null);
            if (!raw) return null;
            // If already contains scheme, return as-is
            if (raw.startsWith('Token ') || raw.startsWith('Bearer ')) return raw;
            // If looks like a JWT (three segments), prefer Bearer
            if (raw.split && raw.split('.').length === 3) return `Bearer ${raw}`;
            // Default to Token scheme for DRF token auth
            return `Token ${raw}`;
        } catch (e) {
            return null;
        }
    };

    // Build headers object with optional extra headers merged in
    window.authHeaders = function (extraHeaders) {
        const headers = Object.assign({}, extraHeaders || {});
        const token = window.getAuthToken && window.getAuthToken();
        if (token) headers['Authorization'] = token;
        return headers;
    };

    // Read cookie by name (robust helper)
    window.getCookie = function (name) {
        try {
            if (typeof document === 'undefined' || !document.cookie) return null;
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        } catch (e) {
            return null;
        }
    };

    // Return the CSRF token from cookies if present
    window.getCsrfToken = function () {
        try {
            return window.getCookie('csrftoken') || window.getCookie('CSRF-TOKEN') || null;
        } catch (e) {
            return null;
        }
    };

    // Inject CSRF token into headers object if available and not already set
    window.csrfHeaders = function (extraHeaders) {
        const headers = Object.assign({}, extraHeaders || {});
        const csrf = window.getCsrfToken && window.getCsrfToken();
        if (csrf && !Object.keys(headers).some(k => k.toLowerCase() === 'x-csrftoken')) {
            headers['X-CSRFToken'] = csrf;
        }
        return headers;
    };
})();
