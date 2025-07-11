// Enhanced Recipe Detail JavaScript
class RecipeDetailManager {
    // Render ingredients list in the UI
    renderIngredients(ingredients) {
        if (!this.ingredientsList) return;
        this.ingredientsList.innerHTML = '';
        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            this.ingredientsList.innerHTML = '<li class="ingredient-item">No ingredients available.</li>';
            return;
        }
        ingredients.forEach(ing => {
            let name = ing.ingredient_name || ing.name || ing;
            let qty = ing.quantity || '';
            let unit = ing.unit || '';
            let prep = ing.preparation || '';
            this.ingredientsList.innerHTML += `
                <li class="ingredient-item">
                    <span class="ingredient-name">${name}</span>
                    <span class="ingredient-quantity">${qty} ${unit}</span>
                    ${prep ? `<span class="ingredient-preparation">${prep}</span>` : ''}
                </li>
            `;
        });
    }

    // Render instructions in the UI
    renderInstructions(instructions) {
        if (!this.instructionsList) return;
        this.instructionsList.innerHTML = '';
        if (!instructions || (Array.isArray(instructions) && instructions.length === 0) || (typeof instructions === 'string' && !instructions.trim())) {
            this.instructionsList.innerHTML = '<li class="instruction-item">No instructions available.</li>';
            return;
        }
        let steps = Array.isArray(instructions) ? instructions : instructions.split(/\n|\r|\d+\./).filter(s => s.trim());
        steps.forEach((step, idx) => {
            this.instructionsList.innerHTML += `
                <li class="instruction-item"><span class="instruction-text">${step.trim()}</span></li>
            `;
        });
    }

    // Render analytics (placeholder)
    renderAnalytics(recipe) {
        if (!this.recipeStats) return;
        // Example: show servings, time, calories if available
        const stats = [];
        if (recipe.servings) stats.push(`<span><i class='fas fa-users'></i> ${recipe.servings} servings</span>`);
        if (recipe.time || recipe.cooking_time) stats.push(`<span><i class='fas fa-clock'></i> ${recipe.time || recipe.cooking_time} min</span>`);
        if (recipe.calories) stats.push(`<span><i class='fas fa-fire'></i> ${recipe.calories} kcal</span>`);
        this.recipeStats.innerHTML = stats.join(' ');
    }
    constructor() {
        console.log('RecipeDetailManager: Constructor started');
        this.debugInfo = {
            initSteps: [],
            errors: []
        };
        
        this.logStep('Constructor started');
        
        this.currentRecipe = null;
        this.recipeId = null;
        this.isOwner = false;
        
        // Initialize ingredient parser if available
        try {
            if (typeof IngredientParser === 'undefined') {
                throw new Error('IngredientParser class is not defined. Make sure ingredient-parser.js is loaded.');
            }
            this.ingredientParser = new IngredientParser();
            this.logStep('Ingredient parser initialized');
        } catch (error) {
            this.logError('IngredientParser initialization failed', error);
            this.ingredientParser = {
                // Basic fallback for ingredient parser
                parseIngredients: ingredients => {
                    console.warn('Using fallback ingredient parser');
                    return Array.isArray(ingredients) ? ingredients : [ingredients];
                }
            };
        }
        
        // Check if utils.js is loaded, use fallback if not
        try {
            if (typeof RecipeAPI === 'undefined') {
                throw new Error('RecipeAPI class is not defined. Make sure utils.js is loaded.');
            }
            
            // Use production URL only
            this.baseUrl = 'https://njoya.pythonanywhere.com';
            this.recipeAPI = new RecipeAPI(this.baseUrl);
            this.useAPI = true;
            
            this.logStep(`RecipeAPI initialized with base URL: ${this.baseUrl}`);
        } catch (error) {
            this.logError('RecipeAPI initialization failed', error);
            this.useAPI = false;
            this.baseUrl = 'https://njoya.pythonanywhere.com';
        }
        
        try {
            this.logStep('Initializing elements');
            this.initializeElements();
            this.logStep('Elements initialized, loading recipe');
            this.loadRecipe();
        } catch (error) {
            this.logError('Critical initialization error', error);
            this
        }
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
    
    // Show loading spinner
    showLoading() {
        console.log('Showing loading spinner');
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = 'flex';
        }
        if (this.globalOverlay) {
            this.globalOverlay.style.display = 'flex';
        }
        if (this.recipeContent) {
            this.recipeContent.style.display = 'none';
        }
        if (this.errorState) {
            this.errorState.style.display = 'none';
        }
    }
    
    // Hide loading spinner
    hideLoading() {
        console.log('Hiding loading spinner');
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = 'none';
        }
        if (this.globalOverlay) {
            this.globalOverlay.style.display = 'none';
        }
    }

    // Show error state
    showError(message) {
        console.error('Error:', message);
        if (this.errorState) {
            this.errorState.style.display = 'flex';
        }
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
        }
        if (this.recipeContent) {
            this.recipeContent.style.display = 'none';
        }
        this.hideLoading();
    }

    // Defensive image URL utility with improved path handling
    getImageUrl(image) {
        if (!image) return 'assets/default-recipe.jpg';
        if (typeof image === 'string') {
            // Full URL - use as is
            if (image.startsWith('http')) return image;
            
            // Path starting with slash - append to base URL
            if (image.startsWith('/')) return this.baseUrl + image;
            
            // Check for local paths like 'images/file.jpg' - use directly
            if (image.startsWith('images/') || image.startsWith('assets/')) {
                return image; // These are relative to the HTML file
            }
            
            // If just a filename, assume media path
            return this.baseUrl + '/media/' + image;
        }
        return 'assets/default-recipe.jpg';
    }

    // Helper methods for logging and debugging
    logStep(step) {
        console.log(`📝 RecipeDetailManager: ${step}`);
        this.debugInfo.initSteps.push({
            step: step,
            timestamp: new Date().toISOString()
        });
    }
    
    logError(context, error) {
        console.error(`❌ RecipeDetailManager Error (${context}):`, error);
        this.debugInfo.errors.push({
            context: context,
            message: error.message || String(error),
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
    
    showFatalError(error) {
        console.error('Fatal error in RecipeDetailManager:', error);
        
        // Create error container
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fatal-error';
        errorDiv.style.margin = '50px auto';
        errorDiv.style.padding = '30px';
        errorDiv.style.maxWidth = '800px';
        errorDiv.style.backgroundColor = '#ffebee';
        errorDiv.style.border = '2px solid #f44336';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        
        // Add error info
        errorDiv.innerHTML = `
            <h2 style="color:#d32f2f;margin-bottom:20px">Recipe Loading Error</h2>
            <p style="font-size:16px;line-height:1.6;margin-bottom:15px">
                We encountered a problem loading this recipe. Our team has been notified.
            </p>
            <div style="background:#f5f5f5;padding:15px;border-radius:4px;margin:20px 0;">
                <p><strong>Error:</strong> ${error.message || 'Unknown error'}</p>
            </div>
            <details style="margin:15px 0;">
                <summary style="cursor:pointer;color:#1976d2;padding:8px 0;">Technical Details</summary>
                <pre style="background:#f8f8f8;padding:15px;margin-top:10px;overflow:auto;max-height:200px;font-size:13px;">${JSON.stringify(this.debugInfo, null, 2)}</pre>
            </details>
            <div style="margin-top:25px;">
                <button onclick="location.reload()" style="padding:10px 24px;background:#2196F3;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:10px;font-size:14px;">Reload Page</button>
                <button onclick="window.location.href='Recipes.html'" style="padding:10px 24px;background:#757575;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;">Back to Recipes</button>
            </div>
        `;
        
        // Add to page
        const container = document.getElementById('recipeDetailContainer') || document.body;
        
        // Hide other elements
        if (this.loadingSpinner) this.loadingSpinner.style.display = 'none';
        if (this.recipeContent) this.recipeContent.style.display = 'none';
        if (this.errorState) this.errorState.style.display = 'none';
        
        container.prepend(errorDiv);
    }
    
    async loadRecipe() {
        if (!this.recipeId) {
            console.log('No recipe ID provided, showing default recipe');
            this.recipeId = '1';
            this.showToast('No recipe ID provided - showing featured recipe', 'info');
        }

        this.showLoading();
        console.log('🔍 Loading recipe with ID:', this.recipeId);

        // --- Timeout fallback: always hide loader after 8 seconds ---
        let timeoutTriggered = false;
        const timeoutId = setTimeout(() => {
            timeoutTriggered = true;
            this.hideLoading();
            this.showError('Failed to load recipe: Request timed out. Please try again later.');
            console.error('❌ Recipe loading timed out.');
        }, 8000);

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
            clearTimeout(timeoutId);
            
            console.log('🎉 Recipe loaded successfully!');
            
        } catch (error) {
            if (!timeoutTriggered) {
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
                        clearTimeout(timeoutId);
                        return;
                    }
                } catch (mockError) {
                    console.error('❌ Mock data fallback failed:', mockError);
                }
                
                this.hideLoading();
                this.showError(`Failed to load recipe: ${error.message}`);
                clearTimeout(timeoutId);
            }
        }
    }

    // Enhanced recipe ingredient processing
    async enhanceRecipeIngredients(recipe) {
        console.log('🔧 Enhancing recipe ingredients:', recipe.title);
        console.log('📋 Raw recipe data fields:', Object.keys(recipe));
        
        // First, try to find ingredients in the most likely fields
        const ingredientFields = [
            'ingredients',           // Most common
            'recipe_ingredients',    // Django relationship field
            'ingredient_list',       // Alternative naming
            'ingredients_data',      // Structured data field
            'components',           // Alternative naming
            'ingredient_set',       // Django reverse relation
        ];

        let foundIngredients = null;
        let foundField = null;

        for (const field of ingredientFields) {
            if (recipe[field] && (Array.isArray(recipe[field]) || typeof recipe[field] === 'object')) {
                foundIngredients = recipe[field];
                foundField = field;
                console.log(`✅ Found ingredients in field '${field}':`, foundIngredients);
                break;
            }
        }

        // If we found ingredients, process them with the advanced parser
        if (foundIngredients) {
            const parsedIngredients = this.ingredientParser.parseIngredients(
                foundIngredients, 
                recipe.title || recipe.name
            );
            
            if (parsedIngredients && parsedIngredients.length > 0) {
                console.log(`✅ Successfully parsed ${parsedIngredients.length} ingredients from ${foundField}`);
                recipe.ingredients = parsedIngredients;
                return recipe;
            }
        }

        // Try to get ingredients from separate API endpoints
        const ingredientEndpoints = [
            `/api/recipes/${recipe.id}/ingredients/`,
            `/api/recipe-ingredients/?recipe=${recipe.id}`,
            `/api/ingredients/recipe/${recipe.id}/`,
            `/api/recipes/${recipe.id}/components/`
        ];

        for (const endpoint of ingredientEndpoints) {
            try {
                console.log(`🔍 Trying ingredient endpoint: ${endpoint}`);
                const ingredientsResponse = await fetch(`${this.baseUrl}${endpoint}`, {
                    headers: this.getHeaders()
                });
                
                if (ingredientsResponse.ok) {
                    const apiIngredients = await ingredientsResponse.json();
                    console.log('🍯 Fetched ingredients from separate endpoint:', apiIngredients);
                    
                    const parsedIngredients = this.ingredientParser.parseIngredients(
                        apiIngredients, 
                        recipe.title
                    );
                    
                    if (parsedIngredients && parsedIngredients.length > 0) {
                        recipe.ingredients = parsedIngredients;
                        return recipe;
                    }
                }
            } catch (error) {
                console.log(`ℹ️ Endpoint ${endpoint} not available:`, error.message);
            }
        }

        // Try to parse ingredients from text fields using the advanced parser
        const textFields = ['description', 'instructions', 'method', 'summary', 'notes'];
        for (const field of textFields) {
            if (recipe[field]) {
                const extractedIngredients = this.ingredientParser.extractIngredientsFromText(recipe[field]);
                if (extractedIngredients.length > 0) {
                    console.log(`🔍 Extracted ${extractedIngredients.length} ingredients from ${field}`);
                    recipe.ingredients = extractedIngredients;
                    return recipe;
                }
            }
        }

        // Use the parser's fallback system
        console.log('⚠️ Using advanced parser fallback');
        recipe.ingredients = this.ingredientParser.createFallbackIngredients(recipe.title || recipe.name);
        
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

    // Enhanced method to extract instructions from recipe data
    extractInstructions(recipe) {
        console.log('🔍 Extracting instructions from recipe:', Object.keys(recipe));
        
        // Priority order for instruction fields
        const instructionFields = [
            'instructions',
            'method',
            'cooking_instructions',
            'preparation_method',
            'steps',
            'cooking_method',
            'directions',
            'procedure'
        ];
        
        for (const field of instructionFields) {
            if (recipe[field]) {
                console.log(`📝 Found instructions in field: ${field}`);
                console.log(`📄 Content preview: ${recipe[field].toString().substring(0, 150)}...`);
                
                // Check if this field contains actual instructions vs description
                const content = recipe[field];
                
                if (typeof content === 'string' && content.trim()) {
                    // If content looks like proper instructions, use it
                    if (this.looksLikeInstructions(content)) {
                        console.log(`✅ Using ${field} as instructions (looks like proper instructions)`);
                        return content;
                    }
                } else if (Array.isArray(content) && content.length > 0) {
                    console.log(`✅ Using ${field} as instructions (array format)`);
                    return content;
                }
            }
        }
        
        // If no proper instructions found, check if description contains cooking steps
        if (recipe.description && this.looksLikeInstructions(recipe.description)) {
            console.log('⚠️ Using description as instructions (contains cooking steps)');
            return recipe.description;
        }
        
        console.log('❌ No proper instructions found in recipe data');
        return '';
    }
    
    // Helper to determine if text looks like cooking instructions
    looksLikeInstructions(text) {
        if (!text || typeof text !== 'string') return false;
        
        const instructionIndicators = [
            // Has numbered steps
            /\d+\./g.test(text),
            
            // Has step words
            /step \d+|first|second|third|then|next|finally|meanwhile|afterwards/i.test(text),
            
            // Has cooking action verbs
            /heat|add|mix|stir|cook|bake|fry|boil|simmer|saute|chop|dice|slice|season|serve/i.test(text),
            
            // Has imperative cooking language
            /heat.*oil|add.*ingredients|cook.*until|stir.*together|season.*with/i.test(text),
            
            // Multiple sentences suggesting steps
            text.split(/[.!?]/).filter(s => s.trim()).length > 2,
            
            // Contains time indicators
            /\d+\s*(minutes?|mins?|hours?|hrs?)/i.test(text),
            
            // Contains temperature or cooking terms
            /degrees?|°|medium heat|low heat|high heat|until golden|until tender/i.test(text)
        ];
        
        const score = instructionIndicators.filter(Boolean).length;
        console.log(`📊 Instruction likelihood score: ${score}/7 for text: "${text.substring(0, 100)}..."`);
        
        return score >= 3; // Must meet at least 3 criteria to be considered instructions
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

    // Helper function to detect if content looks more like a description than instructions
    isDescriptionLikeContent(text) {
        const descriptionIndicators = [
            // No step indicators
            !text.match(/\d+\./),
            !text.match(/step \d+/i),
            !text.match(/first|second|third|then|next|finally/i),
            
            // Contains descriptive language
            text.match(/delicious|tasty|perfect|wonderful|amazing/i),
            text.match(/this recipe|this dish|recipe for/i),
            
            // Very short (likely just a description)
            text.length < 100,
            
            // No action verbs typical in cooking instructions
            !text.match(/add|mix|cook|heat|stir|bake|fry|boil|simmer/i)
        ];
        
        // If 3 or more indicators suggest it's a description, treat it as such
        const descriptionScore = descriptionIndicators.filter(Boolean).length;
        return descriptionScore >= 3;
    }
    
    // Helper function to convert description-like content to basic instructions
    convertDescriptionToInstructions(description) {
        console.log('🔄 Converting description to instructions:', description.substring(0, 100) + '...');
        
        // Try to extract any cooking actions from the description
        const cookingActions = [
            'prepare ingredients',
            'heat oil or pan',
            'add ingredients as described',
            'cook according to description',
            'season to taste',
            'serve as desired'
        ];
        
        // If description has some cooking terms, try to create basic steps
        if (description.match(/cook|heat|add|mix|stir|bake|fry|boil/i)) {
            return [
                'Prepare all ingredients as listed',
                'Follow the cooking method described: ' + description.trim(),
                'Adjust seasoning to taste',
                'Serve and enjoy'
            ];
        }
        
        // For very generic descriptions, provide a basic template
        return [
            'Prepare all ingredients as listed in the ingredients section',
            'Cook according to the recipe description: ' + description.trim(),
            'Season and adjust flavors as needed',
            'Serve hot and enjoy your meal'
        ];
    }

    renderRecipe(recipe) {
        // Defensive: check for error object or invalid recipe
        if (!recipe || recipe.detail) {
            console.error('Recipe not found or invalid recipe object:', recipe?.detail || recipe);
            if (this.errorState) {
                this.errorState.classList.remove('hidden');
                this.recipeContent.classList.add('hidden');
                if (this.errorMessage) {
                    this.errorMessage.textContent = recipe?.detail || 'Recipe not found.';
                }
            }
            return;
        }
        
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
        // Defensive check for renderIngredients
        if (typeof this.renderIngredients === 'function') {
            this.renderIngredients(recipe.ingredients || []);
        } else {
            console.error('renderIngredients method not available');
        }
        // Defensive check for renderInstructions
        const instructionsData = this.extractInstructions(recipe);
        if (typeof this.renderInstructions === 'function') {
            this.renderInstructions(instructionsData);
        } else {
            console.error('renderInstructions method not available');
        }
        
        // Render analytics buttons and stats
        // Defensive check for renderAnalytics
        if (typeof this.renderAnalytics === 'function') {
            this.renderAnalytics(recipe);
        } else {
            console.error('renderAnalytics method not available');
        }
        // Defensive check for updateSocialUI
        if (typeof this.updateSocialUI === 'function') {
            this.updateSocialUI(recipe);
        } else {
            console.error('updateSocialUI method not available');
        }
        
        // Update contributor information if available
        if (recipe.created_by) {
            console.log('✅ Updating contributor information:', recipe.created_by);
            
            if (this.contributorSection) {
                this.contributorSection.classList.remove('hidden');
            }
            
            if (this.contributorAvatar && recipe.created_by.profile_image) {
                this.contributorAvatar.src = this.getImageUrl(recipe.created_by.profile_image);
                this.contributorAvatar.alt = recipe.created_by.username || 'Contributor';
            }
            
            if (this.contributorName) {
                // Use full name if available, otherwise username
                let displayName = recipe.created_by.username || 'Anonymous Chef';
                if (recipe.created_by.first_name && recipe.created_by.last_name) {
                    displayName = `${recipe.created_by.first_name} ${recipe.created_by.last_name}`;
                }
                this.contributorName.textContent = displayName;
            }
            
            if (this.contributorBio) {
                this.contributorBio.textContent = recipe.created_by.bio || 'Recipe contributor';
            }
        }
        
        // Show content
        if (this.recipeContent) {
            this.recipeContent.classList.remove('hidden');
            this.recipeContent.style.display = 'block'; // Ensure content is visible
        }
        
        console.log('✅ Recipe rendered successfully');
    }

    // Update social features UI based on recipe data
    updateSocialUI(recipe) {
        if (!recipe) return;
        
        // Update like button state
        const likeBtn = document.getElementById('likeBtn');
        if (likeBtn) {
            const likeCount = likeBtn.querySelector('#likeCount');
            if (likeCount) {
                likeCount.textContent = recipe.likes_count || 0;
            }
            
            // Check if user has liked this recipe
            if (recipe.is_liked) {
                likeBtn.classList.add('liked');
                const icon = likeBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-thumbs-up';
                }
            }
            
            // Add event listener
            likeBtn.addEventListener('click', () => {
                this.toggleLikeRecipe();
            });
        }
        
        // Update comment button
        const commentBtn = document.getElementById('commentBtn');
        if (commentBtn) {
            const commentCount = commentBtn.querySelector('#commentCount');
            if (commentCount) {
                commentCount.textContent = recipe.comments_count || 0;
            }
            
            // Add event listener to scroll to comments section
            commentBtn.addEventListener('click', () => {
                const socialSection = document.getElementById('socialFeaturesSection');
                if (socialSection) {
                    socialSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
        
        // Update save button
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            const saveCount = saveBtn.querySelector('#saveCount');
            if (saveCount) {
                saveCount.textContent = recipe.saves_count || 0;
            }
            
            // Check if user has saved this recipe
            if (recipe.is_saved) {
                saveBtn.classList.add('saved');
                const icon = saveBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-heart';
                }
            }
            
            // Add event listener
            saveBtn.addEventListener('click', () => {
                this.toggleSaveRecipe();
            });
        }
    }

    // Toggle like status for the current recipe
    async toggleLikeRecipe() {
        if (!this.isAuthenticated()) {
            this.showLoginPrompt('Please log in to like recipes');
            return;
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/api/recipes/${this.recipeId}/like/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error toggling like: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Update UI
            const likeBtn = document.getElementById('likeBtn');
            const likeCount = document.getElementById('likeCount');
            
            if (likeBtn && likeCount) {
                likeCount.textContent = data.likes_count;
                
                const icon = likeBtn.querySelector('i');
                if (data.is_liked) {
                    likeBtn.classList.add('liked');
                    if (icon) icon.className = 'fas fa-thumbs-up';
                } else {
                    likeBtn.classList.remove('liked');
                    if (icon) icon.className = 'far fa-thumbs-up';
                }
            }
            
        } catch (error) {
            console.error('Failed to toggle like:', error);
            this.showToast('Failed to update like status', 'error');
        }
    }

    // Toggle save status for the current recipe
    async toggleSaveRecipe() {
        if (!this.isAuthenticated()) {
            this.showLoginPrompt('Please log in to save recipes');
            return;
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/api/recipes/${this.recipeId}/save/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error toggling save: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Update UI
            const saveBtn = document.getElementById('saveBtn');
            const saveCount = document.getElementById('saveCount');
            
            if (saveBtn && saveCount) {
                saveCount.textContent = data.saves_count;
                
                const icon = saveBtn.querySelector('i');
                if (data.is_saved) {
                    saveBtn.classList.add('saved');
                    if (icon) icon.className = 'fas fa-heart';
                    this.showToast('Recipe saved to your collection', 'success');
                } else {
                    saveBtn.classList.remove('saved');
                    if (icon) icon.className = 'far fa-heart';
                    this.showToast('Recipe removed from your collection', 'info');
                }
            }
            
        } catch (error) {
            console.error('Failed to toggle save:', error);
            this.showToast('Failed to update saved status', 'error');
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    }

    // Show login prompt
    showLoginPrompt(message) {
        this.showToast(message, 'warning');
        setTimeout(() => {
            window.location.href = `Login.html?redirect=${encodeURIComponent(window.location.href)}`;
        }, 2000);
    }
}
