// Enhanced Recipe Detail JavaScript
class RecipeDetailManager {
    constructor() {
        // Check if utils.js is loaded, use fallback if not
        if (typeof RecipeAPI !== 'undefined') {
            // Use production URL only
            this.baseUrl = 'https://njoya.pythonanywhere.com';
            this.recipeAPI = new RecipeAPI(this.baseUrl);
            this.useAPI = true;
            
            console.log('RecipeAPI initialized with base URL:', this.recipeAPI.baseUrl);
        } else {
            console.warn('RecipeAPI not found. Using mock data for demonstration.');
            this.useAPI = false;
            this.baseUrl = 'https://njoya.pythonanywhere.com';
        }
        
        this.currentRecipe = null;
        this.recipeId = null;
        this.isOwner = false;
        
        this.initializeElements();
        this.loadRecipe();
    }

    initializeElements() {
        // Main containers
        this.container = document.getElementById('recipeDetailContainer');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.errorState = document.getElementById('errorState');
        this.recipeContent = document.getElementById('recipeContent');
        
        // Recipe elements
        this.heroImage = document.getElementById('recipeHeroImage');
        this.recipeTitle = document.getElementById('recipeTitle');
        this.recipeSubtitle = document.getElementById('recipeSubtitle');
        this.recipeStats = document.getElementById('recipeStats');
        this.recipeBadges = document.getElementById('recipeBadges');
        this.recipeQuickInfo = document.getElementById('recipeQuickInfo');
        this.recipeDescription = document.getElementById('recipeDescription');
        this.ingredientsList = document.getElementById('ingredientsList');
        this.instructionsList = document.getElementById('instructionsList');
        this.actionButtons = document.getElementById('actionButtons');
        
        // Contributor elements
        this.contributorSection = document.getElementById('contributorSection');
        this.contributorAvatar = document.getElementById('contributorAvatar');
        this.contributorName = document.getElementById('contributorName');
        this.contributorBio = document.getElementById('contributorBio');
        
        // Utility elements
        this.toast = document.getElementById('toast');
        this.globalOverlay = document.getElementById('globalOverlay');
        this.errorMessage = document.getElementById('errorMessage');
        
        // Get recipe ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.recipeId = urlParams.get('id') || '1';
        console.log('Recipe ID from URL:', this.recipeId);
    }

    async loadRecipe() {
        if (!this.recipeId) {
            console.log('No recipe ID provided, showing default recipe');
            this.recipeId = '1';
            this.showToast('No recipe ID provided - showing featured recipe', 'info');
        }

        this.showLoading();
        console.log('🔍 Loading recipe with ID:', this.recipeId);

        try {
            let recipe;
            
            // Use enhanced recipe API if available, otherwise fallback to regular API
            if (window.enhancedRecipeAPI) {
                console.log('🚀 Using enhanced recipe API for better ingredient parsing');
                recipe = await window.enhancedRecipeAPI.getRecipe(this.recipeId);
            } else if (this.useAPI) {
                console.log('📡 Using standard recipe API');
                recipe = await this.recipeAPI.getRecipe(this.recipeId);
            } else {
                // Fallback to direct API call with enhanced ingredient processing
                console.log('📡 Using direct API call with enhanced processing');
                recipe = await this.fetchAndProcessRecipe(this.recipeId);
            }
            
            console.log('✅ Recipe data received:', recipe);
            
            if (!recipe) {
                throw new Error('No recipe data received from API');
            }

            if (!recipe.id && !recipe.title && !recipe.name) {
                throw new Error('Invalid recipe data structure');
            }

            // Additional ingredient processing to ensure we have all ingredients
            recipe = await this.enhanceRecipeIngredients(recipe);

            // Success - render the recipe
            this.currentRecipe = recipe;
            this.isOwner = false;
            this.renderRecipe(recipe);
            this.hideLoading();
            
            console.log('🎉 Recipe loaded successfully!');
            
        } catch (error) {
            console.error('❌ API Error loading recipe:', error);
            
            // Try fallback to mock data
            console.log('🔄 Trying fallback to mock data...');
            try {
                const mockRecipe = this.getMockRecipe(this.recipeId);
                if (mockRecipe) {
                    console.log('✅ Using mock data as fallback:', mockRecipe);
                    this.currentRecipe = mockRecipe;
                    this.isOwner = false;
                    this.renderRecipe(mockRecipe);
                    this.hideLoading();
                    this.showToast('Using demo recipe data (API connection failed)', 'warning');
                    return;
                }
            } catch (mockError) {
                console.error('❌ Mock data fallback failed:', mockError);
            }
            
            this.hideLoading();
            this.showError(`Failed to load recipe: ${error.message}`);
        }
    }

