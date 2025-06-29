// ChopSmo Recipe Analytics Handler
// Handles Save, Like, and Comment actions with real-time UI updates

class RecipeAnalytics {
    static async postAction(recipeId, action, data = {}) {
        let url = `/api/recipes/${recipeId}/${action}/`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: Object.keys(data).length ? JSON.stringify(data) : undefined
            });
            if (!response.ok) throw new Error('Network error');
            return await response.json();
        } catch (e) {
            console.error(`Failed to ${action} recipe:`, e);
            return null;
        }
    }

    static async save(recipeId) {
        return await this.postAction(recipeId, 'save');
    }
    static async like(recipeId) {
        return await this.postAction(recipeId, 'like');
    }
    static async comment(recipeId, comment) {
        return await this.postAction(recipeId, 'comment', { comment });
    }
}

// Make available globally
window.RecipeAnalytics = RecipeAnalytics;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecipeAnalytics;
}
