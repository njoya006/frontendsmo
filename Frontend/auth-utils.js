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
})();
