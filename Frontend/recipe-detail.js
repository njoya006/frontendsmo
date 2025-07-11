// Enhanced Recipe Detail JavaScript
class RecipeDetailManager {
    // Render ingredients list in the UI
    // ...existing code...
    // Reload ratings and reviews from API and update UI
    async reloadRatingsAndReviews() {
        if (!this.recipeId) return;
        try {
            // Use enhanced API if available
            let ratingsData, reviewsData;
            if (window.enhancedRecipeAPI) {
                ratingsData = await window.enhancedRecipeAPI.getRatings(this.recipeId);
                reviewsData = await window.enhancedRecipeAPI.getReviews(this.recipeId);
            } else if (this.useAPI) {
                ratingsData = await this.recipeAPI.getRatings(this.recipeId);
                reviewsData = await this.recipeAPI.getReviews(this.recipeId);
            } else {
                // Fallback: skip update
                return;
            }
            // Update rating bar
            if (document.getElementById('ratingBar')) {
                document.getElementById('ratingBar').value = ratingsData.average || 0;
            }
            // Update review count
            if (document.getElementById('reviewCount')) {
                document.getElementById('reviewCount').textContent = reviewsData.count || reviewsData.length || 0;
            }
            // Update comment count
            if (document.getElementById('commentCount')) {
                document.getElementById('commentCount').textContent = reviewsData.length || 0;
            }
            // Update review text (show latest review)
            if (document.getElementById('latestReviewText')) {
                const latest = Array.isArray(reviewsData) ? reviewsData[0] : (reviewsData.results ? reviewsData.results[0] : null);
                document.getElementById('latestReviewText').textContent = latest ? latest.text || latest.comment || '' : 'No reviews yet.';
            }
        } catch (error) {
            console.error('Failed to reload ratings/reviews:', error);
        }
    }
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
    // Reload ratings and reviews from API and update UI
    async reloadRatingsAndReviews() {
        if (!this.recipeId) return;
        try {
            // Use enhanced API if available
            let ratingsData, reviewsData;
            if (window.enhancedRecipeAPI) {
                ratingsData = await window.enhancedRecipeAPI.getRatings(this.recipeId);
                reviewsData = await window.enhancedRecipeAPI.getReviews(this.recipeId);
            } else if (this.useAPI) {
                ratingsData = await this.recipeAPI.getRatings(this.recipeId);
                reviewsData = await this.recipeAPI.getReviews(this.recipeId);
            } else {
                // Fallback: skip update
                return;
            }
            // Update rating bar
            if (document.getElementById('ratingBar')) {
                document.getElementById('ratingBar').value = ratingsData.average || 0;
            }
            // Update review count
            if (document.getElementById('reviewCount')) {
                document.getElementById('reviewCount').textContent = reviewsData.count || reviewsData.length || 0;
            }
            // Update comment count
            if (document.getElementById('commentCount')) {
                document.getElementById('commentCount').textContent = reviewsData.length || 0;
            }
            // Update review text (show latest review)
            if (document.getElementById('latestReviewText')) {
                const latest = Array.isArray(reviewsData) ? reviewsData[0] : (reviewsData.results ? reviewsData.results[0] : null);
                document.getElementById('latestReviewText').textContent = latest ? latest.text || latest.comment || '' : 'No reviews yet.';
            }
        } catch (error) {
            console.error('Failed to reload ratings/reviews:', error);
        }
    }

    // Submission handler: use returned data or reload ratings/reviews after successful submit
    async handleReviewSubmission(submitFn, ...args) {
        try {
            const result = await submitFn(...args);
            
            // If the submission returned updated data, use it directly
            if (result && result.success && (result.updatedReviews || result.updatedRatings)) {
                console.log('✅ Using returned updated data from API submission');
                
                // Update UI with returned data instead of making new API calls
                if (result.updatedRatings) {
                    this.updateRatingsUI(result.updatedRatings);
                }
                
                if (result.updatedReviews) {
                    this.updateReviewsUI(result.updatedReviews);
                }
                
                this.showToast('Review submitted and UI updated!', 'success');
            } else {
                // Fallback: reload from API if no updated data was returned
                console.log('⚡ Reloading data from API (no updated data returned)');
                await this.reloadRatingsAndReviews();
                this.showToast('Review submitted and UI updated!', 'success');
            }
        } catch (error) {
            this.showToast('Failed to submit review: ' + error.message, 'error');
        }
    }
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
            this.showFatalError(error);
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
        this.contributorProfileLink = document.getElementById('contributorProfileLink');
        
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