    // Enhanced recipe ingredient processing
    async enhanceRecipeIngredients(recipe) {
        console.log('🔧 Enhancing recipe ingredients:', recipe.title);
        
        // If recipe already has processed ingredients, return as is
        if (recipe.ingredients && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
            console.log('✅ Recipe already has ingredients array:', recipe.ingredients.length);
            return recipe;
        }

        // Try to get ingredients from separate API endpoint
        try {
            const ingredientsResponse = await fetch(`${this.baseUrl}/api/recipes/${recipe.id}/ingredients/`, {
                headers: this.getHeaders()
            });
            
            if (ingredientsResponse.ok) {
                const ingredients = await ingredientsResponse.json();
                console.log('🍯 Fetched ingredients from separate endpoint:', ingredients);
                recipe.ingredients = ingredients;
                return recipe;
            }
        } catch (error) {
            console.log('ℹ️ No separate ingredients endpoint available');
        }

        // Try to parse ingredients from text fields
        const textFields = ['description', 'instructions', 'method', 'summary'];
        for (const field of textFields) {
            if (recipe[field]) {
                const extractedIngredients = this.extractIngredientsFromText(recipe[field]);
                if (extractedIngredients.length > 0) {
                    console.log(`🔍 Extracted ${extractedIngredients.length} ingredients from ${field}`);
                    recipe.ingredients = extractedIngredients;
                    return recipe;
                }
            }
        }

        // If still no ingredients, use placeholder
        console.log('⚠️ No ingredients found, using placeholder');
        recipe.ingredients = ['Ingredients not specified for this recipe'];
        
        return recipe;
    }

    // Fallback recipe fetching with enhanced processing
    async fetchAndProcessRecipe(recipeId) {
        const response = await fetch(`${this.baseUrl}/api/recipes/${recipeId}/`, {
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const recipe = await response.json();
        console.log('📝 Raw recipe data:', recipe);

        return recipe;
    }

    // Extract ingredients from text using common patterns
    extractIngredientsFromText(text) {
        if (!text || typeof text !== 'string') return [];

        const ingredients = [];
        const lines = text.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Look for lines that might be ingredients
            if (this.looksLikeIngredient(trimmed)) {
                ingredients.push(trimmed);
            }
        }

        return ingredients;
    }

    // Check if a line looks like an ingredient
    looksLikeIngredient(line) {
        if (!line || line.length < 3) return false;
        
        // Common ingredient patterns
        const ingredientPatterns = [
            /^\d+\s*(cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l)/i, // Measurements
            /^\d+\s*\w+\s+\w+/, // Number + unit + ingredient
            /^(salt|pepper|oil|butter|flour|sugar|milk|egg|water|onion|garlic|tomato)/i, // Common ingredients
            /^-\s*\w+/, // Bulleted lists
            /^\*\s*\w+/, // Starred lists
        ];

        return ingredientPatterns.some(pattern => pattern.test(line));
    }

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

    getMockRecipe(id) {
        // Mock recipe data for testing
        const mockRecipes = {
            1: {
                id: 1,
                title: "Chicken Curry",
                description: "A delicious and aromatic chicken curry made with tender chicken pieces, coconut milk, and a blend of traditional spices.",
                image: "images/Chicken Chips.jpg",
                prep_time: 30,
                cooking_time: 45,
                servings: 4,
                calories: 350,
                difficulty: "Medium",
                meal_type: "Dinner",
                ingredients: [
                    { ingredient_name: "Chicken breast", quantity: "500", unit: "g" },
                    { ingredient_name: "Coconut milk", quantity: "400", unit: "ml" },
                    { ingredient_name: "Onions", quantity: "2", unit: "medium" },
                    { ingredient_name: "Garlic cloves", quantity: "4", unit: "pieces" },
                    { ingredient_name: "Ginger", quantity: "1", unit: "inch" },
                    { ingredient_name: "Curry powder", quantity: "2", unit: "tbsp" },
                    { ingredient_name: "Turmeric", quantity: "1", unit: "tsp" },
                    { ingredient_name: "Salt", quantity: "1", unit: "tsp" },
                    { ingredient_name: "Vegetable oil", quantity: "3", unit: "tbsp" },
                    { ingredient_name: "Fresh cilantro", quantity: "1/4", unit: "cup" }
                ],
                instructions: "1. Heat oil in a large pan over medium heat.\n2. Add onions and cook until soft.\n3. Add garlic, ginger, curry powder, and turmeric. Cook for 1 minute.\n4. Add chicken and cook until browned.\n5. Pour in coconut milk and bring to a simmer.\n6. Cook for 20-25 minutes until chicken is cooked through.\n7. Season with salt and garnish with cilantro.\n8. Serve with rice or naan bread.",
                created_by: {
                    username: "ChefDemo",
                    first_name: "Demo",
                    last_name: "Chef"
                }
            }
        };

        return mockRecipes[id] || null;
    }

    renderRecipe(recipe) {
        console.log('🎨 Rendering recipe:', recipe.title || recipe.name);
        
        // Set hero image
        if (this.heroImage && recipe.image) {
            this.heroImage.src = this.getImageUrl(recipe.image);
            this.heroImage.alt = recipe.title || recipe.name || 'Recipe image';
        }
        
        // Set title and subtitle
        if (this.recipeTitle) {
            this.recipeTitle.textContent = recipe.title || recipe.name || 'Untitled Recipe';
        }
        
        if (this.recipeSubtitle) {
            this.recipeSubtitle.textContent = recipe.description || 'No description available';
        }
        
        // Render description
        if (this.recipeDescription) {
            this.recipeDescription.textContent = recipe.description || recipe.summary || 'No description available';
        }
        
        // Render ingredients
        this.renderIngredients(recipe.ingredients || []);
        
        // Render instructions
        this.renderInstructions(recipe.instructions || recipe.method || '');
        
        // Show content
        if (this.recipeContent) {
            this.recipeContent.classList.remove('hidden');
        }
        
        console.log('✅ Recipe rendered successfully');
    }

    renderIngredients(ingredients) {
        console.log('🍯 Rendering ingredients:', ingredients);
        
        if (!this.ingredientsList) {
            console.error('❌ Ingredients list element not found');
            return;
        }
        
        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            console.log('❌ No valid ingredients array found');
            this.ingredientsList.innerHTML = '<li class="ingredient-item"><span class="ingredient-name">No ingredients listed</span></li>';
            return;
        }

        console.log(`✅ Processing ${ingredients.length} ingredients`);

        const ingredientItems = ingredients.map((ingredient, index) => {
            let name, quantity = '';
            
            if (typeof ingredient === 'string') {
                name = ingredient;
                console.log(`String ingredient ${index + 1}: "${name}"`);
            } else if (typeof ingredient === 'object' && ingredient !== null) {
                // Extract name - try common field names
                name = ingredient.ingredient_name || 
                       ingredient.name || 
                       ingredient.title || 
                       ingredient.item ||
                       ingredient.display_name ||
                       (ingredient.ingredient && ingredient.ingredient.name) ||
                       (ingredient.ingredient && ingredient.ingredient.ingredient_name) ||
                       `Ingredient ${index + 1}`;
                
                // Extract quantity and unit
                const qty = ingredient.quantity || ingredient.amount || ingredient.qty || '';
                const unit = ingredient.unit || ingredient.units || ingredient.measurement || '';
                
                if (qty && unit) {
                    quantity = `${qty} ${unit}`;
                } else if (qty) {
                    quantity = qty.toString();
                }
                
                console.log(`Object ingredient ${index + 1}:`, { name, quantity, original: ingredient });
            } else {
                name = `Unknown ingredient ${index + 1}`;
                console.log(`Unknown ingredient type ${index + 1}:`, typeof ingredient);
            }

            return `
                <li class="ingredient-item">
                    <span class="ingredient-name">${name}</span>
                    ${quantity ? `<span class="ingredient-quantity">${quantity}</span>` : ''}
                </li>
            `;
        }).join('');

        this.ingredientsList.innerHTML = ingredientItems;
        console.log('✅ Ingredients rendered successfully');
    }

