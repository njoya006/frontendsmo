// Advanced Ingredient Parser for Recipe Details
// This utility handles complex ingredient parsing and validation

class IngredientParser {
    constructor() {
        this.commonIngredients = [
            'salt', 'pepper', 'oil', 'butter', 'flour', 'sugar', 'milk', 'egg', 'water',
            'onion', 'garlic', 'tomato', 'chicken', 'beef', 'pork', 'fish', 'rice',
            'pasta', 'cheese', 'cream', 'vinegar', 'lemon', 'herbs', 'spices'
        ];
        
        this.units = [
            'cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 'liter',
            'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons', 'ounce', 'ounces',
            'pound', 'pounds', 'gram', 'grams', 'kilogram', 'kilograms', 'milliliter',
            'milliliters', 'piece', 'pieces', 'slice', 'slices', 'clove', 'cloves',
            'medium', 'large', 'small', 'whole', 'half', 'quarter'
        ];
    }

    // Main parsing function that handles multiple input formats
    parseIngredients(ingredientData, recipeTitle = '') {
        console.log('🔧 Advanced ingredient parsing for:', recipeTitle);
        console.log('📋 Input data type:', typeof ingredientData, ingredientData);

        if (!ingredientData) {
            return this.createFallbackIngredients(recipeTitle);
        }

        // Handle different data types
        if (Array.isArray(ingredientData)) {
            return this.parseIngredientArray(ingredientData);
        }

        if (typeof ingredientData === 'string') {
            return this.parseIngredientString(ingredientData);
        }

        if (typeof ingredientData === 'object') {
            return this.parseIngredientObject(ingredientData);
        }

        console.log('⚠️ Unknown ingredient format, using fallback');
        return this.createFallbackIngredients(recipeTitle);
    }

    // Parse array of ingredients (most common format)
    parseIngredientArray(ingredients) {
        console.log(`📋 Parsing ${ingredients.length} ingredients from array`);
        
        return ingredients.map((ingredient, index) => {
            if (typeof ingredient === 'string') {
                return this.parseIngredientString(ingredient, true);
            }
            
            if (typeof ingredient === 'object' && ingredient !== null) {
                return this.parseIngredientObject(ingredient);
            }
            
            return `Ingredient ${index + 1}`;
        }).filter(Boolean);
    }

    // Parse string-based ingredients
    parseIngredientString(ingredientText, isSingle = false) {
        if (!ingredientText || typeof ingredientText !== 'string') {
            return isSingle ? 'Unknown ingredient' : [];
        }

        const text = ingredientText.trim();
        
        if (isSingle) {
            return this.formatSingleIngredient(text);
        }

        // Split by various delimiters
        const delimiters = ['\n', ';', '|', '•', '-'];
        let ingredients = [text];

        for (const delimiter of delimiters) {
            if (text.includes(delimiter)) {
                ingredients = text.split(delimiter);
                break;
            }
        }

        // If no delimiters found, try comma separation (less reliable)
        if (ingredients.length === 1 && text.includes(',')) {
            ingredients = text.split(',');
        }

        return ingredients
            .map(ing => this.formatSingleIngredient(ing))
            .filter(ing => ing && ing.length > 2);
    }

    // Parse object-based ingredients
    parseIngredientObject(ingredient) {
        const possibleNameFields = [
            'ingredient_name', 'name', 'title', 'item', 'display_name',
            'ingredient', 'food', 'food_name', 'product', 'product_name'
        ];

        const possibleQuantityFields = [
            'quantity', 'amount', 'qty', 'count', 'number', 'volume', 'weight'
        ];

        const possibleUnitFields = [
            'unit', 'units', 'measurement', 'measure', 'uom', 'unit_of_measure'
        ];

        // Extract name
        let name = '';
        for (const field of possibleNameFields) {
            if (ingredient[field]) {
                name = ingredient[field];
                break;
            }
        }

        // Handle nested ingredient objects
        if (!name && ingredient.ingredient) {
            if (typeof ingredient.ingredient === 'string') {
                name = ingredient.ingredient;
            } else if (typeof ingredient.ingredient === 'object') {
                for (const field of possibleNameFields) {
                    if (ingredient.ingredient[field]) {
                        name = ingredient.ingredient[field];
                        break;
                    }
                }
            }
        }

        // Extract quantity
        let quantity = '';
        for (const field of possibleQuantityFields) {
            if (ingredient[field]) {
                quantity = ingredient[field];
                break;
            }
        }

        // Extract unit
        let unit = '';
        for (const field of possibleUnitFields) {
            if (ingredient[field]) {
                unit = ingredient[field];
                break;
            }
        }

        // Format the ingredient
        return this.formatIngredientParts(name, quantity, unit);
    }