    // --- Submission handler: reload ratings/reviews after successful submit ---
    async handleReviewSubmission(submitFn, ...args) {
        try {
            await submitFn(...args);
            await this.reloadRatingsAndReviews();
            this.showToast('Review submitted and UI updated!', 'success');
        } catch (error) {
            this.showToast('Failed to submit review: ' + error.message, 'error');
        }
    }
    // Defensive image URL utility with improved path handling
    getImageUrl(image) {
        if (!image) return 'assets/default-recipe.jpg';
        
        console.log('🔍 Processing image URL:', image);
        
        if (typeof image === 'string') {
            // Full URL - use as is
            if (image.startsWith('http')) {
                console.log('✅ Using full URL:', image);
                return image;
            }

            // If image is a local static asset, use directly
            if (image.startsWith('/images/') || image.startsWith('/assets/')) {
                const localPath = image.substring(1); // Remove leading slash
                console.log('✅ Using local path (removing leading slash):', localPath);
                return localPath;
            }
            
            if (image.startsWith('images/') || image.startsWith('assets/')) {
                console.log('✅ Using local path directly:', image);
                return image;
            }

            // Path starting with slash (not static asset) - append to base URL
            if (image.startsWith('/')) {
                const apiPath = this.baseUrl + image;
                console.log('✅ Using API path:', apiPath);
                return apiPath;
            }

            // Check if it might be a server-relative path without leading slash
            if (image.includes('/') && !image.startsWith('images/') && !image.startsWith('assets/')) {
                // Could be a server path without leading slash - try both
                const apiPath = this.baseUrl + '/' + image;
                console.log('✅ Using likely API path with added slash:', apiPath);
                return apiPath;
            }

            // If just a filename, check if it's in our images directory first
            if (!image.includes('/')) {
                console.log('✅ Treating as local image file in images directory:', 'images/' + image);
                return 'images/' + image;
            }
            
            // Default to media path
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

    // Rating submission handler: use returned data or reload if needed
    async handleRatingSubmission(rating) {
        try {
            let result;
            if (window.enhancedRecipeAPI) {
                result = await window.enhancedRecipeAPI.submitRating(this.recipeId, rating);
            } else if (this.useAPI) {
                result = await this.recipeAPI.submitRating(this.recipeId, rating);
            }
            
            // If the submission returned updated data, use it directly
            if (result && result.success && result.updatedRatings) {
                console.log('✅ Using returned updated ratings from API submission');
                this.updateRatingsUI(result.updatedRatings);
                this.showToast('Rating submitted successfully!', 'success');
            } else {
                // Fallback: reload from API if no updated data was returned
                console.log('⚡ Reloading ratings from API (no updated data returned)');
                await this.reloadRatingsAndReviews();
                this.showToast('Rating submitted successfully!', 'success');
            }
        } catch (error) {
            this.showToast('Failed to submit rating: ' + error.message, 'error');
        }
    }

    // Helper methods to update UI components directly
    updateRatingsUI(ratingsData) {
        console.log('🎯 Updating ratings UI with:', ratingsData);
        
        // Update rating bar
        if (document.getElementById('ratingBar')) {
            document.getElementById('ratingBar').value = ratingsData.average_rating || 0;
        }
        
        // Update rating display text
        const ratingDisplay = document.querySelector('.rating-display, .average-rating');
        if (ratingDisplay && ratingsData.average_rating) {
            ratingDisplay.textContent = `${ratingsData.average_rating.toFixed(1)}/5`;
        }
        
        // Update rating count
        const ratingCount = document.querySelector('.rating-count, .total-ratings');
        if (ratingCount && ratingsData.total_ratings !== undefined) {
            ratingCount.textContent = `${ratingsData.total_ratings} ratings`;
        }
        
        // Update star distribution if available
        if (ratingsData.distribution && document.querySelector('.rating-distribution')) {
            this.updateStarDistribution(ratingsData.distribution, ratingsData.total_ratings);
        }
    }
    
    updateReviewsUI(reviewsData) {
        console.log('💬 Updating reviews UI with:', reviewsData);
        
        // Update review count
        const reviewCount = document.querySelector('.review-count, .total-reviews');
        if (reviewCount && reviewsData.count !== undefined) {
            reviewCount.textContent = `${reviewsData.count} reviews`;
        }
        
        // Update reviews list if container exists
        const reviewsContainer = document.querySelector('.reviews-list, .review-container');
        if (reviewsContainer && reviewsData.results) {
            this.renderReviewsList(reviewsData.results, reviewsContainer);
        }
    }
    
    updateStarDistribution(distribution, totalRatings) {
        for (let star = 1; star <= 5; star++) {
            const barElement = document.querySelector(`.star-${star}-bar, .rating-bar-${star}`);
            if (barElement && distribution[star] !== undefined) {
                const percentage = totalRatings > 0 ? (distribution[star] / totalRatings) * 100 : 0;
                barElement.style.width = `${percentage}%`;
                
                const countElement = document.querySelector(`.star-${star}-count`);
                if (countElement) {
                    countElement.textContent = distribution[star];
                }
            }
        }
    }
    
    renderReviewsList(reviews, container) {
        if (!reviews || reviews.length === 0) {
            container.innerHTML = '<p>No reviews yet.</p>';
            return;
        }
        
        const reviewsHTML = reviews.map(review => `
            <div class="review-item" data-review-id="${review.id}">
                <div class="review-header">
                    <span class="reviewer-name">${review.user?.username || 'Anonymous'}</span>
                    <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                    <span class="review-date">${new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                <div class="review-content">${review.review}</div>
                ${review.pending ? '<div class="review-status">⏳ Pending sync</div>' : ''}
            </div>
        `).join('');
        
        container.innerHTML = reviewsHTML;
    }

    // ...existing code...
}

// Global instance for recipe detail manager
window.recipeDetailManager = new RecipeDetailManager();

// Example: Attach to review/rating form submission
document.addEventListener('DOMContentLoaded', function() {
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Get review text and rating value
            const reviewText = document.getElementById('reviewInput')?.value || '';
            const ratingValue = parseInt(document.getElementById('ratingInput')?.value) || 0;
            
            // Submit using enhanced API if available
            if (window.recipeDetailManager) {
                await window.recipeDetailManager.handleReviewSubmission(
                    async () => {
                        if (window.enhancedRecipeAPI) {
                            return await window.enhancedRecipeAPI.submitReview(window.recipeDetailManager.recipeId, ratingValue, reviewText);
                        } else if (window.recipeDetailManager.useAPI) {
                            return await window.recipeDetailManager.recipeAPI.submitReview(window.recipeDetailManager.recipeId, ratingValue, reviewText);
                        }
                    }
                );
            }
        });
    }
    
    // Also handle star rating clicks for quick rating submission
    const starElements = document.querySelectorAll('.star-rating-input .star, .rating-stars .star');
    starElements.forEach((star, index) => {
        star.addEventListener('click', async function() {
            const rating = index + 1;
            if (window.recipeDetailManager && window.enhancedRecipeAPI) {
                try {
                    const result = await window.enhancedRecipeAPI.submitRating(window.recipeDetailManager.recipeId, rating);
                    if (result.success && result.updatedRatings) {
                        window.recipeDetailManager.updateRatingsUI(result.updatedRatings);
                    }
                } catch (error) {
                    console.error('Failed to submit rating:', error);
                }
            }
        });
    });
});
