document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Recipes.js loaded successfully with image fallback utilities!');
    // Global variables
    let recipeData = [];
    let allRecipes = []; // Keep original data for reset

    // ======= IMAGE HANDLING UTILITIES =======
    
    // Default fallback images - Multiple options for variety
    const DEFAULT_RECIPE_IMAGES = [
        'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400&h=300&fit=crop', // Pasta
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', // Salad
        'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', // Soup
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop', // Pizza
        'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop', // Burger
        'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop'  // Breakfast
    ];
    
    const DEFAULT_PROFILE_IMAGES = [
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', // Male chef 1
        'https://images.unsplash.com/photo-1494790108755-2616b332c3d7?w=100&h=100&fit=crop&crop=face', // Female chef 1
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', // Male chef 2
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', // Female chef 2
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', // Male chef 3
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'  // Female chef 3
    ];
    
    // Primary fallbacks
    const DEFAULT_RECIPE_IMAGE = DEFAULT_RECIPE_IMAGES[0];
    const DEFAULT_PROFILE_IMAGE = DEFAULT_PROFILE_IMAGES[0];
    
    // Function to get random fallback image
    function getRandomRecipeImage() {
        return DEFAULT_RECIPE_IMAGES[Math.floor(Math.random() * DEFAULT_RECIPE_IMAGES.length)];
    }
    
    function getRandomProfileImage() {
        return DEFAULT_PROFILE_IMAGES[Math.floor(Math.random() * DEFAULT_PROFILE_IMAGES.length)];
    }
    
    // Helper function to get properly formatted image URL with fallback
    function getImageUrl(imageUrl, fallbackUrl) {
        if (!imageUrl) return fallbackUrl;
        
        // If it's already a full URL, return as is
        if (imageUrl.startsWith('http')) return imageUrl;
        
        // If it's a relative path, construct the full URL
        if (imageUrl.startsWith('/')) {
            return `https://njoya.pythonanywhere.com${imageUrl}`;
        }
        
        // If it's just a filename, add the media path
        return `https://njoya.pythonanywhere.com/media/${imageUrl}`;
    }
    
    // Helper function to get recipe image with fallback
    function getRecipeImageUrl(recipe) {
        // Since backend now returns full URLs in the 'image' field, use it directly
        const imageUrl = recipe.image;
        console.log('🔍 Recipe image data:', {
            recipeId: recipe.id,
            title: recipe.title,
            image: recipe.image,
            imageType: typeof recipe.image
        });
        
        if (imageUrl && imageUrl.startsWith('http')) {
            console.log('✅ Using full backend URL:', imageUrl);
            return imageUrl;
        }
        
        console.log('🔄 No valid image URL found, using fallback');
        return getRandomRecipeImage();
    }
    
    // Helper function to get profile image with fallback
    function getProfileImageUrl(contributor) {
        if (!contributor) return getRandomProfileImage();
        
        // Check common profile image field names
        const imageUrl = contributor.profile_photo || contributor.avatar || contributor.photo;
        console.log('🔍 Profile image data:', {
            username: contributor.username,
            profile_photo: contributor.profile_photo,
            avatar: contributor.avatar,
            photo: contributor.photo,
            finalImageUrl: imageUrl
        });
        
        if (imageUrl && imageUrl.startsWith('http')) {
            console.log('✅ Using full profile URL:', imageUrl);
            return imageUrl;
        }
        
        console.log('🔄 No valid profile image URL found, using fallback');
        return getRandomProfileImage();
    }
    
    // Helper function to create image element with error handling
    function createImageWithFallback(src, alt, style, fallbackSrc) {
        // Use the provided src first, with proper error handling
        const isProfile = alt === 'Profile' || style.includes('border-radius') || style.includes('50%');
        const finalFallback = isProfile ? getRandomProfileImage() : getRandomRecipeImage();
        return `<img src="${src}" alt="${alt}" style="${style}" 
                     onerror="this.onerror=null; this.src='${finalFallback}';" 
                     data-original-src="${src}">`;
    }
    
    // ======= GLOBAL IMAGE ERROR HANDLING =======
    
    // Add global error handling for all images on the page
    function addGlobalImageErrorHandling() {
        // Handle all existing images - but only add error handlers, don't replace immediately
        document.querySelectorAll('img').forEach(img => {
            // Add error handler for future failures
            if (!img.dataset.errorHandled) {
                img.addEventListener('error', function() {
                    console.log('🔄 Image failed to load, applying fallback:', this.src);
                    const isProfile = this.alt === 'Profile' || this.style.borderRadius.includes('50%');
                    this.src = isProfile ? getRandomProfileImage() : getRandomRecipeImage();
                    this.dataset.errorHandled = 'true';
                });
                img.dataset.errorHandled = 'true';
            }
        });
        
        // Handle background images more aggressively
        document.querySelectorAll('.recipe-image').forEach(element => {
            if (!element.dataset.errorHandled) {
                const backgroundImage = element.style.backgroundImage;
                // If background image is not already a fallback, replace it
                if (backgroundImage && !backgroundImage.includes('unsplash.com')) {
                    console.log('� Replacing background image with fallback');
                    element.style.backgroundImage = `url('${DEFAULT_RECIPE_IMAGE}')`;
                }
                element.dataset.errorHandled = 'true';
            }
        });
    }
    
    // Call image error handling after content is loaded
    function handleImagesAfterLoad() {
        setTimeout(() => {
            addGlobalImageErrorHandling();
        }, 500);
    }
    
    // ======= END GLOBAL IMAGE ERROR HANDLING =======
      // DOM Element Selectors
    const recipesGrid = document.getElementById('recipesGrid');
    const searchInput = document.getElementById('recipeSearch');
    const searchButton = document.getElementById('searchRecipes');
    const clearSearchButton = document.getElementById('clearSearch');
    const filterTags = document.querySelectorAll('.filter-tag');
    
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        authButtons.classList.toggle('active');
        this.querySelector('i').classList.toggle('fa-times');
    });

    // Logout Functionality
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser'); // Clean up any legacy data
        window.location.href = 'index.html';
    });

    // Fetch recipes from backend
    async function fetchRecipes() {
        const token = localStorage.getItem('authToken');
        try {
            console.log('🔄 Fetching recipes from API...');
            const response = await fetch('https://njoya.pythonanywhere.com/api/recipes/', {
                method: 'GET',
                headers: token ? { 'Authorization': `Token ${token}` } : {},
            });
            const data = await response.json();
            if (!response.ok) {
                console.warn('⚠️ API call failed, using fallback data');
                return getFallbackRecipes();
            }
            console.log('✅ Successfully fetched recipes from API');
            console.log('🔍 API Response - First recipe sample:', data[0]);
            console.log('🔍 API Response - Recipe image fields:', {
                image: data[0]?.image,
                photo: data[0]?.photo,
                recipe_image: data[0]?.recipe_image,
                allFields: Object.keys(data[0] || {})
            });
            // Only use recipes that have a contributor (created by users)
            return data.filter(recipe => recipe.contributor);
        } catch (error) {
            console.warn('⚠️ Network error, using fallback data:', error);
            return getFallbackRecipes();
        }
    }

    // Fallback recipes for when API is not available
    function getFallbackRecipes() {
        console.log('🍳 Loading fallback recipes with image utilities...');
        return [
            {
                id: 1,
                title: "Sample Pasta Recipe",
                name: "Quick Pasta",
                description: "A delicious and quick pasta recipe perfect for any meal.",
                image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop",
                time: "20",
                calories: "350",
                servings: "4",
                contributor: { 
                    username: "ChopSmo Chef", 
                    basic_ingredients: "Available",
                    profile_photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                },
                ingredients: ["pasta", "tomato sauce", "garlic", "olive oil"],
                categories: [{ name: "Lunch" }],
                cuisines: [{ name: "Italian" }],
                tags: ["quick", "easy"]
            },
            {
                id: 2,
                title: "Sample Salad Recipe", 
                name: "Fresh Garden Salad",
                description: "A healthy and refreshing salad with fresh vegetables.",
                image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
                time: "10",
                calories: "150",
                servings: "2",
                contributor: { 
                    username: "Healthy Chef", 
                    basic_ingredients: "Available",
                    profile_photo: "https://images.unsplash.com/photo-1494790108755-2616b332c3d7?w=100&h=100&fit=crop&crop=face"
                },
                ingredients: ["lettuce", "tomatoes", "cucumber", "dressing"],
                categories: [{ name: "Vegetarian" }],
                cuisines: [{ name: "American" }],
                tags: ["healthy", "vegetarian"]
            },
            {
                id: 3,
                title: "Sample Soup Recipe",
                name: "Hearty Vegetable Soup",
                description: "A warming and nutritious soup packed with vegetables.",
                image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
                time: "30",
                calories: "200",
                servings: "6",
                contributor: { 
                    username: "Soup Master", 
                    basic_ingredients: "Available",
                    profile_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                },
                ingredients: ["carrots", "celery", "onions", "vegetable broth"],
                categories: [{ name: "Dinner" }],
                cuisines: [{ name: "Cameroonian" }],
                tags: ["healthy", "comfort food"]
            }
        ];
    }    // Display recipes (updated to show contributor info and profile photo)
    function displayRecipes(recipes) {
        if (!recipesGrid) {
            console.error('Recipes grid element not found');
            return;
        }
        
        recipesGrid.innerHTML = '';
        
        if (!recipes || recipes.length === 0) {
            console.log('🔄 No recipes found, showing fallback recipes...');
            // Instead of showing "no results", show fallback recipes
            const fallbackRecipes = getFallbackRecipes();
            recipesGrid.innerHTML = '';
            
            // Add a notice that these are sample recipes
            const noticeDiv = document.createElement('div');
            noticeDiv.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 20px; background: rgba(255,193,7,0.1); border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #ffc107;';
            noticeDiv.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #e65100; font-weight: 600;">
                    <i class="fas fa-info-circle"></i>
                    <span>Sample recipes shown - backend may be offline</span>
                </div>
            `;
            recipesGrid.appendChild(noticeDiv);
            
            // Display fallback recipes
            fallbackRecipes.forEach(recipe => {
                const recipeImageUrl = getRecipeImageUrl(recipe);
                const profileImageUrl = getProfileImageUrl(recipe.contributor);
                
                const recipeCard = document.createElement('div');
                recipeCard.className = 'recipe-card';
                recipeCard.style.cursor = 'pointer';
                recipeCard.onclick = () => showToast('This is a sample recipe. Backend may be offline.', '#ff9800');
                recipeCard.innerHTML = `
                    <div class="recipe-image" style="background-image: url('${recipeImageUrl}'); background-size: cover; background-position: center;">
                        <span class="favorite-btn" onclick="event.stopPropagation(); showToast('Sample recipe - favorites not available', '#ff9800');">
                            <i class="far fa-heart"></i>
                        </span>
                        ${recipe.tags && recipe.tags.includes('vegetarian') ? '<span class="recipe-badge">Vegetarian</span>' : ''}
                    </div>
                    <div class="recipe-content">
                        <div class="contributor-info" style="display:flex;align-items:center;margin-bottom:8px;">
                            ${createImageWithFallback(
                                profileImageUrl, 
                                'Profile', 
                                'width:32px;height:32px;border-radius:50%;object-fit:cover;margin-right:8px;',
                                DEFAULT_PROFILE_IMAGE
                            )}
                            <div>
                                <div style="font-weight:600;font-size:14px;">${recipe.contributor.username}</div>
                                <div style="font-size:12px;color:#888;">${recipe.contributor.basic_ingredients}</div>
                            </div>
                        </div>
                        <h3>${recipe.title}</h3>
                        <div class="recipe-meta">
                            <span><i class="fas fa-clock"></i> ${recipe.time} mins</span>
                            <span><i class="fas fa-fire"></i> ${recipe.calories} kcal</span>
                            <span><i class="fas fa-utensils"></i> ${recipe.servings} servings</span>
                        </div>
                        <p class="recipe-description">${recipe.description}</p>
                        <div class="recipe-actions" onclick="event.stopPropagation();">
                            <button class="btn btn-primary btn-view" onclick="showToast('Sample recipe - full view not available', '#ff9800');">
                                <i class="fas fa-eye"></i> View Recipe
                            </button>
                            <button class="btn btn-secondary" onclick="showToast('Sample recipe - saving not available', '#ff9800');">
                                <i class="fas fa-bookmark"></i> Save
                            </button>
                        </div>
                    </div>
                `;
                recipesGrid.appendChild(recipeCard);
            });
            
            // Handle image loading errors for fallback recipes
            handleImagesAfterLoad();
            return;
        }
        recipes.forEach(recipe => {
            let contributorHtml = '';
            if (recipe.contributor) {
                const profileImageUrl = getProfileImageUrl(recipe.contributor);
                contributorHtml = `
                    <div class="contributor-info" style="display:flex;align-items:center;margin-bottom:8px;">
                        ${createImageWithFallback(
                            profileImageUrl, 
                            'Profile', 
                            'width:32px;height:32px;border-radius:50%;object-fit:cover;margin-right:8px;',
                            DEFAULT_PROFILE_IMAGE
                        )}
                        <div>
                            <div style="font-weight:600;font-size:14px;">${recipe.contributor.username || 'Unknown Chef'}</div>
                            <div style="font-size:12px;color:#888;">${recipe.contributor.basic_ingredients || 'Ingredients Available'}</div>
                        </div>
                    </div>
                `;
            }

            const recipeImageUrl = getRecipeImageUrl(recipe);
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            recipeCard.style.cursor = 'pointer';
            recipeCard.onclick = () => window.location.href = `recipe-detail.html?id=${recipe.id}`;
            recipeCard.innerHTML = `
                <div class="recipe-image" style="background-image: url('${recipeImageUrl}'); background-size: cover; background-position: center;">
                    <span class="favorite-btn ${recipe.favorited ? 'favorited' : ''}" onclick="event.stopPropagation();">
                        <i class="${recipe.favorited ? 'fas' : 'far'} fa-heart"></i>
                    </span>
                    ${recipe.tags && recipe.tags.includes('vegetarian') ? '<span class="recipe-badge">Vegetarian</span>' : ''}
                </div>
                <div class="recipe-content">
                    ${contributorHtml}
                    <h3><a href="recipe-detail.html?id=${recipe.id}" style="color:inherit;text-decoration:none;">${recipe.title || recipe.name || 'Untitled Recipe'}</a></h3>
                    <div class="recipe-meta">
                        <span><i class="fas fa-clock"></i> ${recipe.time || '30'} mins</span>
                        <span><i class="fas fa-fire"></i> ${recipe.calories || '250'} kcal</span>
                        <span><i class="fas fa-utensils"></i> ${recipe.servings || '4'} servings</span>
                    </div>
                    <p class="recipe-description">${recipe.description || 'A delicious recipe waiting to be discovered.'}</p>                    <div class="recipe-actions" onclick="event.stopPropagation();">
                        <a href="recipe-detail.html?id=${recipe.id}" class="btn btn-primary btn-view">
                            <i class="fas fa-eye"></i>
                            <span>View Recipe</span>
                        </a>
                        <button class="btn btn-secondary btn-add-plan" data-recipe-id="${recipe.id}">
                            <i class="fas fa-calendar-plus"></i>
                            <span>Add to Plan</span>
                        </button>
                    </div>
                </div>
            `;
            recipesGrid.appendChild(recipeCard);
        });
        
        // Handle image loading errors after content is added
        handleImagesAfterLoad();
        
        // Reattach event listeners to new elements
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', toggleFavorite);
        });
        
        document.querySelectorAll('.btn-add-plan').forEach(btn => {
            btn.addEventListener('click', addToMealPlan);
        });
    }

    // Toggle favorite status
    function toggleFavorite() {
        const heartIcon = this.querySelector('i');
        if (heartIcon.classList.contains('far')) {
            heartIcon.classList.remove('far');
            heartIcon.classList.add('fas');
            this.classList.add('favorited');
            // In a real app, you would save this to the user's favorites
        } else {
            heartIcon.classList.remove('fas');
            heartIcon.classList.add('far');
            this.classList.remove('favorited');
            // In a real app, you would remove from favorites
        }
    }

    // Add recipe to meal plan
    function addToMealPlan() {
        const recipeId = this.dataset.recipeId;
        const recipe = recipeData.find(r => r.id === parseInt(recipeId));
        showToast(`Added "${recipe.title}" to your meal plan!`);
        // In a real app, you would add this to the user's meal plan
    }    // Filter recipes by tag
    function filterByTag(tag) {
        // Extract text without icons by removing icon elements
        const cleanTag = tag.replace(/.*?\s+/, '').trim(); // Remove icon and extra spaces
        
        if (cleanTag === 'All') {
            displayRecipes(recipeData);
            return;
        }
        
        const filteredRecipes = recipeData.filter(recipe => {
            // Check various properties for matches
            const matchesCategory = recipe.categories && recipe.categories.some(cat => 
                cat.name && cat.name.toLowerCase().includes(cleanTag.toLowerCase())
            );
            const matchesCuisine = recipe.cuisines && recipe.cuisines.some(cuisine => 
                cuisine.name && cuisine.name.toLowerCase().includes(cleanTag.toLowerCase())
            );
            const matchesTags = recipe.tags && recipe.tags.some(tag => 
                typeof tag === 'string' ? tag.toLowerCase().includes(cleanTag.toLowerCase()) : 
                (tag.name && tag.name.toLowerCase().includes(cleanTag.toLowerCase()))
            );
            const matchesTitle = recipe.title && recipe.title.toLowerCase().includes(cleanTag.toLowerCase());
            const matchesDescription = recipe.description && recipe.description.toLowerCase().includes(cleanTag.toLowerCase());
            
            // Special cases
            if (cleanTag.toLowerCase() === 'quick meals') {
                return recipe.prep_time && recipe.prep_time <= 30;
            }
            if (cleanTag.toLowerCase() === 'vegetarian') {
                return matchesTags || matchesCategory || 
                       (recipe.title && recipe.title.toLowerCase().includes('vegetarian')) ||
                       (recipe.description && recipe.description.toLowerCase().includes('vegetarian'));
            }
            
            return matchesCategory || matchesCuisine || matchesTags || matchesTitle || matchesDescription;
        });
        
        displayRecipes(filteredRecipes);
    }    // Search recipes
    function searchRecipes() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (!searchTerm) {
            displayRecipes(allRecipes);
            resetFilters();
            return;
        }
        
        // Defensive: ensure recipeData is up-to-date
        if (!Array.isArray(allRecipes) || allRecipes.length === 0) {
            fetchRecipes().then(recipes => {
                allRecipes = recipes;
                recipeData = recipes;
                performSearch(searchTerm);
            });
            return;
        }
        
        performSearch(searchTerm);
    }
    
    function performSearch(searchTerm) {
        const results = allRecipes.filter(recipe => {
            // Search in title
            const matchesTitle = recipe.title && recipe.title.toLowerCase().includes(searchTerm);
            
            // Search in description
            const matchesDescription = recipe.description && recipe.description.toLowerCase().includes(searchTerm);
            
            // Search in ingredients
            const matchesIngredients = recipe.ingredients && recipe.ingredients.some(ingredient => {
                if (typeof ingredient === 'string') {
                    return ingredient.toLowerCase().includes(searchTerm);
                }
                // Handle complex ingredient objects
                const ingredientName = ingredient.ingredient?.name || 
                                     ingredient.ingredient?.ingredient_name ||
                                     ingredient.ingredient_name || 
                                     ingredient.name || 
                                     ingredient.item || '';
                return ingredientName.toLowerCase().includes(searchTerm);
            });
            
            // Search in categories
            const matchesCategories = recipe.categories && recipe.categories.some(category => 
                category.name && category.name.toLowerCase().includes(searchTerm)
            );
            
            // Search in cuisines
            const matchesCuisines = recipe.cuisines && recipe.cuisines.some(cuisine => 
                cuisine.name && cuisine.name.toLowerCase().includes(searchTerm)
            );
            
            // Search in tags
            const matchesTags = recipe.tags && recipe.tags.some(tag => {
                if (typeof tag === 'string') {
                    return tag.toLowerCase().includes(searchTerm);
                }
                return tag.name && tag.name.toLowerCase().includes(searchTerm);
            });
            
            // Search in contributor name
            const matchesContributor = recipe.contributor && recipe.contributor.username && 
                                     recipe.contributor.username.toLowerCase().includes(searchTerm);
            
            return matchesTitle || matchesDescription || matchesIngredients || 
                   matchesCategories || matchesCuisines || matchesTags || matchesContributor;
        });
        
        recipeData = results;
        displayRecipes(results);
        
        // Show search results message
        if (results.length === 0) {
            showToast(`No recipes found for "${searchTerm}". Try a different search term.`, '#ff9800');
        } else {
            showToast(`Found ${results.length} recipe${results.length === 1 ? '' : 's'} for "${searchTerm}"`, '#4CAF50');
        }
    }
    
    // Reset filters to show all recipes
    function resetFilters() {
        // Reset active filter tag
        filterTags.forEach(tag => {
            tag.classList.remove('active');
            if (tag.textContent.trim().includes('All')) {
                tag.classList.add('active');
            }
        });
        recipeData = [...allRecipes];
    }
    
    // Clear search function
    function clearSearch() {
        if (searchInput) {
            searchInput.value = '';
        }
        recipeData = [...allRecipes];
        displayRecipes(allRecipes);
        resetFilters();
        showToast('Search cleared', '#4CAF50');
    }

    // ======= SIMPLIFIED MODAL LOGIC (MAIN IMPLEMENTATION) =======
    
    // Get modal elements
    const openCreateRecipeModalBtn = document.getElementById('openCreateRecipeModal');
    const createRecipeModal = document.getElementById('createRecipeModal');
    const closeCreateRecipeModalBtn = document.getElementById('closeCreateRecipeModal');
    const createRecipeForm = document.getElementById('createRecipeForm');

    // Debug: Check if all elements exist
    console.log('🔍 Checking modal elements...');
    console.log('📍 Open button:', openCreateRecipeModalBtn);
    console.log('📍 Modal:', createRecipeModal);
    console.log('📍 Close button:', closeCreateRecipeModalBtn);
    console.log('📍 Form:', createRecipeForm);

    // Simple modal open function
    function openModal() {
        console.log('🔓 Opening modal...');
        if (createRecipeModal) {
            createRecipeModal.style.display = 'flex';
            console.log('✅ Modal display set to flex');
            // Initialize form components
            initializeIngredientForm();
            initializeDropdowns();
        } else {
            console.error('❌ Modal element not found');
        }
    }

    // Simple modal close function
    function closeModal() {
        console.log('🔒 Closing modal...');
        if (createRecipeModal) {
            createRecipeModal.style.display = 'none';
            console.log('✅ Modal closed');
        }
    }

    // Set up event listeners
    if (openCreateRecipeModalBtn) {
        console.log('✅ Setting up simplified modal button click handler...');
        openCreateRecipeModalBtn.addEventListener('click', function(event) {
            console.log('🔵 Create Recipe button clicked (simplified handler)');
            event.preventDefault();
            event.stopPropagation();
            
            // Check for auth token (simplified check)
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.log('❌ No auth token - please log in');
                showToast('Please log in to create recipes.', '#f44336');
                return;
            }
            
            console.log('✅ Auth token present, opening modal...');
            openModal();
        });
    } else {
        console.error('❌ Create Recipe button not found!');
    }

    // Close modal events
    if (closeCreateRecipeModalBtn) {
        closeCreateRecipeModalBtn.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside
    if (createRecipeModal) {
        createRecipeModal.addEventListener('click', function(event) {
            if (event.target === createRecipeModal) {
                closeModal();
            }
        });
    }

    // ======= DEBUGGING AND TESTING FUNCTIONS =======
    
    // Add debugging functions for testing modal and auth
    window.debugAuth = function() {
        const token = localStorage.getItem('authToken');
        console.log('🔍 Current auth token:', token ? 'Present' : 'Missing');
        console.log('🔍 Token value:', token);
    };
    
    window.setTestAuth = function() {
        localStorage.setItem('authToken', 'test-token-123');
        console.log('✅ Test auth token set');
    };
    
    window.clearAuth = function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        console.log('🧹 Auth tokens cleared');
    };

    // Add a simple test function to force open modal (for debugging)
    window.testOpenModal = function() {
        console.log('🧪 Test: Force opening modal...');
        openModal();
    };
    
    // Add a simple synchronous test (bypass authentication for testing)
    window.testOpenModalSync = function() {
        console.log('🧪 Sync Test: Opening modal without auth check...');
        if (createRecipeModal) {
            createRecipeModal.style.display = 'flex';
            console.log('� Modal display style set to:', createRecipeModal.style.display);
            console.log('🔍 Modal computed display:', getComputedStyle(createRecipeModal).display);
            initializeIngredientForm();
            initializeDropdowns();
        }
    };

    // ======= ADVANCED USER VERIFICATION (KEPT FOR FUTURE USE) =======

    // Ingredient management functions
    function createIngredientRow(name = '', quantity = '', unit = '', preparation = '') {
        const row = document.createElement('div');
        row.className = 'ingredient-row';
        row.style = 'display:flex;gap:8px;margin-bottom:6px;align-items:center;';
        row.innerHTML = `
            <input type="text" class="ingredient-name" placeholder="Name" value="${name}" style="flex:2;padding:7px 8px;border-radius:4px;border:1px solid #ccc;" required>
            <input type="text" class="ingredient-quantity" placeholder="Qty" value="${quantity}" style="width:60px;padding:7px 8px;border-radius:4px;border:1px solid #ccc;" required>
            <input type="text" class="ingredient-unit" placeholder="Unit" value="${unit}" style="width:60px;padding:7px 8px;border-radius:4px;border:1px solid #ccc;" required>
            <input type="text" class="ingredient-preparation" placeholder="Prep (optional)" value="${preparation}" style="flex:1;padding:7px 8px;border-radius:4px;border:1px solid #ccc;" title="e.g. diced, chopped, minced">
            <button type="button" class="remove-ingredient-btn" style="background:#ffdddd;color:#c00;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:15px;">&times;</button>
        `;
        row.querySelector('.remove-ingredient-btn').onclick = () => {
            row.remove();
            // Ensure at least one ingredient row remains
            const ingredientsList = document.getElementById('ingredientsList');
            if (ingredientsList && ingredientsList.children.length === 0) {
                addIngredientRow();
            }
        };
        return row;
    }

    function addIngredientRow(name = '', quantity = '', unit = '', preparation = '') {
        const ingredientsList = document.getElementById('ingredientsList');
        if (ingredientsList) {
            ingredientsList.appendChild(createIngredientRow(name, quantity, unit, preparation));
        }
    }

    // Initialize ingredient functionality
    function initializeIngredientForm() {
        const addIngredientBtn = document.getElementById('addIngredientBtn');
        const ingredientsList = document.getElementById('ingredientsList');
        
        if (addIngredientBtn && ingredientsList) {
            addIngredientBtn.onclick = () => addIngredientRow();
            
            // Clear and add one default row
            ingredientsList.innerHTML = '';
            addIngredientRow();
        }
    }

    // Professional modal for not verified contributors (simplified for now)
    function showNotVerifiedModal() {
        showToast('Recipe creation is temporarily disabled. Please try again later.', '#f44336');
    }

    // ======= FORM SUBMISSION AND API INTEGRATION =======

    // --- Global Loading Spinner & Toasts ---
    // Ensure these elements exist in your HTML (e.g., Recipes.html, Login.html)
    // with the IDs 'loadingSpinner' and 'toastMessage' and appropriate base styles.
    const spinner = document.getElementById('loadingSpinner');
    const toast = document.getElementById('toastMessage');

function showSpinner() { if(spinner) spinner.style.display = 'block'; }
function hideSpinner() { if(spinner) spinner.style.display = 'none'; }
function showToast(msg, color = null) {
    if (!toast) return; // Guard clause if toast element isn't found
    toast.textContent = msg;
    toast.style.display = 'block';
    if (color) toast.style.background = color;
    else toast.style.background = 'var(--primary)';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// Patch all fetches to show/hide spinner and show toasts on error
async function fetchWithSpinnerToast(url, options, successMsg = null, errorMsg = null) {
    showSpinner();
    try {
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));
        hideSpinner();
        if (!response.ok) {
            showToast(errorMsg || (data.detail || 'An error occurred.'), '#f44336');
            throw data;
        }
        if (successMsg) showToast(successMsg);
        return data;
    } catch (err) {
        hideSpinner();
        showToast(errorMsg || 'Network error.', '#f44336');
        throw err;
    }
}

    // Helper: Show error message under a field
    function showFieldError(fieldId, message) {
        let err = document.getElementById(fieldId + 'Error');
        if (!err) {
            err = document.createElement('div');
            err.id = fieldId + 'Error';
            err.className = 'error-message';
            err.style = 'color:#f44336;font-size:13px;margin-top:4px;';
            document.getElementById(fieldId).parentNode.appendChild(err);
        }
        err.textContent = message;
        err.style.display = 'block';
    }
    function clearFieldError(fieldId) {
        const err = document.getElementById(fieldId + 'Error');
        if (err) err.style.display = 'none';
    }

    if (createRecipeForm) {
        createRecipeForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Remove previous error messages
            ['recipeTitle','recipeName','recipeDescription','recipeIngredients','recipeInstructions','recipeCategories','recipeCuisines','recipeTags'].forEach(clearFieldError);
            const token = localStorage.getItem('authToken');
            if (!token) {
                showToast('You must be logged in to create a recipe.', '#f44336');
                return;
            }
            const title = document.getElementById('recipeTitle')?.value.trim() || '';
            const name = document.getElementById('recipeName')?.value.trim() || '';
            const description = document.getElementById('recipeDescription')?.value.trim() || '';
            const instructions = document.getElementById('recipeInstructions')?.value.trim() || '';
            const imageInput = document.getElementById('recipeImage');
            // Optional fields: get selected values from dropdowns
            const categoriesSelect = document.getElementById('recipeCategories');
            const cuisinesSelect = document.getElementById('recipeCuisines');
            const tagsSelect = document.getElementById('recipeTags');
            const categories = Array.from(categoriesSelect?.selectedOptions || []).map(opt => opt.value);
            const cuisines = Array.from(cuisinesSelect?.selectedOptions || []).map(opt => opt.value);
            const tags = Array.from(tagsSelect?.selectedOptions || []).map(opt => opt.value);            // --- Collect ingredients from dynamic rows ---
            const ingredientRows = document.querySelectorAll('#ingredientsList .ingredient-row');
            let ingredientsArr = [];
            let ingredientError = '';
            
            ingredientRows.forEach((row, index) => {
                const ingName = row.querySelector('.ingredient-name')?.value.trim();
                const ingQty = row.querySelector('.ingredient-quantity')?.value.trim();
                const ingUnit = row.querySelector('.ingredient-unit')?.value.trim();
                const ingPrep = row.querySelector('.ingredient-preparation')?.value.trim() || '';
                
                if (!ingName || !ingQty || !ingUnit) {
                    ingredientError = `Ingredient ${index + 1}: Name, quantity, and unit are required.`;
                    return;
                }
                
                // Validate quantity is a positive number
                const parsedQty = parseFloat(ingQty);
                if (isNaN(parsedQty) || parsedQty <= 0) {
                    ingredientError = `Ingredient ${index + 1}: Quantity must be a positive number.`;
                    return;
                }
                
                // Validate name length
                if (ingName.length < 2) {
                    ingredientError = `Ingredient ${index + 1}: Name must be at least 2 characters.`;
                    return;
                }
                
                ingredientsArr.push({
                    ingredient_name: ingName, 
                    quantity: parsedQty, // Store as number
                    unit: ingUnit,
                    preparation: ingPrep
                });
            });
            
            if (ingredientRows.length === 0 || ingredientsArr.length === 0) {
                ingredientError = 'At least one ingredient is required.';
            }
            
            if (ingredientError) {
                showFieldError('recipeIngredients', ingredientError);
                return;
            }

            // Frontend validation
            let isValid = true;
            
            // Title validation
            if (!title || title.length < 3) { 
                showFieldError('recipeTitle', 'Title must be at least 3 characters long.'); 
                isValid = false; 
            }
            
            // Name validation (if different from title)
            if (!name || name.length < 3) { 
                showFieldError('recipeName', 'Recipe name must be at least 3 characters long.'); 
                isValid = false; 
            }
            
            // Description validation
            if (!description || description.length < 10) { 
                showFieldError('recipeDescription', 'Description must be at least 10 characters long.'); 
                isValid = false; 
            }
            
            // Instructions validation
            if (!instructions || instructions.length < 20) { 
                showFieldError('recipeInstructions', 'Instructions must be at least 20 characters long and contain proper steps.'); 
                isValid = false; 
            }
            
            // Check if instructions contain actual steps
            if (instructions && !instructions.includes('Step') && instructions.split('.').length < 3) {
                showFieldError('recipeInstructions', 'Instructions should contain clear steps (use "Step 1:", "Step 2:" etc. or separate sentences).'); 
                isValid = false; 
            }
            
            if (!isValid) return;            // 🔧 Use FormData with CSRF token
            
            // Get CSRF token first
            let csrfToken;
            try {
                console.log('🔒 Getting CSRF token from /api/csrf-token/...');
                const csrfResponse = await fetch('https://njoya.pythonanywhere.com/api/csrf-token/', {
                    method: 'GET',
                    credentials: 'include'
                });
                
                console.log('🔒 CSRF response status:', csrfResponse.status);
                
                if (csrfResponse.ok) {
                    const csrfData = await csrfResponse.json();
                    csrfToken = csrfData.csrfToken;
                    console.log('🔒 CSRF token obtained:', csrfToken ? csrfToken.substring(0, 20) + '...' : 'null');
                } else {
                    console.error('🔒 CSRF endpoint failed:', csrfResponse.status, csrfResponse.statusText);
                    throw new Error(`Failed to get CSRF token: ${csrfResponse.status}`);
                }
            } catch (csrfError) {
                console.error('❌ CSRF token error:', csrfError);
                
                // Fallback: Try to get CSRF token from cookie
                console.log('🔒 Trying fallback: get CSRF from cookie...');
                csrfToken = getCookieValue('csrftoken');
                
                if (!csrfToken) {
                    // Alternative cookie names
                    csrfToken = getCookieValue('csrf_token') || getCookieValue('_token');
                }
                
                if (!csrfToken) {
                    console.error('❌ No CSRF token found in cookies either');
                    showToast('Failed to get security token. Please refresh the page and try again.', '#f44336');
                    return;
                } else {
                    console.log('🔒 CSRF token from cookie:', csrfToken.substring(0, 20) + '...');
                }
            }

            // Helper function to get cookie value
            function getCookieValue(name) {
                const cookies = document.cookie.split(';');
                for (let cookie of cookies) {
                    const [key, value] = cookie.trim().split('=');
                    if (key === name) {
                        return decodeURIComponent(value);
                    }
                }
                return null;
            }            // Build FormData
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('instructions', instructions);
            
            // Add CSRF token to FormData
            formData.append('csrfmiddlewaretoken', csrfToken);
            
            // Add ingredients with preparation field - try multiple formats
            console.log('🔍 Testing multiple ingredient formats...');
            
            // Format 1: Current format (JSON strings) - for compatibility
            ingredientsArr.forEach(ing => {
                const ingredientData = {
                    ingredient_name: ing.ingredient_name,
                    quantity: parseFloat(ing.quantity) || 1,
                    unit: ing.unit,
                    preparation: ing.preparation || ""
                };
                formData.append('ingredients', JSON.stringify(ingredientData));
            });
            
            // Format 2: Try ingredients_data as single JSON (common Django pattern)
            formData.append('ingredients_data', JSON.stringify(ingredientsArr.map(ing => ({
                ingredient_name: ing.ingredient_name,
                quantity: parseFloat(ing.quantity) || 1,
                unit: ing.unit,
                preparation: ing.preparation || ""
            }))));
            
            // Format 3: Try recipe_ingredients field
            formData.append('recipe_ingredients', JSON.stringify(ingredientsArr.map(ing => ({
                ingredient: {
                    name: ing.ingredient_name,
                    ingredient_name: ing.ingredient_name
                },
                quantity: parseFloat(ing.quantity) || 1,
                unit: ing.unit,
                preparation: ing.preparation || ""
            }))));
            
            // Add optional fields
            categories.forEach(val => formData.append('category_names', val));
            cuisines.forEach(val => formData.append('cuisine_names', val));
            tags.forEach(val => formData.append('tag_names', val));
            
            // Add image if present - use image_upload field name for uploads
            if (imageInput && imageInput.files[0]) {
                formData.append('image_upload', imageInput.files[0]);
            }            try {
                console.log('📤 Sending FormData with CSRF token...');
                console.log('🔒 Final CSRF token being sent:', csrfToken ? csrfToken.substring(0, 20) + '...' : 'null');
                
                // Get auth token for API request
                const token = localStorage.getItem('authToken');
                if (!token) {
                    console.error('❌ No authentication token found');
                    showToast('Please log in to create recipes', '#f44336');
                    return;
                }
                
                const requestHeaders = {
                    'Authorization': `Token ${token}`,
                    'X-CSRFToken': csrfToken,
                };
                
                console.log('📤 Request headers:', requestHeaders);
                console.log('📤 Request credentials: include');
                console.log('📤 FormData entries count:', Array.from(formData.entries()).length);
                
                const response = await fetch('https://njoya.pythonanywhere.com/api/recipes/', {
                    method: 'POST',
                    headers: requestHeaders,
                    credentials: 'include',
                    body: formData
                });

                let data;
                try {
                    data = await response.json();
                } catch (jsonError) {
                    console.error('❌ Failed to parse response JSON:', jsonError);
                    if (response.status === 404) {
                        showToast('API endpoint not found. Recipe creation is currently unavailable.', '#f44336');
                        return;
                    } else if (!response.ok) {
                        showToast(`Server error (${response.status}). Please try again later.`, '#f44336');
                        return;
                    }
                    // If response is ok but JSON parsing failed, try to get text
                    try {
                        const textResponse = await response.text();
                        console.error('❌ Raw response:', textResponse.substring(0, 500));
                        showToast('Server returned invalid response format', '#f44336');
                        return;
                    } catch (textError) {
                        console.error('❌ Failed to get response text:', textError);
                        showToast('Failed to process server response', '#f44336');
                        return;
                    }
                }

                if (!response.ok) {                    console.error('❌ Recipe creation failed:', {
                        status: response.status,
                        statusText: response.statusText,
                        responseData: data,
                        url: response.url
                    });

                    // Enhanced debugging for 400 errors
                    if (response.status === 400) {
                        console.error('🔍 400 Bad Request - Detailed Analysis:');
                        console.error('📋 Full response data:', JSON.stringify(data, null, 2));
                        
                        // Check for common 400 error causes
                        if (data && typeof data === 'object') {
                            Object.keys(data).forEach(key => {
                                console.error(`  ❌ Field '${key}':`, data[key]);
                            });
                        }
                    }

                    // Log the FormData that was sent for debugging
                    console.log('📤 FormData sent:');
                    for (let [key, value] of formData.entries()) {
                        console.log(`${key}:`, typeof value === 'string' ? value.substring(0, 100) : value);
                    }

                    // Show field errors professionally
                    if (typeof data === 'object' && data !== null) {
                        let hasFieldErrors = false;
                        for (const [field, errors] of Object.entries(data)) {
                            let fieldId = null;
                            if (field === 'name') fieldId = 'recipeName';
                            else if (field === 'description') fieldId = 'recipeDescription';
                            else if (field === 'ingredients') fieldId = 'recipeIngredients';
                            else if (field === 'instructions') fieldId = 'recipeInstructions';
                            else if (field === 'title') fieldId = 'recipeTitle';
                            else if (field === 'categories') fieldId = 'recipeCategories';
                            else if (field === 'cuisines') fieldId = 'recipeCuisines';
                            else if (field === 'tags') fieldId = 'recipeTags';
                            
                            if (fieldId && document.getElementById(fieldId)) {
                                showFieldError(fieldId, Array.isArray(errors) ? errors.join(' ') : errors);
                                hasFieldErrors = true;
                            } else {
                                console.warn(`🔍 Unhandled field error: ${field}:`, errors);
                            }
                        }

                        // Show general error if no field-specific errors were shown
                        if (!hasFieldErrors) {
                            let errorMsg = `Failed to create recipe (${response.status})`;
                            if (data.detail) errorMsg = data.detail;
                            else if (data.message) errorMsg = data.message;
                            else if (data.non_field_errors) errorMsg = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(' ') : data.non_field_errors;
                            else if (typeof data === 'string' && data.length < 200) errorMsg = data;
                            
                            showToast(errorMsg, '#f44336');
                        }
                    } else {
                        showToast(`Failed to create recipe (${response.status}: ${response.statusText})`, '#f44336');
                    }
                    return;
                }
                showToast('Recipe created successfully!');
                createRecipeModal.style.display = 'none';
                fetchRecipes().then(newRecipes => { recipeData = newRecipes; displayRecipes(recipeData); });
                createRecipeForm.reset();
                // Reinitialize the form components
                initializeIngredientForm();
                initializeDropdowns();
            } catch (error) {
                alert('Network error. Please try again later.');
                showToast('Network error. Please try again later.', '#f44336');
            }
        });
    }    // Event listeners
    if (searchButton) {
        searchButton.addEventListener('click', searchRecipes);
    }
    
    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', clearSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchRecipes();
        });
        
        // Show/hide clear button based on input
        searchInput.addEventListener('input', function() {
            if (clearSearchButton) {
                if (this.value.trim()) {
                    clearSearchButton.style.display = 'block';
                } else {
                    clearSearchButton.style.display = 'none';
                    // Auto-clear search when input is empty
                    if (recipeData.length !== allRecipes.length) {
                        clearSearch();
                    }
                }
            }
        });
    }
    
    filterTags.forEach(tag => {
        tag.addEventListener('click', function() {
            filterTags.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            // Extract text content without icon
            const tagText = this.textContent.trim();
            filterByTag(tagText);
        });
    });
    
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', toggleFavorite);
    });
    
    document.querySelectorAll('.btn-add-plan').forEach(btn => {
        btn.addEventListener('click', addToMealPlan);
    });

    // Initial load: fetch from backend
    fetchRecipes().then(recipes => {
        recipeData = recipes;
        allRecipes = [...recipes]; // Keep original copy
        displayRecipes(recipeData);
        
        // Initialize global image error handling
        setTimeout(() => {
            addGlobalImageErrorHandling();
        }, 1000);
    }).catch(error => {
        console.error('❌ Initial fetch failed:', error);
        // Display fallback recipes
        displayRecipes([]);
    });
    
    // Dropdown/autocomplete functionality for categories, cuisines, tags
    const categoryOptions = ["Breakfast", "Lunch", "Dinner", "Snacks", "Vegetarian", "Quick Meals", "High Protein", "Budget Friendly", "Dessert", "Vegan"];
    const cuisineOptions = ["Italian", "Mexican", "Cameroonian", "French", "Indian", "Chinese", "American", "Thai", "Moroccan", "Greek"];
    const tagOptions = ["spicy", "quick", "gluten-free", "low-carb", "dairy-free", "nut-free", "family", "kids", "holiday", "comfort food"];

    function populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '';
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            select.appendChild(option);
        });
    }

    function setupAutocomplete(inputId, selectId, options) {
        const input = document.getElementById(inputId);
        const select = document.getElementById(selectId);
        if (!input || !select) return;
        input.addEventListener('input', function() {
            const filter = input.value.toLowerCase();
            select.innerHTML = '';
            options.filter(opt => opt.toLowerCase().includes(filter)).forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                select.appendChild(option);
            });
        });
    }

    function initializeDropdowns() {
        populateSelect('recipeCategories', categoryOptions);
        populateSelect('recipeCuisines', cuisineOptions);
        populateSelect('recipeTags', tagOptions);

        setupAutocomplete('categoryAutocomplete', 'recipeCategories', categoryOptions);
        setupAutocomplete('cuisineAutocomplete', 'recipeCuisines', cuisineOptions);
        setupAutocomplete('tagAutocomplete', 'recipeTags', tagOptions);
    }

    // Initialize dropdowns on page load
    initializeDropdowns();
});