    // Format individual ingredient parts
    formatIngredientParts(name, quantity = '', unit = '') {
        if (!name) return 'Unknown ingredient';

        const cleanName = this.cleanIngredientName(name);
        const cleanQuantity = quantity ? quantity.toString().trim() : '';
        const cleanUnit = unit ? unit.toString().trim() : '';

        if (cleanQuantity && cleanUnit) {
            return `${cleanQuantity} ${cleanUnit} ${cleanName}`;
        } else if (cleanQuantity) {
            return `${cleanQuantity} ${cleanName}`;
        } else {
            return cleanName;
        }
    }

    // Format a single ingredient string
    formatSingleIngredient(ingredientText) {
        if (!ingredientText || typeof ingredientText !== 'string') {
            return '';
        }

        let text = ingredientText.trim();
        
        // Remove common prefixes
        text = text.replace(/^[-•*]\s*/, '');
        text = text.replace(/^\d+\.\s*/, '');
        
        // Clean up the text
        text = this.cleanIngredientName(text);
        
        return text;
    }

    // Clean ingredient names
    cleanIngredientName(name) {
        if (!name) return '';
        
        return name.toString()
            .trim()
            .replace(/^[-•*]\s*/, '')
            .replace(/^\d+\.\s*/, '')
            .replace(/\s+/g, ' ')
            .replace(/[""'']/g, '"')
            .trim();
    }

    // Create fallback ingredients based on recipe title/type
    createFallbackIngredients(recipeTitle = '') {
        console.log('🔄 Creating fallback ingredients for:', recipeTitle);
        
        const title = recipeTitle.toLowerCase();
        
        // Try to guess ingredients from recipe title
        const guessedIngredients = [];
        
        for (const ingredient of this.commonIngredients) {
            if (title.includes(ingredient)) {
                guessedIngredients.push(ingredient.charAt(0).toUpperCase() + ingredient.slice(1));
            }
        }

        if (guessedIngredients.length > 0) {
            console.log('🎯 Guessed ingredients from title:', guessedIngredients);
            return [...guessedIngredients, 'Check recipe instructions for complete ingredient list'];
        }

        // Default fallback
        return [
            'Ingredients not available for this recipe',
            'Please check the original source for the complete ingredient list'
        ];
    }

    // Validate if text looks like an ingredient
    looksLikeIngredient(text) {
        if (!text || typeof text !== 'string' || text.length < 2) {
            return false;
        }

        const lowText = text.toLowerCase().trim();
        
        // Skip if it's too generic or looks like instructions
        const skipPatterns = [
            /^step\s*\d+/i,
            /^instruction/i,
            /^direction/i,
            /^method/i,
            /^procedure/i,
            /^cook/i,
            /^bake/i,
            /^serve/i,
            /^enjoy/i,
            /^tip:/i,
            /^note:/i
        ];

        for (const pattern of skipPatterns) {
            if (pattern.test(lowText)) {
                return false;
            }
        }

        // Positive indicators
        const ingredientIndicators = [
            // Measurements
            /\d+\s*(cup|tbsp|tsp|oz|lb|g|kg|ml|l)/i,
            // Common ingredients
            /\b(salt|pepper|oil|butter|flour|sugar|milk|egg|water|onion|garlic|tomato)\b/i,
            // Quantity patterns
            /^\d+\s*\w+/,
            // List indicators
            /^[-•*]\s*\w+/
        ];

        return ingredientIndicators.some(pattern => pattern.test(lowText));
    }

    // Extract ingredients from free text (like descriptions or instructions)
    extractIngredientsFromText(text) {
        if (!text || typeof text !== 'string') return [];

        const lines = text.split(/[\n\r]+/);
        const potentialIngredients = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (this.looksLikeIngredient(trimmed)) {
                potentialIngredients.push(this.formatSingleIngredient(trimmed));
            }
        }

        // Also try to find ingredients in comma-separated text
        if (potentialIngredients.length === 0) {
            const sentences = text.split(/[.!?]+/);
            for (const sentence of sentences) {
                if (sentence.toLowerCase().includes('ingredient') || 
                    sentence.toLowerCase().includes('need') ||
                    sentence.toLowerCase().includes('use')) {
                    const parts = sentence.split(',');
                    for (const part of parts) {
                        const trimmed = part.trim();
                        if (this.looksLikeIngredient(trimmed)) {
                            potentialIngredients.push(this.formatSingleIngredient(trimmed));
                        }
                    }
                }
            }
        }

        return potentialIngredients.filter(ing => ing && ing.length > 2);
    }
}

// Export for global use
window.IngredientParser = IngredientParser;

console.log('🔧 Advanced Ingredient Parser loaded successfully');
