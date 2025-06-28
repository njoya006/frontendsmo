// Enhanced Recipe and Ingredient API Handler
// This utility handles robust ingredient and recipe management

class EnhancedRecipeAPI {
    constructor(baseUrl = 'https://njoya.pythonanywhere.com') {
        this.baseUrl = baseUrl;
        this.cache = new Map();
        this.cacheExpiration = 5 * 60 * 1000; // 5 minutes
    }

    // Get auth headers
    getHeaders() {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = token.startsWith('Token ') ? token : `Token ${token}`;
        }

        return headers;
    }

    // Enhanced recipe fetching with ingredient parsing
    async getRecipe(recipeId) {
        const cacheKey = `recipe_${recipeId}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheExpiration) {
            console.log('📦 Using cached recipe data for ID:', recipeId);
            return cached.data;
        }

        try {
            console.log('🔍 Fetching recipe from API:', `${this.baseUrl}/api/recipes/${recipeId}/`);
            
            const response = await fetch(`${this.baseUrl}/api/recipes/${recipeId}/`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const recipe = await response.json();
            console.log('📝 Raw recipe data received:', recipe);

            // Enhanced ingredient parsing
            const enhancedRecipe = this.parseRecipeIngredients(recipe);
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: enhancedRecipe,
                timestamp: Date.now()
            });

            console.log('✅ Enhanced recipe data:', enhancedRecipe);
            return enhancedRecipe;

        } catch (error) {
            console.error('❌ Error fetching recipe:', error);
            throw error;
        }
    }

    // Parse and normalize recipe ingredients from various formats
    parseRecipeIngredients(recipe) {
        console.log('🔧 Parsing ingredients for recipe:', recipe.title || recipe.name);
        
        let ingredients = [];

        // Try multiple possible ingredient field names and formats
        const possibleIngredientFields = [
            'ingredients',
            'ingredient_list', 
            'recipe_ingredients',
            'ingredients_text',
            'ingredient_data'
        ];

        for (const field of possibleIngredientFields) {
            if (recipe[field]) {
                console.log(`📋 Found ingredients in field '${field}':`, recipe[field]);
                ingredients = this.normalizeIngredients(recipe[field]);
                if (ingredients.length > 0) break;
            }
        }

        // If no structured ingredients found, try to parse from description or instructions
        if (ingredients.length === 0) {
            console.log('🔍 No structured ingredients found, attempting to extract from text...');
            ingredients = this.extractIngredientsFromText(recipe);
        }

        // If still no ingredients, create a default message
        if (ingredients.length === 0) {
            console.log('⚠️ No ingredients found, using default message');
            ingredients = ['Ingredients not available for this recipe'];
        }

        return {
            ...recipe,
            ingredients: ingredients,
            originalIngredients: recipe.ingredients // Keep original for reference
        };
    }

    // Normalize ingredients from various formats into consistent array
    normalizeIngredients(ingredientData) {
        console.log('🔄 Normalizing ingredients:', typeof ingredientData, ingredientData);

        if (!ingredientData) {
            return [];
        }

        // If it's already an array of strings/objects
        if (Array.isArray(ingredientData)) {
            return ingredientData.map(item => this.normalizeIngredientItem(item));
        }

        // If it's a string, try to parse it
        if (typeof ingredientData === 'string') {
            return this.parseIngredientString(ingredientData);
        }

        // If it's an object, try to extract ingredients
        if (typeof ingredientData === 'object') {
            // Check if it has ingredients property
            if (ingredientData.ingredients) {
                return this.normalizeIngredients(ingredientData.ingredients);
            }
            
            // If it's a single ingredient object
            return [this.normalizeIngredientItem(ingredientData)];
        }

        console.log('⚠️ Unknown ingredient data format');
        return [];
    }

    // Normalize a single ingredient item
    normalizeIngredientItem(item) {
        if (typeof item === 'string') {
            return item;
        }

        if (typeof item === 'object' && item !== null) {
            // Try various field names for ingredient name
            const name = item.ingredient_name || 
                        item.name || 
                        item.title || 
                        item.item ||
                        item.display_name ||
                        (item.ingredient && item.ingredient.name) ||
                        (item.ingredient && item.ingredient.ingredient_name) ||
                        'Unknown ingredient';

            // Try to get quantity information
            const quantity = item.quantity || item.amount || item.qty || '';
            const unit = item.unit || item.units || item.measurement || '';

            if (quantity && unit) {
                return `${quantity} ${unit} ${name}`;
            } else if (quantity) {
                return `${quantity} ${name}`;
            } else {
                return name;
            }
        }

        return 'Unknown ingredient';
    }

    // Parse ingredient string (comma-separated, line-separated, etc.)
    parseIngredientString(ingredientText) {
        console.log('📝 Parsing ingredient string:', ingredientText);

        if (!ingredientText || typeof ingredientText !== 'string') {
            return [];
        }

        // Try different separators
        let ingredients = [];

        // First try line breaks
        if (ingredientText.includes('\n')) {
            ingredients = ingredientText.split('\n');
        }
        // Then try semicolons
        else if (ingredientText.includes(';')) {
            ingredients = ingredientText.split(';');
        }
        // Then try commas
        else if (ingredientText.includes(',')) {
            ingredients = ingredientText.split(',');
        }
        // If no separators, treat as single ingredient
        else {
            ingredients = [ingredientText];
        }

        // Clean up each ingredient
        return ingredients
            .map(ingredient => ingredient.trim())
            .filter(ingredient => ingredient.length > 0)
            .map(ingredient => {
                // Remove common prefixes like numbers, dashes, bullets
                return ingredient.replace(/^[\d\-•\*\+]\s*/, '').trim();
            });
    }

    // Extract ingredients from recipe description or instructions
    extractIngredientsFromText(recipe) {
        console.log('🔍 Extracting ingredients from text content...');

        const text = (recipe.description || '') + ' ' + (recipe.instructions || '');
        const words = text.toLowerCase().split(/\s+/);

        // Common ingredient keywords to look for
        const commonIngredients = [
            'salt', 'pepper', 'oil', 'butter', 'garlic', 'onion', 'tomato', 'cheese',
            'flour', 'sugar', 'egg', 'milk', 'water', 'rice', 'pasta', 'chicken',
            'beef', 'fish', 'potato', 'carrot', 'lettuce', 'bread', 'lemon', 'herbs'
        ];

        const foundIngredients = [];
        
        for (const ingredient of commonIngredients) {
            if (words.includes(ingredient) || words.includes(ingredient + 's')) {
                foundIngredients.push(ingredient);
            }
        }

        if (foundIngredients.length > 0) {
            console.log('📝 Extracted ingredients from text:', foundIngredients);
            return foundIngredients;
        }

        return [];
    }

    // Enhanced recipe search with ingredient matching
    async searchRecipes(query, options = {}) {
        const {
            includeIngredients = false,
            limit = 20,
            filters = {}
        } = options;

        try {
            const params = new URLSearchParams({
                search: query,
                limit: limit.toString()
            });

            // Add filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'all') {
                    params.append(key, value);
                }
            });

            console.log('🔍 Searching recipes with params:', params.toString());

            const response = await fetch(`${this.baseUrl}/api/recipes/?${params}`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📝 Search results received:', data);

            // Parse results and enhance with ingredient data
            const results = data.results || data;
            const enhancedResults = results.map(recipe => {
                if (includeIngredients) {
                    return this.parseRecipeIngredients(recipe);
                }
                return recipe;
            });

            return enhancedResults;

        } catch (error) {
            console.error('❌ Error searching recipes:', error);
            throw error;
        }
    }

    // Get recipe suggestions based on ingredients
    async getRecipeSuggestions(ingredients, options = {}) {
        const {
            limit = 10,
            includeMissing = true
        } = options;

        try {
            console.log('🔍 Getting recipe suggestions for ingredients:', ingredients);

            const response = await fetch(`${this.baseUrl}/api/recipes/suggest-by-ingredients/`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    ingredient_names: ingredients,
                    limit: limit,
                    include_missing: includeMissing
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.log('⚠️ Suggestion API error response:', errorData);
                
                // Return helpful error information
                return {
                    success: false,
                    error: errorData,
                    suggestions: this.generateIngredientSuggestions(ingredients),
                    recipes: []
                };
            }

            const data = await response.json();
            console.log('✅ Recipe suggestions received:', data);

            // Parse and enhance suggestions
            const enhancedSuggestions = (data.suggested_recipes || data.recipes || [])
                .map(item => {
                    if (item.recipe) {
                        return {
                            ...item,
                            recipe: this.parseRecipeIngredients(item.recipe)
                        };
                    }
                    return this.parseRecipeIngredients(item);
                });

            return {
                success: true,
                recipes: enhancedSuggestions,
                suggestions: data.suggestions || {},
                metadata: data
            };

        } catch (error) {
            console.error('❌ Error getting recipe suggestions:', error);
            return {
                success: false,
                error: error.message,
                suggestions: this.generateIngredientSuggestions(ingredients),
                recipes: []
            };
        }
    }

    // Generate helpful ingredient suggestions when API fails
    generateIngredientSuggestions(ingredients) {
        const suggestions = {};
        const commonIngredients = {
            'tomatoe': 'tomato',
            'onions': 'onion', 
            'garlics': 'garlic',
            'potatos': 'potato',
            'carrots': 'carrot',
            'chickens': 'chicken',
            'beefs': 'beef',
            'rices': 'rice',
            'pastas': 'pasta'
        };

        ingredients.forEach(ingredient => {
            const lower = ingredient.toLowerCase();
            if (commonIngredients[lower]) {
                suggestions[ingredient] = commonIngredients[lower];
            }
        });

        return suggestions;
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Recipe cache cleared');
    }
}

// Create global instance
window.enhancedRecipeAPI = new EnhancedRecipeAPI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedRecipeAPI;
}

console.log('🔧 Enhanced Recipe API loaded successfully');
