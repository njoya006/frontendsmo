// ingredientApi.js
// Utility to fetch all valid ingredient names from backend for validation/autocomplete

const API_BASE_URL = (typeof window !== 'undefined' && typeof window.getChopsmoApiBaseUrl === 'function')
    ? window.getChopsmoApiBaseUrl()
    : ((typeof window !== 'undefined' && window.CHOPSMO_CONFIG && window.CHOPSMO_CONFIG.API_BASE_URL)
        ? window.CHOPSMO_CONFIG.API_BASE_URL
        : 'http://56.228.22.20');
const INGREDIENTS_ENDPOINT = `${API_BASE_URL.replace(/\/$/, '')}/api/ingredients/`;

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
