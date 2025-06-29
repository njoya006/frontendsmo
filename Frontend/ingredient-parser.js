// ChopSmo Professional Ingredient Parser
// Handles structured, semi-structured, and free-text ingredient lists
// Extracts quantity, unit, ingredient name, and preparation details
// Supports fuzzy matching, plural/singular units, and common culinary patterns

class IngredientParser {
    constructor() {
        // Common units and their variations
        this.units = [
            'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms',
            'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters',
            'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons',
            'tsp', 'teaspoon', 'teaspoons', 'oz', 'ounce', 'ounces',
            'lb', 'pound', 'pounds', 'pinch', 'clove', 'cloves',
            'slice', 'slices', 'can', 'cans', 'piece', 'pieces',
            'stick', 'sticks', 'bunch', 'bunches', 'dash', 'drop', 'drops',
            'quart', 'quarts', 'pint', 'pints', 'package', 'packages',
            'medium', 'large', 'small', 'head', 'heads', 'filet', 'filets',
            'sheet', 'sheets', 'bag', 'bags', 'container', 'containers', 'box', 'boxes',
            'packet', 'packets', 'jar', 'jars', 'bottle', 'bottles', 'canister', 'canisters',
            'tub', 'tubs', 'carton', 'cartons', 'block', 'blocks', 'roll', 'rolls',
            'cub', 'cubes', 'sprig', 'sprigs', 'leaf', 'leaves',
            'handful', 'handsful', 'teaspoonful', 'tablespoonful'
        ];
        this.unitsPattern = new RegExp(
            `(?:${this.units.map(u => u.replace(/s$/, '')).join('|')})`, 'i'
        );
    }

    // Main entry: parse any ingredient list (array of strings or objects)
    parseIngredients(rawIngredients, recipeTitle = '') {
        if (!rawIngredients) return [];
        if (Array.isArray(rawIngredients)) {
            return rawIngredients.map(item => this.parseIngredient(item)).filter(Boolean);
        } else if (typeof rawIngredients === 'object') {
            // Handle object/array-like structures
            return Object.values(rawIngredients).map(item => this.parseIngredient(item)).filter(Boolean);
        } else if (typeof rawIngredients === 'string') {
            // Split by newlines or commas
            return rawIngredients.split(/[\n,]/).map(line => this.parseIngredient(line)).filter(Boolean);
        }
        return [];
    }

    // Parse a single ingredient (string or object)
    parseIngredient(item) {
        if (!item) return null;
        if (typeof item === 'object') {
            // Already structured, normalize keys
            let name = item.ingredient_name || item.name || item.ingredient || item.title || item.item || '';
            name = (typeof name === 'string' ? name.trim() : String(name));
            if (!name) name = 'Unnamed Ingredient';
            return {
                ingredient_name: name,
                quantity: item.quantity || item.qty || item.amount || '',
                unit: item.unit || item.units || item.measurement || '',
                preparation: item.preparation || item.prep || item.method || ''
            };
        }
        if (typeof item !== 'string') return null;
        const line = item.trim();
        if (!line) return null;

        // Regex: [quantity] [unit] [ingredient] [, preparation]
        // e.g. "2 cups flour, sifted"
        const regex = /^(\d+[\d\/.\s]*)?\s*([a-zA-Z]+)?\s*([\w\s\-()]+?)(?:,\s*(.*))?$/;
        const match = line.match(regex);
        if (match) {
            let [, quantity, unit, name, prep] = match;
            quantity = quantity ? quantity.trim() : '';
            unit = unit && this.unitsPattern.test(unit) ? unit.trim() : '';
            name = name ? name.trim() : '';
            prep = prep ? prep.trim() : '';
            // Fuzzy: if unit is missing but name starts with a unit, fix
            if (!unit && name) {
                const unitMatch = name.match(this.unitsPattern);
                if (unitMatch) {
                    unit = unitMatch[0];
                    name = name.replace(this.unitsPattern, '').trim();
                }
            }
            if (!name) name = 'Unnamed Ingredient';
            return {
                ingredient_name: name,
                quantity,
                unit,
                preparation: prep
            };
        }
        // Fallback: treat as name only
        return { ingredient_name: line || 'Unnamed Ingredient', quantity: '', unit: '', preparation: '' };
    }

    // Extract ingredients from free text (e.g. description or instructions)
    extractIngredientsFromText(text) {
        if (!text || typeof text !== 'string') return [];
        // Look for lines with numbers, units, or common ingredient patterns
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        return lines
            .filter(line => /\d|cup|tbsp|tsp|g|kg|ml|l|oz|lb|clove|slice|can|bunch|egg|onion|garlic|salt|pepper|oil|butter|sugar|flour|water|milk/i.test(line))
            .map(line => this.parseIngredient(line));
    }

    // Fallback: create a generic ingredient list if none found
    createFallbackIngredients(recipeTitle = '') {
        return [
            { ingredient_name: 'Ingredient 1', quantity: '', unit: '', preparation: '' },
            { ingredient_name: 'Ingredient 2', quantity: '', unit: '', preparation: '' }
        ];
    }
}

// Make available globally
window.IngredientParser = IngredientParser;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IngredientParser;
}
