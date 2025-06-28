// Recipe Detail Page Manager
class RecipeDetailManager {
    constructor() {
        console.log('🚀 Initializing RecipeDetailManager...');
        
        // Initialize RecipeAPI if available
        if (typeof RecipeAPI !== 'undefined') {
            this.recipeAPI = new RecipeAPI();
            this.useAPI = true;
            console.log('RecipeAPI initialized with base URL:', this.recipeAPI.baseUrl);
        } else {
            console.warn('RecipeAPI not found. Using mock data for demonstration.');
            this.useAPI = false;
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
            if (!this.useAPI) {
                throw new Error('RecipeAPI not available - using mock data');
            }

            // Fetch recipe directly from API
            console.log('📡 Fetching from API:', `${this.recipeAPI.baseUrl}/api/recipes/${this.recipeId}/`);
            const recipe = await this.recipeAPI.getRecipe(this.recipeId);
            
            console.log('✅ Recipe data received from API:', recipe);
            
            if (!recipe) {
                throw new Error('No recipe data received from API');
            }

            if (!recipe.id && !recipe.title && !recipe.name) {
                throw new Error('Invalid recipe data structure');
            }

            // Success - render the recipe
            this.currentRecipe = recipe;
            this.isOwner = false; // For now, assume not owner
            this.renderRecipe(recipe);
            this.hideLoading();
            
            console.log('🎉 Recipe loaded successfully from API!');
            
        } catch (error) {
            console.error('❌ API Error loading recipe:', error);
            
            // Try fallback to mock data before showing error
            console.log('🔄 Trying fallback to mock data...');
            try {
                const mockRecipe = this.getMockRecipe(this.recipeId);
                if (mockRecipe) {
                    console.log('✅ Using mock data as fallback:', mockRecipe);
                    this.currentRecipe = mockRecipe;
                    this.isOwner = false; // Mock data is never owned
                    this.renderRecipe(mockRecipe);
                    this.hideLoading();
                    this.showToast('Using demo recipe data (API connection failed)', 'warning');
                    return;
                } else {
                    throw new Error(`No mock recipe found for ID ${this.recipeId}`);
                }
            } catch (mockError) {
                console.error('❌ Mock data fallback also failed:', mockError);
            }
            
            this.hideLoading();
            
            // Show appropriate error message
            if (error.message.includes('HTTP error! status: 404')) {
                this.showError(`Recipe with ID ${this.recipeId} not found in the database.`);
            } else if (error.message.includes('Failed to fetch')) {
                this.showError('Cannot connect to the backend server. Please check if it\'s running.');
            } else {
                this.showError(`Failed to load recipe: ${error.message}`);
            }
        }
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
                    { ingredient_name: "Vegetable oil", quantity: "2", unit: "tbsp" }
                ],
                instructions: "1. Heat oil in a large pan over medium heat.\\n2. Add chopped onions and cook until golden.\\n3. Add minced garlic and ginger, cook for 1 minute.\\n4. Add curry powder and turmeric, stir for 30 seconds.\\n5. Add chicken pieces and brown on all sides.\\n6. Pour in coconut milk and bring to a simmer.\\n7. Season with salt and cook for 20-25 minutes until chicken is tender.\\n8. Serve hot with rice or naan bread.",
                contributor: {
                    username: "ChefMaster",
                    name: "Chef Master",
                    bio: "Professional chef with 10+ years experience"
                }
            },
            2: {
                id: 2,
                title: "Ndole",
                description: "Traditional Cameroonian dish with groundnut paste and bitter leaves.",
                image: "images/Ndole & Miondo.jpg",
                prep_time: 45,
                cooking_time: 60,
                servings: 6,
                calories: 420,
                difficulty: "Hard",
                meal_type: "Lunch",
                ingredients: [
                    { ingredient_name: "Bitter leaves", quantity: "2", unit: "cups" },
                    { ingredient_name: "Groundnut paste", quantity: "1", unit: "cup" },
                    { ingredient_name: "Dried fish", quantity: "3", unit: "pieces" },
                    { ingredient_name: "Beef", quantity: "500", unit: "g" },
                    { ingredient_name: "Crayfish", quantity: "3", unit: "tbsp" }
                ],
                instructions: "Traditional Cameroonian cooking method...",
                contributor: {
                    username: "CameroonChef",
                    name: "Traditional Chef",
                    bio: "Specialist in Cameroonian cuisine"
                }
            }
        };
        
        return mockRecipes[id] || mockRecipes[1]; // Default to recipe 1 if not found
    }

    renderRecipe(recipe) {
        console.log('🎨 Rendering recipe:', recipe.title || recipe.name);
        
        // Hide debug panel by default
        const debugPanel = document.getElementById('debugPanel');
        if (debugPanel) {
            debugPanel.style.display = 'none';
        }
        
        // Set hero image and title
        const imageUrl = this.getImageUrl(recipe.image);
        if (imageUrl && this.heroImage) {
            this.heroImage.src = imageUrl;
            this.heroImage.alt = recipe.title || recipe.name || 'Recipe Image';
        }
        
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
        
        // Render ingredients - This is the key part!
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
            // Split by newlines and numbers
            steps = instructions.split(/\\n|\n/).filter(step => step.trim());
        } else if (Array.isArray(instructions)) {
            steps = instructions;
        }

        if (steps.length === 0) {
            this.instructionsList.innerHTML = '<li class="instruction-item"><span class="instruction-text">No instructions provided</span></li>';
            return;
        }

        const instructionItems = steps.map((step, index) => {
            const cleanStep = step.trim().replace(/^\\d+\.\s*/, ''); // Remove leading numbers
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
        if (!imagePath) return null;
        
        // If it's already a full URL, return as-is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // If it starts with a slash, it's a root path
        if (imagePath.startsWith('/')) {
            return imagePath;
        }
        
        // Otherwise, treat as relative path
        return imagePath;
    }

    showLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = 'flex';
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
            this.loadingSpinner.style.display = 'none';
        }
    }

    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
        }
        if (this.errorState) {
            this.errorState.classList.remove('hidden');
        }
        if (this.recipeContent) {
            this.recipeContent.classList.add('hidden');
        }
    }

    showToast(message, type = 'info') {
        console.log(`Toast (${type}): ${message}`);
        // Simple console log for now - you can enhance with actual toast UI
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing RecipeDetailManager...');
    window.recipeDetailManager = new RecipeDetailManager();
});
