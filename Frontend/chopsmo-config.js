(function initChopsmoConfig() {
    const defaultConfig = Object.freeze({
        API_BASE_URL: 'http://56.228.22.20',
        ADMIN_URL: 'http://56.228.22.20/admin/'
    });

    // Preserve any pre-existing configuration but fall back to defaults where needed.
    const existingConfig = (typeof window !== 'undefined' && window.CHOPSMO_CONFIG) || {};
    const mergedConfig = Object.freeze({
        API_BASE_URL: existingConfig.API_BASE_URL || defaultConfig.API_BASE_URL,
        ADMIN_URL: existingConfig.ADMIN_URL || defaultConfig.ADMIN_URL
    });

    if (typeof window !== 'undefined') {
        window.CHOPSMO_CONFIG = mergedConfig;
        window.getChopsmoConfig = function getChopsmoConfig() {
            return window.CHOPSMO_CONFIG || mergedConfig;
        };
        window.getChopsmoApiBaseUrl = function getChopsmoApiBaseUrl() {
            const config = window.getChopsmoConfig ? window.getChopsmoConfig() : mergedConfig;
            return (config && config.API_BASE_URL) || defaultConfig.API_BASE_URL;
        };
        window.getChopsmoAdminUrl = function getChopsmoAdminUrl() {
            const config = window.getChopsmoConfig ? window.getChopsmoConfig() : mergedConfig;
            return (config && config.ADMIN_URL) || defaultConfig.ADMIN_URL;
        };
        window.buildChopsmoUrl = function buildChopsmoUrl(path = '') {
            const base = window.getChopsmoApiBaseUrl ? window.getChopsmoApiBaseUrl() : defaultConfig.API_BASE_URL;
            if (!path) return base;
            if (typeof path !== 'string') {
                console.warn('[ChopSmo] buildChopsmoUrl expected string path but got', path);
                return base;
            }
            if (path.startsWith('http://') || path.startsWith('https://')) {
                return path;
            }
            const normalizedBase = base.replace(/\/$/, '');
            const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
            return `${normalizedBase}/${normalizedPath}`;
        };
        window.buildChopsmoApiUrl = function buildChopsmoApiUrl(path = '') {
            const normalizedPath = typeof path === 'string' && path.startsWith('/') ? path : `/${path || ''}`;
            return window.buildChopsmoUrl(normalizedPath);
        };

        if (!window.__chopsmoConfigLogged) {
            console.log('[ChopSmo] Config loaded:', mergedConfig);
            window.__chopsmoConfigLogged = true;
        }
    }
})();
