// Diagnostic helper to resolve API base for test pages
function resolveApiBase() {
    try {
        if (typeof window !== 'undefined') {
            if (typeof window.getChopsmoApiBaseUrl === 'function') {
                const v = window.getChopsmoApiBaseUrl();
                if (v) return v.replace(/\/$/, '');
            }
            if (window.CHOPSMO_CONFIG && window.CHOPSMO_CONFIG.API_BASE_URL) {
                return window.CHOPSMO_CONFIG.API_BASE_URL.replace(/\/$/, '');
            }
        }
    } catch (e) {
        console.warn('diagnostic-config.resolveApiBase error:', e);
    }
    return 'https://api.chopsmo.site';
}
