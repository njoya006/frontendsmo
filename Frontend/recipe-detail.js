// Enhanced Recipe Detail JavaScript
class RecipeDetailManager {
    constructor() {        // Check if utils.js is loaded, use fallback if not
        if (typeof RecipeAPI !== 'undefined') {            // Try to find the correct Django server URL
            this.possibleUrls = [
                'https://frontendsmo.vercel.app',
                'http://localhost:8000',
                'http://127.0.0.1:9000',
                'http://localhost:9000'
            ];
            
            // Start with Vercel deployment
            this.recipeAPI = new RecipeAPI('https://frontendsmo.vercel.app');
            this.useAPI = true;
            
            console.log('RecipeAPI initialized with base URL:', this.recipeAPI.baseUrl);
            console.log('Will try these URLs if connection fails:', this.possibleUrls);
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
        this.recipeId = urlParams.get('id');
        
        // Handle empty string ID
        if (this.recipeId === '') {
            this.recipeId = null;
        }}    async loadRecipe() {
        if (!this.recipeId) {
            console.log('No recipe ID provided, showing default recipe');
            this.recipeId = '1';
            this.showToast('No recipe ID provided - showing featured recipe', 'info');
        }

        this.showLoading();
        console.log('🔍 Loading recipe with ID:', this.recipeId);

        try {
            if (!this.useAPI) {
                throw new Error('RecipeAPI not available');
            }

            // Fetch recipe directly from API
            console.log('📡 Fetching from API:', `${this.recipeAPI.baseUrl}/api/recipes/${this.recipeId}/`);
            const recipe = await this.recipeAPI.getRecipe(this.recipeId);
            
            console.log('✅ Recipe data received:', recipe);
            
            if (!recipe) {
                throw new Error('No recipe data received from API');
            }

            if (!recipe.id && !recipe.title && !recipe.name) {
                throw new Error('Invalid recipe data structure');
            }            // Success - render the recipe
            this.currentRecipe = recipe;
            
            // Check ownership and then render
            try {
                await this.checkOwnership();
            } catch (error) {
                console.warn('Ownership check failed, continuing without it:', error);
                this.isOwner = false;
            }
            
            this.renderRecipe(recipe);
            this.hideLoading();
            
            console.log('🎉 Recipe loaded successfully!');
            
        } catch (error) {
            console.error('❌ Error loading recipe:', error);
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
                description: "A delicious and aromatic chicken curry made with tender chicken pieces, coconut milk, and a blend of traditional spices. This recipe brings together the perfect balance of heat and flavor, creating a comforting meal that's perfect for any occasion.",
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
                instructions: "1. Heat oil in a large pan over medium heat.\n2. Add chopped onions and cook until golden.\n3. Add minced garlic and ginger, cook for 1 minute.\n4. Add curry powder and turmeric, stir for 30 seconds.\n5. Add chicken pieces and brown on all sides.\n6. Pour in coconut milk and bring to a simmer.\n7. Season with salt and cook for 20-25 minutes until chicken is tender.\n8. Serve hot with rice or naan bread.",
                categories: [{ name: "Main Course" }],
                tags: [{ name: "Spicy" }, { name: "Comfort Food" }],
                cuisines: [{ name: "Indian" }],
                contributor: {
                    username: "chef_priya",
                    profile_photo: "images/Janice.jpg",
                    bio: "Professional chef specializing in Indian cuisine"
                },
                created_at: "2025-01-15T00:00:00Z"
            },
            2: {
                id: 2,
                title: "Achu (Yellow Soup)",
                description: "Traditional Cameronian yellow soup made with palm nuts and aromatic spices. This authentic dish represents the rich culinary heritage of Cameroon and is perfect for special occasions and family gatherings.",
                image: "images/Achu.jpg",
                prep_time: 45,
                cooking_time: 90,
                servings: 6,
                calories: 280,
                difficulty: "Hard",
                meal_type: "Dinner",
                ingredients: [
                    { ingredient_name: "Palm nuts", quantity: "2", unit: "cups" },
                    { ingredient_name: "Beef", quantity: "1", unit: "kg" },
                    { ingredient_name: "Dried fish", quantity: "200", unit: "g" },
                    { ingredient_name: "Crayfish", quantity: "3", unit: "tbsp" },
                    { ingredient_name: "Pepper", quantity: "2", unit: "tsp" },
                    { ingredient_name: "Salt", quantity: "1", unit: "tsp" },
                    { ingredient_name: "Maggi cubes", quantity: "2", unit: "pieces" },
                    { ingredient_name: "Water", quantity: "4", unit: "cups" }
                ],
                instructions: "1. Boil palm nuts in water for 30 minutes.\n2. Pound the palm nuts and extract the cream.\n3. Season and cook the beef until tender.\n4. Add dried fish to the beef and cook for 10 minutes.\n5. Add the palm nut extract and bring to a boil.\n6. Season with crayfish, pepper, salt, and maggi cubes.\n7. Simmer for 20-30 minutes until the soup thickens.\n8. Serve hot with fufu or rice.",
                categories: [{ name: "Traditional" }, { name: "Soup" }],
                tags: [{ name: "Cameronian" }, { name: "Traditional" }],
                cuisines: [{ name: "African" }],
                contributor: {
                    username: "mama_alice",
                    profile_photo: "images/Pamela.jpg",
                    bio: "Traditional Cameronian cook and grandmother"
                },
                created_at: "2025-01-10T00:00:00Z"
            },
            3: {
                id: 3,
                title: "Ndole",
                description: "Cameroon's beloved national dish featuring groundnuts, bitter leaves, and your choice of meat or fish. This hearty and nutritious stew is a cornerstone of Cameronian cuisine.",
                image: "images/Ndole & Miondo.jpg",
                prep_time: 60,
                cooking_time: 120,
                servings: 8,
                calories: 420,
                difficulty: "Hard",
                meal_type: "Dinner",
                ingredients: [
                    { ingredient_name: "Bitter leaves (ndole)", quantity: "500", unit: "g" },
                    { ingredient_name: "Groundnuts", quantity: "2", unit: "cups" },
                    { ingredient_name: "Beef", quantity: "500", unit: "g" },
                    { ingredient_name: "Dried fish", quantity: "300", unit: "g" },
                    { ingredient_name: "Crayfish", quantity: "4", unit: "tbsp" },
                    { ingredient_name: "Palm oil", quantity: "1/2", unit: "cup" },
                    { ingredient_name: "Onions", quantity: "2", unit: "medium" },
                    { ingredient_name: "Garlic", quantity: "4", unit: "cloves" },
                    { ingredient_name: "Ginger", quantity: "1", unit: "inch" },
                    { ingredient_name: "Stock cubes", quantity: "3", unit: "pieces" }
                ],
                instructions: "1. Wash and prepare the bitter leaves, removing stems.\n2. Grind groundnuts into a smooth paste.\n3. Season and cook meat until tender.\n4. Add dried fish and cook for 15 minutes.\n5. Add groundnut paste and enough water to make a thick soup.\n6. Add prepared ndole leaves and simmer.\n7. Season with crayfish, onions, garlic, and ginger.\n8. Add palm oil and stock cubes, cook for 30 minutes.\n9. Serve with plantains, rice, or miondo.",
                categories: [{ name: "National Dish" }, { name: "Traditional" }],
                tags: [{ name: "Cameronian" }, { name: "National Dish" }],
                cuisines: [{ name: "African" }],
                contributor: {
                    username: "chef_mbaku",
                    profile_photo: "images/Njoya.jpg",
                    bio: "Professional chef and cultural food preservationist"
                },
                created_at: "2025-01-08T00:00:00Z"
            },
            4: {
                id: 4,
                title: "Eru",
                description: "Traditional Cameronian vegetable soup made with eru leaves, waterleaf, and a variety of proteins. This nutritious dish is both delicious and culturally significant.",
                image: "images/Eru.jpg",
                prep_time: 40,
                cooking_time: 80,
                servings: 6,
                calories: 320,
                difficulty: "Medium",
                meal_type: "Dinner",
                ingredients: [
                    { ingredient_name: "Eru leaves", quantity: "300", unit: "g" },
                    { ingredient_name: "Water leaves", quantity: "200", unit: "g" },
                    { ingredient_name: "Beef", quantity: "400", unit: "g" },
                    { ingredient_name: "Dried fish", quantity: "200", unit: "g" },
                    { ingredient_name: "Palm oil", quantity: "1/3", unit: "cup" },
                    { ingredient_name: "Crayfish", quantity: "3", unit: "tbsp" },
                    { ingredient_name: "Pepper", quantity: "1", unit: "tsp" },
                    { ingredient_name: "Salt", quantity: "1", unit: "tsp" },
                    { ingredient_name: "Maggi cubes", quantity: "2", unit: "pieces" }
                ],
                instructions: "1. Clean and shred eru leaves finely.\n2. Wash and chop water leaves.\n3. Season and cook meat until tender.\n4. Add dried fish and cook for 10 minutes.\n5. Add eru leaves and a little water, cook for 15 minutes.\n6. Add water leaves and palm oil.\n7. Season with crayfish, pepper, salt, and maggi.\n8. Simmer for 20 minutes until vegetables are tender.\n9. Serve hot with garri, rice, or yam.",
                categories: [{ name: "Traditional" }, { name: "Healthy" }],
                tags: [{ name: "Vegetable" }, { name: "Traditional" }],
                cuisines: [{ name: "African" }],
                contributor: {
                    username: "traditional_cook",
                    profile_photo: "images/Nicole.jpg",
                    bio: "Village cook specializing in traditional recipes"
                },
                created_at: "2025-01-05T00:00:00Z"
            },
            5: {
                id: 5,
                title: "Koki",
                description: "Steamed bean cake wrapped in banana leaves, a beloved Cameronian snack that's both nutritious and delicious. Perfect for breakfast or as a side dish.",
                image: "images/Koki.jpg",
                prep_time: 90,
                cooking_time: 60,
                servings: 4,
                calories: 180,
                difficulty: "Medium",
                meal_type: "Snack",
                ingredients: [
                    { ingredient_name: "Black-eyed beans", quantity: "2", unit: "cups" },
                    { ingredient_name: "Palm oil", quantity: "1/4", unit: "cup" },
                    { ingredient_name: "Onions", quantity: "1", unit: "medium" },
                    { ingredient_name: "Crayfish", quantity: "2", unit: "tbsp" },
                    { ingredient_name: "Pepper", quantity: "1", unit: "tsp" },
                    { ingredient_name: "Salt", quantity: "1", unit: "tsp" },
                    { ingredient_name: "Banana leaves", quantity: "4", unit: "large" },
                    { ingredient_name: "Water", quantity: "1", unit: "cup" }
                ],
                instructions: "1. Soak beans overnight and remove skins.\n2. Blend beans with onions and a little water until smooth.\n3. Add palm oil, crayfish, pepper, and salt to the mixture.\n4. Clean banana leaves and cut into squares.\n5. Pour bean mixture onto banana leaves and wrap securely.\n6. Steam the wrapped koki for 45-60 minutes.\n7. Check doneness by inserting a knife - it should come out clean.\n8. Serve hot as a snack or side dish.",
                categories: [{ name: "Snack" }, { name: "Traditional" }],
                tags: [{ name: "Vegetarian" }, { name: "Traditional" }],
                cuisines: [{ name: "African" }],
                contributor: {
                    username: "grandma_rose",
                    profile_photo: "images/Precious.jpg",
                    bio: "Grandmother and keeper of traditional recipes"
                },
                created_at: "2025-01-02T00:00:00Z"            },
            6: {
                id: 6,
                title: "Ekwang",
                description: "Delicious Cameronian dish made with cocoyam and wrapped in cocoyam leaves. A traditional comfort food that brings families together.",
                image: "images/Ekwang.jpg",
                prep_time: 120,
                cooking_time: 90,
                servings: 8,
                calories: 300,
                difficulty: "Hard",
                meal_type: "Dinner",
                ingredients: [
                    { ingredient_name: "Cocoyam", quantity: "2", unit: "kg" },
                    { ingredient_name: "Cocoyam leaves", quantity: "50", unit: "pieces" },
                    { ingredient_name: "Beef", quantity: "500", unit: "g" },
                    { ingredient_name: "Dried fish", quantity: "200", unit: "g" },
                    { ingredient_name: "Palm oil", quantity: "1/2", unit: "cup" },
                    { ingredient_name: "Crayfish", quantity: "4", unit: "tbsp" },
                    { ingredient_name: "Pepper", quantity: "2", unit: "tsp" },
                    { ingredient_name: "Salt", quantity: "1", unit: "tsp" }
                ],
                instructions: "1. Peel and grate cocoyam.\n2. Season the grated cocoyam with salt and pepper.\n3. Wrap portions in cocoyam leaves.\n4. Cook meat until tender.\n5. Add wrapped cocoyam to the pot with meat.\n6. Add palm oil and seasonings.\n7. Cook for 45 minutes.\n8. Serve hot with the meat broth.",
                categories: [{ name: "Traditional" }, { name: "Main Course" }],
                tags: [{ name: "Cameronian" }, { name: "Traditional" }],
                cuisines: [{ name: "African" }],
                contributor: {
                    username: "village_chef",
                    profile_photo: "images/Janice.jpg",
                    bio: "Traditional village chef"
                },
                created_at: "2025-01-01T00:00:00Z"
            },
            7: {
                id: 7,
                title: "Boiled Corn",
                description: "Simple and healthy boiled corn, perfect as a snack or side dish. A staple food that's nutritious and filling.",
                image: "images/Boiled Corn.jpg",
                prep_time: 10,
                cooking_time: 20,
                servings: 4,
                calories: 150,
                difficulty: "Easy",
                meal_type: "Snack",
                ingredients: [
                    { ingredient_name: "Fresh corn", quantity: "4", unit: "ears" },
                    { ingredient_name: "Water", quantity: "6", unit: "cups" },
                    { ingredient_name: "Salt", quantity: "1", unit: "tsp" }
                ],
                instructions: "1. Remove husks and silk from corn.\n2. Bring water to boil in a large pot.\n3. Add salt to the water.\n4. Add corn and cook for 15-20 minutes.\n5. Check for tenderness.\n6. Remove and serve hot or cold.",
                categories: [{ name: "Snack" }, { name: "Healthy" }],
                tags: [{ name: "Simple" }, { name: "Healthy" }],
                cuisines: [{ name: "Universal" }],
                contributor: {
                    username: "healthy_cook",
                    profile_photo: "images/Bright.jpg",
                    bio: "Advocate for simple, healthy cooking"
                },
                created_at: "2024-12-30T00:00:00Z"
            },
            8: {
                id: 8,
                title: "Bread Salad",
                description: "Fresh and light bread salad with vegetables and herbs. A perfect lunch option that's both satisfying and nutritious.",
                image: "images/Bread Salad.jpg",
                prep_time: 15,
                cooking_time: 0,
                servings: 2,
                calories: 220,
                difficulty: "Easy",
                meal_type: "Lunch",
                ingredients: [
                    { ingredient_name: "Bread", quantity: "4", unit: "slices" },
                    { ingredient_name: "Tomatoes", quantity: "2", unit: "medium" },
                    { ingredient_name: "Cucumber", quantity: "1", unit: "medium" },
                    { ingredient_name: "Lettuce", quantity: "1", unit: "head" },
                    { ingredient_name: "Olive oil", quantity: "3", unit: "tbsp" },
                    { ingredient_name: "Vinegar", quantity: "1", unit: "tbsp" },
                    { ingredient_name: "Salt", quantity: "1/2", unit: "tsp" },
                    { ingredient_name: "Pepper", quantity: "1/4", unit: "tsp" }
                ],
                instructions: "1. Cut bread into cubes and toast lightly.\n2. Chop tomatoes and cucumber.\n3. Tear lettuce into pieces.\n4. Combine all vegetables in a bowl.\n5. Mix olive oil, vinegar, salt, and pepper.\n6. Add bread cubes to vegetables.\n7. Drizzle with dressing and toss.\n8. Serve immediately.",
                categories: [{ name: "Salad" }, { name: "Light Meal" }],
                tags: [{ name: "Fresh" }, { name: "Healthy" }],
                cuisines: [{ name: "Mediterranean" }],
                contributor: {
                    username: "fresh_chef",
                    profile_photo: "images/Nicole.jpg",
                    bio: "Specialist in fresh and light cuisine"
                },
                created_at: "2024-12-28T00:00:00Z"
            },
            9: {
                id: 9,
                title: "Scotch Egg",
                description: "Crispy breaded hard-boiled eggs wrapped in seasoned sausage meat. A British classic that's perfect for picnics or as a snack.",
                image: "images/Scotch Egg.jpg",
                prep_time: 30,
                cooking_time: 15,
                servings: 4,
                calories: 280,
                difficulty: "Medium",
                meal_type: "Snack",
                ingredients: [
                    { ingredient_name: "Hard-boiled eggs", quantity: "4", unit: "pieces" },
                    { ingredient_name: "Sausage meat", quantity: "300", unit: "g" },
                    { ingredient_name: "Flour", quantity: "1/2", unit: "cup" },
                    { ingredient_name: "Beaten egg", quantity: "1", unit: "piece" },
                    { ingredient_name: "Breadcrumbs", quantity: "1", unit: "cup" },
                    { ingredient_name: "Oil for frying", quantity: "2", unit: "cups" },
                    { ingredient_name: "Salt", quantity: "1/2", unit: "tsp" },
                    { ingredient_name: "Pepper", quantity: "1/4", unit: "tsp" }
                ],
                instructions: "1. Peel the hard-boiled eggs.\n2. Season sausage meat with salt and pepper.\n3. Wrap each egg in sausage meat.\n4. Roll in flour, then beaten egg, then breadcrumbs.\n5. Heat oil to 180°C.\n6. Fry scotch eggs for 5-6 minutes until golden.\n7. Drain on paper towels.\n8. Serve hot or cold.",
                categories: [{ name: "Snack" }, { name: "British" }],
                tags: [{ name: "Fried" }, { name: "Portable" }],
                cuisines: [{ name: "British" }],
                contributor: {
                    username: "pub_chef",
                    profile_photo: "images/Pamela.jpg",
                    bio: "Traditional British pub food specialist"
                },
                created_at: "2024-12-25T00:00:00Z"
            },
            10: {
                id: 10,
                title: "Chin Chin",
                description: "Crispy, sweet, and crunchy West African snack that's perfect for any occasion. A beloved treat that's both simple and delicious.",
                image: "images/Chin Chin.jpg",
                prep_time: 45,
                cooking_time: 20,
                servings: 6,
                calories: 180,
                difficulty: "Medium",
                meal_type: "Snack",
                ingredients: [
                    { ingredient_name: "Flour", quantity: "2", unit: "cups" },
                    { ingredient_name: "Sugar", quantity: "1/4", unit: "cup" },
                    { ingredient_name: "Butter", quantity: "3", unit: "tbsp" },
                    { ingredient_name: "Eggs", quantity: "2", unit: "pieces" },
                    { ingredient_name: "Milk", quantity: "1/4", unit: "cup" },
                    { ingredient_name: "Baking powder", quantity: "1", unit: "tsp" },
                    { ingredient_name: "Salt", quantity: "1/4", unit: "tsp" },
                    { ingredient_name: "Oil for frying", quantity: "3", unit: "cups" }
                ],
                instructions: "1. Mix flour, sugar, baking powder, and salt.\n2. Add butter and mix until crumbly.\n3. Beat eggs and milk together.\n4. Add wet ingredients to dry ingredients.\n5. Knead into a smooth dough.\n6. Roll out and cut into small squares.\n7. Heat oil and fry until golden brown.\n8. Drain and cool before serving.",
                categories: [{ name: "Snack" }, { name: "Sweet" }],
                tags: [{ name: "Crispy" }, { name: "West African" }],
                cuisines: [{ name: "African" }],
                contributor: {
                    username: "snack_master",
                    profile_photo: "images/Precious.jpg",
                    bio: "Expert in traditional African snacks"
                },
                created_at: "2024-12-22T00:00:00Z"
            }
        };

        const recipe = mockRecipes[id];
        if (!recipe) {
            throw new Error('Recipe not found');
        }
        return recipe;
    }    async checkOwnership() {
        try {
            console.log('🔐 Checking recipe ownership...');
            
            if (!this.currentRecipe.contributor) {
                console.log('No contributor info in recipe - skipping ownership check');
                this.isOwner = false;
                return;
            }

            console.log('👤 Getting current user profile...');
            
            // Use the RecipeAPI method to get current user with timeout
            const profile = await Promise.race([
                this.recipeAPI.getCurrentUser(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('User profile request timeout')), 5000)
                )
            ]);
            