    renderInstructions(instructions) {
        if (!this.instructionsList) {
            console.error('❌ Instructions list element not found');
            return;
        }
        
        if (!instructions) {
            this.instructionsList.innerHTML = '<li class="instruction-item"><span class="instruction-text">No instructions provided</span></li>';
            return;
        }

        let steps = [];
        
        if (typeof instructions === 'string') {
            steps = instructions.split(/\n/).filter(step => step.trim());
        } else if (Array.isArray(instructions)) {
            steps = instructions;
        }

        if (steps.length === 0) {
            this.instructionsList.innerHTML = '<li class="instruction-item"><span class="instruction-text">No instructions provided</span></li>';
            return;
        }

        const instructionItems = steps.map((step, index) => {
            const cleanStep = step.trim().replace(/^\d+\.\s*/, '');
            return `
                <li class="instruction-item">
                    <span class="step-number">${index + 1}</span>
                    <span class="instruction-text">${cleanStep}</span>
                </li>
            `;
        }).join('');

        this.instructionsList.innerHTML = instructionItems;
    }

    getImageUrl(imagePath) {
        if (!imagePath) return 'assets/default-recipe.jpg';
        
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        if (imagePath.startsWith('/')) {
            return this.baseUrl + imagePath;
        }
        
        return imagePath;
    }

    showLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.remove('hidden');
        }
        if (this.recipeContent) {
            this.recipeContent.classList.add('hidden');
        }
        if (this.errorState) {
            this.errorState.classList.add('hidden');
        }
    }

    hideLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.add('hidden');
        }
    }

    showError(message) {
        if (this.errorState) {
            this.errorState.classList.remove('hidden');
            if (this.errorMessage) {
                this.errorMessage.textContent = message;
            }
        }
        if (this.recipeContent) {
            this.recipeContent.classList.add('hidden');
        }
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.add('hidden');
        }
    }

    showToast(message, type = 'info') {
        console.log(`Toast (${type}): ${message}`);
        // Toast implementation would go here
    }
}

// Initialize the recipe detail manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    new RecipeDetailManager();
});
