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

        const url = `${INGREDIENT_PRICES_ENDPOINT}?${params.toString()}`;
        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const detail = data.detail || data.error || data.message || 'Unable to load ingredient prices';
            return {
                success: false,
                error: detail,
                results: [],
                count: 0,
                next: null,
                previous: null
            };
        }

        return {
            success: true,
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