            console.log('Current user profile:', profile);
            console.log('Recipe contributor:', this.currentRecipe.contributor);
            
            // Check if current user is the recipe owner
            this.isOwner = profile.username === this.currentRecipe.contributor.username || 
                          profile.id === this.currentRecipe.contributor.id ||
                          profile.is_verified_contributor ||
                          profile.is_staff;
                          
            console.log('✅ Ownership check complete. Is owner:', this.isOwner);
        } catch (error) {
            console.warn('⚠️ Error checking ownership (user might not be logged in):', error.message);
            this.isOwner = false;
            
            // Don't block the UI for ownership check failures
            if (error.message.includes('timeout')) {
                console.warn('User profile request timed out - assuming not logged in');
            }
        }
    }renderRecipe(recipe) {
        // Show debug panel if needed
        this.showDebugInfo(recipe);
          // Set hero image and title
        const imageUrl = this.getImageUrl(recipe.image);
        if (imageUrl) {
            this.loadImageWithFallback(this.heroImage, imageUrl, 'assets/default-recipe.jpg');
        } else {
            this.heroImage.src = 'assets/default-recipe.jpg';
        }
        this.heroImage.alt = recipe.title || recipe.name || 'Recipe Image';
        this.recipeTitle.textContent = recipe.title || recipe.name || 'Untitled Recipe';
        this.recipeSubtitle.textContent = recipe.description || 'No description available';

        // Render stats
        this.renderStats(recipe);
        
        // Render badges
        this.renderBadges(recipe);
        
        // Render quick info
        this.renderQuickInfo(recipe);
        
        // Render contributor info
        this.renderContributor(recipe);
        
        // Render description
        this.recipeDescription.textContent = recipe.description || recipe.summary || 'No description available';
        
        // Render ingredients
        this.renderIngredients(recipe.ingredients || []);
        
        // Render instructions
        this.renderInstructions(recipe.instructions || recipe.method || '');
        
        // Render action buttons
        this.renderActionButtons();
        
        // Show content
        this.recipeContent.classList.remove('hidden');
    }

    renderStats(recipe) {
        const stats = [];
        
        if (recipe.prep_time || recipe.cooking_time || recipe.time) {
            const time = recipe.prep_time || recipe.cooking_time || recipe.time;
            stats.push(`<div class="recipe-stat"><i class="fas fa-clock"></i><span>${time} mins</span></div>`);
        }
        
        if (recipe.servings) {
            stats.push(`<div class="recipe-stat"><i class="fas fa-users"></i><span>${recipe.servings} servings</span></div>`);
        }
        
        if (recipe.calories) {
            stats.push(`<div class="recipe-stat"><i class="fas fa-fire"></i><span>${recipe.calories} kcal</span></div>`);
        }
        
        if (recipe.difficulty) {
            stats.push(`<div class="recipe-stat"><i class="fas fa-signal"></i><span>${recipe.difficulty}</span></div>`);
        }
        
        this.recipeStats.innerHTML = stats.join('');
    }

    renderBadges(recipe) {
        const badges = [];
        
        // Categories
        if (recipe.categories && recipe.categories.length > 0) {
            recipe.categories.forEach(category => {
                badges.push(`<span class="recipe-badge category">${category.name || category}</span>`);
            });
        }
        
        // Cuisines
        if (recipe.cuisines && recipe.cuisines.length > 0) {
            recipe.cuisines.forEach(cuisine => {
                badges.push(`<span class="recipe-badge cuisine">${cuisine.name || cuisine}</span>`);
            });
        }
        
        // Tags
        if (recipe.tags && recipe.tags.length > 0) {
            recipe.tags.slice(0, 5).forEach(tag => {
                badges.push(`<span class="recipe-badge tag">${tag.name || tag}</span>`);
            });
        }
        
        this.recipeBadges.innerHTML = badges.join('');
    }

    renderQuickInfo(recipe) {
        const info = [];
        
        if (recipe.meal_type) {
            info.push(`<p><strong>Meal Type:</strong> ${recipe.meal_type}</p>`);
        }
        
        if (recipe.dietary_restrictions && recipe.dietary_restrictions.length > 0) {
            const restrictions = recipe.dietary_restrictions.map(r => r.name || r).join(', ');
            info.push(`<p><strong>Dietary:</strong> ${restrictions}</p>`);
        }
        
        if (recipe.created_at) {
            const date = new Date(recipe.created_at).toLocaleDateString();
            info.push(`<p><strong>Added:</strong> ${date}</p>`);
        }
        
        this.recipeQuickInfo.innerHTML = info.join('');
    }

    renderContributor(recipe) {
        if (!recipe.contributor) {
            this.contributorSection.classList.add('hidden');
            return;
        }        const contributor = recipe.contributor;
        const avatarUrl = this.getImageUrl(contributor.profile_photo);
        if (avatarUrl) {
            this.loadImageWithFallback(this.contributorAvatar, avatarUrl, 'assets/default-avatar.jpg');
        } else {
            this.contributorAvatar.src = 'assets/default-avatar.jpg';
        }
        this.contributorName.textContent = contributor.username || contributor.name || 'Unknown Contributor';
        this.contributorBio.textContent = contributor.bio || contributor.basic_ingredients || 'Food enthusiast';
        
        this.contributorSection.classList.remove('hidden');
    }    renderIngredients(ingredients) {
        if (!ingredients || ingredients.length === 0) {
            this.ingredientsList.innerHTML = '<li class="ingredient-item"><span class="ingredient-name">No ingredients listed</span></li>';
            return;
        }

        console.log('=== INGREDIENTS DEBUG ===');
        console.log('Raw ingredients data:', ingredients);
        console.log('Number of ingredients:', ingredients.length);
        console.log('Type of ingredients:', typeof ingredients);
        console.log('Is Array:', Array.isArray(ingredients));
        ingredients.forEach((ing, i) => {
            console.log(`Ingredient ${i}:`, ing, 'Type:', typeof ing);
        });
        console.log('=== END INGREDIENTS DEBUG ===');

        const ingredientItems = ingredients.map((ingredient, index) => {
            let name, quantity;
            
            if (typeof ingredient === 'string') {
                name = ingredient;
                quantity = '';
            } else {
                // Log the structure of each ingredient object for debugging
                console.log(`Ingredient ${index + 1} structure:`, Object.keys(ingredient), ingredient);                // Try multiple possible field names for ingredient name
                // Handle nested ingredient object structure from Django
                name = ingredient.ingredient?.name || 
                       ingredient.ingredient?.ingredient_name ||
                       ingredient.ingredient?.title ||
                       ingredient.ingredient_name || 
                       ingredient.name || 
                       ingredient.item || 
                       ingredient.ingredient ||
                       ingredient.title ||
                       ingredient.display_name ||
                       // Common Django field names
                       ingredient.ingredient__name ||
                       ingredient.ingredient__ingredient_name ||
                       JSON.stringify(ingredient.ingredient) || // Show nested ingredient object
                       JSON.stringify(ingredient) || // Fallback to show the object structure
                       `Unknown ingredient ${index + 1}`;
                
                // Try multiple possible field names for quantity
                const qty = ingredient.quantity || 
                           ingredient.amount || 
                           ingredient.qty || 
                           ingredient.volume ||
                           ingredient.weight ||
                           ingredient.measure ||
                           ingredient.unit_of_measurement ||
                           ingredient.measure_unit ||
                           '';
                           
                const unit = ingredient.unit || 
                            ingredient.units || 
                            ingredient.measurement || 
                            ingredient.unit_of_measurement ||
                            ingredient.measure_unit ||
                            '';
                
                quantity = qty && unit ? `${qty} ${unit}` : (qty || '');
                  // If we still have "Unknown ingredient", try to extract from any available field
                if (name && typeof name === 'string' && name.startsWith('Ingredient ') && Object.keys(ingredient).length > 0) {
                    // Try to find any field that might contain the ingredient name
                    const possibleNameFields = Object.keys(ingredient).filter(key => 
                        typeof ingredient[key] === 'string' && 
                        ingredient[key].length > 0 &&
                        !['id', 'created_at', 'updated_at', 'recipe_id'].includes(key)
                    );
                    
                    if (possibleNameFields.length > 0) {
                        name = ingredient[possibleNameFields[0]];
                    }
                }
                
                // Debug log for each ingredient
                console.log(`Ingredient ${index + 1} processed:`, {
                    original: ingredient,
                    name: name,
                    quantity: quantity
                });
            }

            return `
                <li class="ingredient-item">
                    <span class="ingredient-name">${name}</span>
                    ${quantity ? `<span class="ingredient-quantity">${quantity}</span>` : ''}
                </li>
            `;
        }).join('');

        this.ingredientsList.innerHTML = ingredientItems;
    }

    renderInstructions(instructions) {
        if (!instructions) {
            this.instructionsList.innerHTML = '<li class="instruction-item"><span class="instruction-text">No instructions provided</span></li>';
            return;
        }

        let steps = [];
        
        if (typeof instructions === 'string') {
            // Split by common delimiters
            steps = instructions.split(/\r?\n|\.(?=\s|$)|\d+\./)
                .map(step => step.trim())
                .filter(step => step.length > 0);
        } else if (Array.isArray(instructions)) {
            steps = instructions.map(step => typeof step === 'string' ? step : step.text || step.description || '');
        }

        if (steps.length === 0) {
            steps = [instructions];
        }

        const instructionItems = steps.map(step => `
            <li class="instruction-item">
                <span class="instruction-text">${step}</span>
            </li>
        `).join('');

        this.instructionsList.innerHTML = instructionItems;
    }    renderActionButtons() {
        console.log('🔘 Rendering action buttons. isOwner:', this.isOwner);
        console.log('🔘 Current recipe contributor:', this.currentRecipe?.contributor);
        
        // Start with default action buttons
        let actionButtonsHTML = `
            <button class="action-btn btn-secondary" onclick="printRecipe()">
                <i class="fas fa-print"></i>
                Print Recipe
            </button>
            <button class="action-btn btn-info" onclick="shareRecipe()">
                <i class="fas fa-share"></i>
                Share Recipe
            </button>
            <button class="action-btn btn-warning" onclick="saveRecipe()">
                <i class="fas fa-bookmark"></i>
                Save Recipe
            </button>
        `;
        
        // Add owner-specific buttons if user owns the recipe
        if (this.isOwner) {
            console.log('✅ User is owner - adding edit/delete buttons');
            actionButtonsHTML += `
                <button class="action-btn btn-primary" onclick="recipeDetailManager.editRecipe()">
                    <i class="fas fa-edit"></i>
                    Edit Recipe
                </button>
                <button class="action-btn btn-danger" onclick="recipeDetailManager.deleteRecipe()">
                    <i class="fas fa-trash"></i>
                    Delete Recipe
                </button>
            `;
        } else {
            console.log('❌ User is not owner - no edit/delete buttons');
        }

        // Set the complete HTML (replace, don't append)
        this.actionButtons.innerHTML = actionButtonsHTML;
        
        console.log('🔘 Final action buttons HTML:', this.actionButtons.innerHTML);
    }getImageUrl(imagePath) {
        if (!imagePath) return null;
        
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        
        // Handle relative paths
        const baseUrl = this.recipeAPI.baseUrl;
        
        // Try different path combinations based on common Django configurations
        if (imagePath.startsWith('/media/')) {
            return `${baseUrl}${imagePath}`;
        } else if (imagePath.startsWith('media/')) {
            return `${baseUrl}/${imagePath}`;
        } else if (imagePath.startsWith('images/')) {
            // Image is in local images folder (not Django media)
            return imagePath;
        } else {
            // Default Django media path
            return `${baseUrl}/media/${imagePath}`;
        }
    }

    // Enhanced image loading with fallback
    loadImageWithFallback(imgElement, primaryUrl, fallbackUrl = 'assets/default-recipe.jpg') {
        if (!imgElement) return;
        
        imgElement.onerror = () => {
            console.warn(`Failed to load image: ${primaryUrl}, trying fallback...`);
            if (primaryUrl.includes('/media/')) {
                // Try loading from local images folder instead
                const filename = primaryUrl.split('/').pop();
                const localPath = `images/${filename}`;
                
                imgElement.onerror = () => {
                    console.warn(`Fallback also failed: ${localPath}, using default image`);
                    imgElement.src = fallbackUrl;
                    imgElement.onerror = null; // Prevent infinite loop
                };
                imgElement.src = localPath;
            } else {
                imgElement.src = fallbackUrl;
                imgElement.onerror = null; // Prevent infinite loop
            }
        };
          imgElement.src = primaryUrl;
    }

    showLoading() {
        this.loadingSpinner.classList.remove('hidden');
        this.errorState.classList.add('hidden');
        this.recipeContent.classList.add('hidden');
    }

    hideLoading() {
        this.loadingSpinner.classList.add('hidden');
    }

    showError(message) {
        this.hideLoading();
        this.errorMessage.textContent = message;
        this.errorState.classList.remove('hidden');
        this.recipeContent.classList.add('hidden');
    }

    showToast(message, type = 'info') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type}`;
        this.toast.style.display = 'block';
        
        setTimeout(() => {
            this.toast.style.display = 'none';
        }, 3000);
    }

    async editRecipe() {
        if (!this.isOwner) {
            this.showToast('You can only edit recipes you created', 'error');
            return;
        }
        
        // Redirect to recipe edit page (you'll need to create this)
        const editUrl = `recipe-edit.html?id=${this.recipeId}`;
        
        // For now, let's create a simple edit form modal
        this.showEditModal();
    }    // Delete recipe functionality
    async deleteRecipe() {
        if (!this.isOwner) {
            this.showToast('You can only delete recipes you created', 'error');
            return;
        }

        // Show custom confirmation modal
        const confirmed = await this.showConfirmationModal(
            'Delete Recipe',
            `Are you sure you want to delete "${this.currentRecipe.title}"?`,
            'This action cannot be undone.',
            'Delete',
            'btn-danger'
        );
        
        if (!confirmed) return;        try {
            // Show loading state
            this.showToast('Deleting recipe...', 'info');
            
            // Use the RecipeAPI method to delete the recipe
            await this.recipeAPI.deleteRecipe(this.recipeId);
            
            this.showToast('Recipe deleted successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'Recipes.html'; // Redirect to recipes list
            }, 2000);
        } catch (error) {
            console.error('Delete recipe error:', error);
            this.showToast('Failed to delete recipe. Please try again.', 'error');
        }
    }// Show edit modal (enhanced implementation)
    showEditModal() {
        console.log('🔧 Opening edit modal for recipe:', this.currentRecipe.title);
        console.log('🔧 Current recipe ingredients:', this.currentRecipe.ingredients);
        
        const formattedIngredients = this.formatIngredientsForEdit();
        console.log('🔧 Formatted ingredients for edit modal:', formattedIngredients);
        
        const modal = document.createElement('div');
        modal.className = 'edit-modal-overlay';
        modal.innerHTML = `
            <div class="edit-modal">
                <div class="edit-modal-header">
                    <h3><i class="fas fa-edit"></i> Edit Recipe</h3>
                    <button class="close-modal" onclick="this.closest('.edit-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="edit-modal-content">
                    <form id="editRecipeForm">                        <div class="form-group">
                            <label for="editTitle">
                                <i class="fas fa-heading"></i>
                                Recipe Title *
                            </label>
                            <input type="text" id="editTitle" value="${this.currentRecipe.title || ''}" required placeholder="Enter recipe title">
                        </div>
                        
                        <div class="form-group">
                            <label for="editDescription">
                                <i class="fas fa-align-left"></i>
                                Description
                            </label>
                            <textarea id="editDescription" rows="4" placeholder="Describe your recipe...">${this.currentRecipe.description || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="editImage">
                                <i class="fas fa-image"></i>
                                Recipe Image
                            </label>
                            <div style="margin-bottom: 10px;">
                                <img id="currentImagePreview" src="${this.getImageUrl(this.currentRecipe.image) || 'assets/default-recipe.jpg'}" 
                                     alt="Current recipe image" style="max-width: 200px; max-height: 150px; border-radius: 5px; border: 1px solid #ddd;">
                            </div>
                            <input type="file" id="editImage" accept="image/*" onchange="recipeDetailManager.previewNewImage(this)">
                            <small style="color: #666;">
                                <i class="fas fa-info-circle"></i> 
                                Image selection available for preview. 
                                <strong>Note:</strong> Image upload requires Django CSRF_TRUSTED_ORIGINS configuration.
                                For now, only text fields can be updated.
                            </small>
                            <div id="newImagePreview" style="margin-top: 10px; display: none;">
                                <img id="newImagePreviewImg" style="max-width: 200px; max-height: 150px; border-radius: 5px; border: 1px solid #ddd;">                                <button type="button" onclick="recipeDetailManager.removeNewImage()" style="display: block; margin-top: 5px; background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                                    Remove New Image
                                </button>
                            </div>                        <div class="form-group">
                            <label for="editInstructions">
                                <i class="fas fa-list-ol"></i>
                                Instructions
                            </label>
                            <textarea id="editInstructions" rows="6" placeholder="Step-by-step cooking instructions...">${this.currentRecipe.instructions || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="editIngredients">
                                <i class="fas fa-shopping-list"></i>
                                Ingredients (read-only)
                            </label>
                            <textarea id="editIngredients" rows="5" readonly style="background-color: #f5f5f5; color: #666;">${this.formatIngredientsForEdit()}</textarea>
                            <small style="color: #666;">
                                <i class="fas fa-info-circle"></i> 
                                Ingredient editing is currently read-only due to backend validation requirements. 
                                <strong>Note:</strong> Django requires at least 4 ingredients per recipe. 
                                Only recipe title, description, instructions, and timing can be edited. 
                                Current ingredients will be preserved during updates.
                            </small>
                        </div>                        <div class="form-row">
                            <div class="form-group">
                                <label for="editPrepTime">
                                    <i class="fas fa-clock"></i>
                                    Prep Time (minutes)
                                </label>
                                <input type="number" id="editPrepTime" value="${this.currentRecipe.prep_time || ''}" min="0" placeholder="0">
                            </div>
                            <div class="form-group">
                                <label for="editCookTime">
                                    <i class="fas fa-fire"></i>
                                    Cook Time (minutes)
                                </label>
                                <input type="number" id="editCookTime" value="${this.currentRecipe.cooking_time || this.currentRecipe.cook_time || ''}" min="0" placeholder="0">
                            </div>
                            <div class="form-group">
                                <label for="editServings">
                                    <i class="fas fa-users"></i>
                                    Servings
                                </label>
                                <input type="number" id="editServings" value="${this.currentRecipe.servings || ''}" min="1" placeholder="1">
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.edit-modal-overlay').remove()">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);        // Handle form submission
        const form = modal.querySelector('#editRecipeForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRecipeChanges(modal);        });
    }

    // Preview new image when selected
    previewNewImage(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                this.showToast('Image file is too large. Please select an image smaller than 5MB.', 'error');
                input.value = '';
                return;
            }
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.showToast('Please select a valid image file.', 'error');
                input.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('newImagePreview').style.display = 'block';
                document.getElementById('newImagePreviewImg').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    // Remove new image selection
    removeNewImage() {
        document.getElementById('editImage').value = '';
        document.getElementById('newImagePreview').style.display = 'none';
    }// Save recipe changes
    async saveRecipeChanges(modal) {
        var form = modal.querySelector('#editRecipeForm');
        
        // Clean and validate ingredients data structure
        var cleanedIngredients = [];
        if (this.currentRecipe.ingredients && Array.isArray(this.currentRecipe.ingredients)) {
            cleanedIngredients = this.currentRecipe.ingredients
                .map(ingredient => {
                    if (typeof ingredient === 'string') {
                        // If ingredient is just a string, convert to proper format
                        const trimmedName = ingredient.trim();
                        if (!trimmedName) return null; // Skip empty ingredients
                        
                        return {
                            ingredient_name: trimmedName,
                            quantity: "1",
                            unit: "piece"
                        };                    } else if (ingredient && typeof ingredient === 'object') {
                        // Extract ingredient name using same logic as renderIngredients
                        let name = ingredient.ingredient?.name || 
                                  ingredient.ingredient?.ingredient_name ||
                                  ingredient.ingredient?.title ||
                                  ingredient.ingredient_name || 
                                  ingredient.name || 
                                  ingredient.item || 
                                  ingredient.ingredient ||
                                  ingredient.title ||
                                  ingredient.display_name ||
                                  ingredient.ingredient__name ||
                                  ingredient.ingredient__ingredient_name ||
                                  '';
                        
                        // Handle nested ingredient objects
                        if (typeof name === 'object') {
                            name = name.ingredient_name || name.name || '';
                        }
                        
                        // Extract quantity and unit
                        const quantity = ingredient.quantity || ingredient.amount || ingredient.qty || '1';
                        const unit = ingredient.unit || ingredient.units || ingredient.measurement || 'piece';
                        
                        // Skip ingredients without a name
                        if (!name || !name.toString().trim()) {
                            console.warn(`Skipping ingredient - no valid name found:`, ingredient);
                            return null;
                        }
                          return {
                            ingredient_name: name.toString().trim(),
                            quantity: quantity.toString().trim(),
                            unit: unit.toString().trim()
                        };
                    }
                    return null; // Skip invalid ingredients
                })                .filter(ingredient => ingredient !== null); // Remove null entries
        }
        
        console.log('🔧 Ingredient cleaning process:', {
            originalCount: this.currentRecipe.ingredients?.length || 0,
            cleanedCount: cleanedIngredients.length,
            originalIngredients: this.currentRecipe.ingredients,
            cleanedIngredients: cleanedIngredients
        });
          // Build update data with proper validation
        var updatedData = {
            title: form.querySelector('#editTitle').value.trim(),
            description: form.querySelector('#editDescription').value.trim(),
            instructions: form.querySelector('#editInstructions').value.trim(),
            prep_time: parseInt(form.querySelector('#editPrepTime').value) || null,
            cooking_time: parseInt(form.querySelector('#editCookTime').value) || null,
            servings: parseInt(form.querySelector('#editServings').value) || null
        };

        // Check if a new image was selected
        const imageInput = form.querySelector('#editImage');
        const hasNewImage = imageInput && imageInput.files && imageInput.files[0];

        console.log('🖼️ Image update check:', {
            hasNewImage: hasNewImage,
            imageFileName: hasNewImage ? imageInput.files[0].name : 'none'
        });// Always include ingredients to satisfy Django's "at least 4 ingredients" rule
        // Use cleaned ingredients if available, otherwise preserve original ingredients
        if (cleanedIngredients.length >= 4) {
            updatedData.ingredients = cleanedIngredients;
        } else if (this.currentRecipe.ingredients && this.currentRecipe.ingredients.length >= 4) {
            // Preserve original ingredients to satisfy the minimum requirement
            updatedData.ingredients = this.currentRecipe.ingredients;
            console.log('Using original ingredients to satisfy minimum requirement');
        } else {
            console.warn('Recipe has fewer than 4 ingredients, update may fail due to backend validation');
            updatedData.ingredients = cleanedIngredients.length > 0 ? cleanedIngredients : this.currentRecipe.ingredients;
        }

        // Remove empty/null values to avoid backend validation issues (but keep ingredients)
        Object.keys(updatedData).forEach(key => {
            if (key !== 'ingredients' && (updatedData[key] === null || updatedData[key] === '')) {
                delete updatedData[key];
            }
        });

        console.log('Attempting to save recipe changes:', {
            recipeId: this.recipeId,
            updatedData: updatedData,
            originalIngredients: this.currentRecipe.ingredients,
            cleanedIngredients: cleanedIngredients,
            ingredientCount: cleanedIngredients.length
        });        try {
            // Show loading state
            this.showToast('Updating recipe...', 'info');
            
            let result;            if (hasNewImage) {
                // Use FormData for image upload
                console.log('📤 Updating recipe with image upload...');
                const imageFile = imageInput.files[0]; // Use imageInput that was already found
                
                if (!imageFile) {
                    throw new Error('Image file not found despite hasNewImage being true');
                }
                
                console.log('📤 Image file details:', {
                    name: imageFile.name,
                    size: imageFile.size,
                    type: imageFile.type
                });
                
                // Create clean data object without ingredients (since they're read-only in the UI)
                const imageUpdateData = {
                    title: updatedData.title,
                    description: updatedData.description,
                    instructions: updatedData.instructions,
                    prep_time: updatedData.prep_time,
                    cooking_time: updatedData.cooking_time,
                    servings: updatedData.servings
                };
                
                this.showToast('Uploading image and updating recipe...', 'info');
                result = await this.recipeAPI.updateRecipeWithImage(this.recipeId, imageUpdateData, imageFile);
            } else {
                // Use regular JSON update
                console.log('📤 Updating recipe without image...');
                result = await this.recipeAPI.updateRecipe(this.recipeId, updatedData);
            }
              console.log('Recipe update successful:', result);
            this.currentRecipe = result;
            this.renderRecipe(result);
            modal.remove();
            this.showToast('Recipe updated successfully!', 'success');} catch (error) {
            console.error('Update recipe error details:', error);
              // Check if it's a validation error and provide helpful feedback
            if (error.message.includes('at least 4 ingredients')) {
                this.showToast('Recipe must have at least 4 ingredients. Please add more ingredients before editing.', 'error');
            } else if (error.message.includes('ingredient') || error.message.includes('Ingredient')) {
                this.showToast('Ingredient validation failed. Please check ingredient format.', 'error');
            } else if (error.message.includes('CSRF')) {
                this.showToast('CSRF Error: Please configure Django backend to trust this origin. See browser console for details.', 'error');
            } else if (error.message.includes('403') && error.message.includes('Forbidden')) {
                this.showToast('Access forbidden. This may be due to CSRF configuration. Check browser console for details.', 'error');
            } else {
                this.showToast('Failed to update recipe: ' + error.message, 'error');
            }
        }
    }

    // Show confirmation modal
    showConfirmationModal(title, message, subMessage, confirmText, confirmClass = 'btn-danger') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'edit-modal-overlay';
            modal.innerHTML = `
                <div class="edit-modal" style="max-width: 450px;">
                    <div class="edit-modal-header">
                        <h3><i class="fas fa-exclamation-triangle"></i> ${title}</h3>
                    </div>
                    <div class="edit-modal-content">
                        <p style="font-size: 1.1rem; margin-bottom: 10px;">${message}</p>
                        ${subMessage ? `<p style="color: var(--gray-color); margin-bottom: 25px;">${subMessage}</p>` : ''}
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.edit-modal-overlay').remove()">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                            <button type="button" class="btn ${confirmClass}" id="confirmAction">
                                <i class="fas fa-check"></i> ${confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Handle button clicks
            modal.querySelector('.btn-secondary').onclick = () => {
                modal.remove();
                resolve(false);
            };

            modal.querySelector('#confirmAction').onclick = () => {
                modal.remove();
                resolve(true);
            };

            // Handle backdrop click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve(false);
                }
            };
        });
    }

    // Show debug information (optional)
    showDebugInfo(recipe) {
        // Only show debug info if there's a debug container on the page
        const debugContainer = document.getElementById('debugInfo');
        if (debugContainer) {
            debugContainer.innerHTML = `
                <div class="debug-panel">
                    <h4>🔧 Debug Info</h4>
                    <div class="debug-item">
                        <strong>Recipe ID:</strong> ${recipe.id || 'N/A'}
                    </div>
                    <div class="debug-item">
                        <strong>Title:</strong> ${recipe.title || 'N/A'}
                    </div>
                    <div class="debug-item">
                        <strong>Contributor:</strong> ${recipe.contributor?.username || 'N/A'}
                    </div>                    <div class="debug-item">
                        <strong>Image URL:</strong> ${recipe.image || 'N/A'}
                    </div>
                    <div class="debug-item">
                        <strong>Is Owner:</strong> ${this.isOwner ? '✅ Yes' : '❌ No'}
                    </div>
                </div>
            `;
        }
    }    // Format ingredients for editing in textarea
    formatIngredientsForEdit() {
        if (!this.currentRecipe.ingredients || !Array.isArray(this.currentRecipe.ingredients)) {
            return '';
        }
        
        return this.currentRecipe.ingredients.map((ingredient, index) => {
            if (typeof ingredient === 'string') {
                return ingredient;
            }
            
            // Handle ingredient objects from Django (using same logic as renderIngredients)
            let name = ingredient.ingredient?.name || 
                      ingredient.ingredient?.ingredient_name ||
                      ingredient.ingredient?.title ||
                      ingredient.ingredient_name || 
                      ingredient.name || 
                      ingredient.item || 
                      ingredient.ingredient ||
                      ingredient.title ||
                      ingredient.display_name ||
                      // Common Django field names
                      ingredient.ingredient__name ||
                      ingredient.ingredient__ingredient_name ||
                      `Ingredient ${index + 1}`;
            
            // Handle nested ingredient objects
            if (typeof name === 'object') {
                name = name.ingredient_name || name.name || `Ingredient ${index + 1}`;
            }
            
            var quantity = ingredient.quantity || ingredient.amount || ingredient.qty || '';
            var unit = ingredient.unit || ingredient.units || ingredient.measurement || '';
            
            // Format as "quantity unit name" or just "name" if no quantity/unit
            if (quantity && unit) {
                return `${quantity} ${unit} ${name}`.trim();
            } else if (quantity) {
                return `${quantity} ${name}`.trim();
            } else {
                return name.trim();
            }
        }).join('\n');
    }// Parse ingredients from textarea
    parseIngredientsFromText(text) {
        if (!text || !text.trim()) {
            return [];
        }
        
        return text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                // Enhanced parsing for better unit detection
                var parts = line.trim().split(/\s+/);
                
                if (parts.length === 1) {
                    // Just ingredient name: "salt"
                    return {
                        quantity: "1",
                        unit: "piece",
                        ingredient_name: parts[0]
                    };
                } else if (parts.length === 2) {
                    // Two parts: could be "2 eggs" or "2 g"
                    var quantity = parts[0];
                    var secondPart = parts[1];
                    
                    // Check if second part looks like a unit
                    var commonUnits = ['g', 'kg', 'ml', 'l', 'cup', 'cups', 'tsp', 'tbsp', 'piece', 'pieces', 'slice', 'slices'];
                    if (commonUnits.includes(secondPart.toLowerCase())) {
                        // It's a unit without ingredient name: "2 g" -> need ingredient name
                        return {
                            quantity: quantity,
                            unit: secondPart,
                            ingredient_name: "ingredient"  // Default name
                        };
                    } else {
                        // It's quantity + ingredient: "2 eggs"
                        return {
                            quantity: quantity,
                            unit: "piece",
                            ingredient_name: secondPart
                        };
                    }
                } else {
                    // Three or more parts: "2 cups flour"
                    var quantity = parts[0];
                    var unit = parts[1];
                    var name = parts.slice(2).join(' ');
                    
                    return {
                        quantity: quantity,
                        unit: unit,
                        ingredient_name: name
                    };
                }
            })
            .filter(ingredient => ingredient.ingredient_name && ingredient.ingredient_name !== 'ingredient');
    }
}

// Global functions for action buttons
function printRecipe() {
    window.print();
}

function shareRecipe() {
    if (navigator.share) {
        navigator.share({
            title: recipeDetailManager.currentRecipe.title || 'Recipe',
            text: recipeDetailManager.currentRecipe.description || 'Check out this recipe!',
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            recipeDetailManager.showToast('Recipe link copied to clipboard!', 'success');
        });
    }
}

function saveRecipe() {
    // Implementation depends on your backend for saving/favoriting recipes
    recipeDetailManager.showToast('Save functionality coming soon!', 'info');
}

// Initialize when DOM is loaded
let recipeDetailManager;

document.addEventListener('DOMContentLoaded', function() {
    recipeDetailManager = new RecipeDetailManager();
});

// Page transition animations (keeping the existing ones)
