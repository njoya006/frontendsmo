// ingredientApi.js
// Utility to fetch all valid ingredient names from backend for validation/autocomplete

export async function fetchAllIngredientNames() {
    try {
        const response = await fetch('https://frontendsmo.vercel.app/api/ingredients/', {
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
