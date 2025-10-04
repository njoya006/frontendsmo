(function initChopsmoConfig() {
    const DEFAULT_API_BASE = 'https://api.chopsmo.site';
    const defaultConfig = Object.freeze({
        API_BASE_URL: DEFAULT_API_BASE,
        ADMIN_URL: `${DEFAULT_API_BASE.replace(/\/$/, '')}/admin/`
    });

    // Preserve any pre-existing configuration but fall back to defaults where needed.
    const existingConfig = (typeof window !== 'undefined' && window.CHOPSMO_CONFIG) || {};
    function preferHttps(url) {
        if (typeof url !== 'string') return url;
        if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:' && url.startsWith('http://')) {
            return url.replace('http://', 'https://');
        }
        return url;
    }

    const mergedConfig = Object.freeze({
        API_BASE_URL: preferHttps(existingConfig.API_BASE_URL || defaultConfig.API_BASE_URL),
        ADMIN_URL: preferHttps(existingConfig.ADMIN_URL || defaultConfig.ADMIN_URL)
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
