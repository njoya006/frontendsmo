// ingredientApi.js
// Utility to fetch all valid ingredient names from backend for validation/autocomplete

const API_BASE_URL = (typeof window !== 'undefined' && typeof window.getChopsmoApiBaseUrl === 'function')
    ? window.getChopsmoApiBaseUrl()
    : ((typeof window !== 'undefined' && window.CHOPSMO_CONFIG && window.CHOPSMO_CONFIG.API_BASE_URL)
        ? window.CHOPSMO_CONFIG.API_BASE_URL
    : 'https://api.chopsmo.site');
const NORMALIZED_API_BASE = API_BASE_URL.replace(/\/$/, '');
const INGREDIENTS_ENDPOINT = `${NORMALIZED_API_BASE}/api/ingredients/`;
const INGREDIENT_PRICES_ENDPOINT = `${NORMALIZED_API_BASE}/api/ingredient-prices/`;

// Known alternative endpoints to try if the primary path returns 404.
const ALT_INGREDIENT_PRICES_ENDPOINTS = [
    `${NORMALIZED_API_BASE}/api/ingredient_price/`,
    `${NORMALIZED_API_BASE}/api/prices/ingredient/`,
    `${NORMALIZED_API_BASE}/api/prices/`
];

export async function fetchAllIngredientNames() {
    try {
        const response = await fetch(INGREDIENTS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        if (!response.ok) {
            return [];
        }
        // Assume backend returns [{name: 'onion'}, ...]
        return Array.isArray(data) ? data.map(ing => ing.name.toLowerCase()) : [];
    } catch (error) {
        return [];
    }
}

export async function fetchIngredientPrices(options = {}) {
    const {
        page = 1,
        pageSize = 20,
        search = '',
        ordering = '',
        filters = {}
    } = options;

    try {
        const params = new URLSearchParams();
        if (page) params.set('page', page);
        if (pageSize) params.set('page_size', pageSize);
        if (search) params.set('search', search);
        if (ordering) params.set('ordering', ordering);

        Object.entries(filters || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.set(key, value);
            }
        });

        const headers = window.authHeaders
            ? window.authHeaders({ Accept: 'application/json' })
            : { Accept: 'application/json' };

        const headersToUse = headers;

        async function fetchUrl(urlToFetch) {
            const res = await fetch(urlToFetch, { method: 'GET', headers: headersToUse });
            const body = await res.json().catch(() => ({}));
            return { res, body };
        }

        const primaryUrl = `${INGREDIENT_PRICES_ENDPOINT}?${params.toString()}`;
        let { res: response, body: data } = await fetchUrl(primaryUrl);

        // If primary endpoint returned 404, probe alternatives (helpful for older/newer backends)
        const probe = [];
        probe.push({ url: primaryUrl, status: response.status, ok: response.ok });

        if (response.status === 404) {
            for (const altBase of ALT_INGREDIENT_PRICES_ENDPOINTS) {
                const altUrl = `${altBase}?${params.toString()}`;
                const { res: altRes, body: altBody } = await fetchUrl(altUrl);
                probe.push({ url: altUrl, status: altRes.status, ok: altRes.ok });
                if (altRes.ok) {
                    response = altRes;
                    data = altBody;
                    break;
                }
            }
        }

        if (!response.ok) {
            const detail = (data && (data.detail || data.error || data.message)) || `Unable to load ingredient prices (status ${response.status})`;
            return {
                success: false,
                error: detail,
                results: [],
                count: 0,
                next: null,
                previous: null,
                probe // diagnostic info to help debug missing endpoints
            };
        }

        return {
            success: true,
            probe: probe || [],
            ...data
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            results: [],
            count: 0,
            next: null,
            previous: null
        };
    }
}
