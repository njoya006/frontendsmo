document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Recipes.js loaded successfully with image fallback utilities!');
    // Global variables
    let recipeData = [];
    let allRecipes = []; // Keep original data for reset

    // ======= TOAST NOTIFICATION SYSTEM =======
    
    function showToast(message, backgroundColor = '#333') {
        console.log('🔔 Toast:', message);
        
        // Remove any existing toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        
        // Style the toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '100px',
            right: '20px',
            backgroundColor: backgroundColor,
            color: 'white',
            padding: '15px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: '10000',
            fontSize: '16px',
            fontWeight: '500',
            maxWidth: '400px',
            wordWrap: 'break-word',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
            opacity: '0'
        });
        
        // Add toast to page
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
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
        console.log('🎯 getRecipeImageUrl called with recipe:', recipe);
        // Since backend now returns full URLs in the 'image' field, use it directly
        const imageUrl = recipe.image;
        console.log('🔍 Recipe image data:', {
            recipeId: recipe.id,
            title: recipe.title,
            image: recipe.image,
            imageType: typeof recipe.image,
            imageLength: recipe.image ? recipe.image.length : 0,
            startsWithHttp: recipe.image ? recipe.image.startsWith('http') : false
        });
        
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
            console.log('✅ Using full backend URL:', imageUrl);
            return imageUrl;
        }
        
        console.log('🔄 No valid image URL found, using fallback. Reason:', {
            imageUrl,
            hasImage: !!imageUrl,
            isString: typeof imageUrl === 'string',
            startsWithHttp: imageUrl ? imageUrl.startsWith('http') : false
        });
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
                    // element.style.backgroundImage = `url('${DEFAULT_RECIPE_IMAGE}')`;  // DISABLED to preserve backend images
                }
                element.dataset.errorHandled = 'true';
            }
        });
    }
    
    // Call image error handling after content is loaded - DISABLED background replacement
    function handleImagesAfterLoad() {
        setTimeout(() => {
            // Only handle <img> tags, not background images for now
            document.querySelectorAll('img').forEach(img => {
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
            console.log('🔍 Raw API Response:', data);
            console.log('🔍 Total recipes fetched:', data.length);
            console.log('🔍 First recipe complete object:', JSON.stringify(data[0], null, 2));
            if (data[0]) {
                console.log('🔍 First recipe image field:', data[0].image);
                console.log('🔍 First recipe image type:', typeof data[0].image);
                console.log('🔍 First recipe all fields:', Object.keys(data[0]));
            }
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
                recipeCard.onclick = () => showToast('This is a sample recipe. Backend may be offline.', '#FF9800');
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
    }    // Enhanced search recipes with API integration
    function searchRecipes() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        console.log('🔍 Recipe search initiated for:', searchTerm);
        
        // Enhanced debugging for search
        console.log('🔍 Search initiated:', {
            searchTerm: searchTerm,
            searchTermLength: searchTerm.length,
            allRecipesLength: allRecipes.length,
            recipeDataLength: recipeData.length,
            searchInputValue: searchInput?.value,
            timestamp: new Date().toLocaleTimeString()
        });
        
        if (!searchTerm) {
            console.log('📋 Empty search, showing all recipes');
            recipeData = [...allRecipes];
            displayRecipes(allRecipes);
            resetFilters();
            clearSearchButton.style.display = 'none';
            return;
        }
        
        // Show clear search button
        clearSearchButton.style.display = 'inline-block';
        
        // Update search button to show searching state
        const searchButton = document.getElementById('searchRecipes');
        if (searchButton) {
            searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            searchButton.disabled = true;
        }
        
        // Show loading state
        const recipesGrid = document.querySelector('.recipes-grid');
        if (recipesGrid) {
            recipesGrid.innerHTML = '<div class="loading-search" style="grid-column: 1 / -1; text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 50px; color: #ff6b35; margin-bottom: 20px;"></i><h3>Searching recipes...</h3></div>';
        }
        
        // Try local search first (more reliable), then API search as enhancement 
        performLocalSearch(searchTerm);
        
        // Reset search button after a delay
        setTimeout(() => {
            if (searchButton) {
                searchButton.innerHTML = '<i class="fas fa-search"></i>';
                searchButton.disabled = false;
            }
        }, 1000);
    }
    
    async function performSimpleAPISearch(searchTerm) {
        try {
            console.log('🌐 Trying API search for additional results...');
            
            // Try different search parameter names that Django might use
            const searchParams = new URLSearchParams();
            searchParams.append('search', searchTerm);
            
            const searchUrl = `https://njoya.pythonanywhere.com/api/recipes/?${searchParams.toString()}`;
            console.log('🔍 API search URL:', searchUrl);
            
            const response = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('authToken') && {
                        'Authorization': `Token ${localStorage.getItem('authToken')}`
                    })
                }
            });
            
            if (!response.ok) {
                console.log(`⚠️ API search returned ${response.status}, skipping API enhancement`);
                return [];
            }
            
            const data = await response.json();
            console.log('📝 API search response:', data);
            
            // Handle both paginated and direct results
            const results = data.results || data;
            
            if (!Array.isArray(results)) {
                console.log('⚠️ Unexpected API response format, skipping API enhancement');
                return [];
            }
            
            console.log(`✅ API search found ${results.length} additional results`);
            return results;
            
        } catch (error) {
            console.log('⚠️ API search failed, local search only:', error.message);
            return [];
        }
    }
    
    function performLocalSearch(searchTerm) {
        console.log('📋 Performing local search for:', searchTerm);
        
        // Ensure allRecipes is available
        if (!Array.isArray(allRecipes) || allRecipes.length === 0) {
            console.log('⚠️ No local recipes available, fetching from API...');
            fetchRecipes().then(recipes => {
                if (recipes && recipes.length > 0) {
                    allRecipes = recipes;
                    recipeData = recipes;
                    performLocalSearch(searchTerm);
                } else {
                    displaySearchError('Unable to load recipes for search');
                }
            }).catch(error => {
                console.error('❌ Error fetching recipes for search:', error);
                displaySearchError('Unable to load recipes for search');
            });
            return;
        }
        
        const searchTermLower = searchTerm.toLowerCase();
        
        const results = allRecipes.filter(recipe => {
            // Primary search: Recipe title/name (most important for recipe search)
            const title = (recipe.title || recipe.name || '').toLowerCase();
            if (title.includes(searchTermLower)) {
                console.log(`✅ Title match found: "${recipe.title}" contains "${searchTerm}"`);
                return true;
            }
            
            // Secondary search: Description
            const description = (recipe.description || '').toLowerCase();
            if (description.includes(searchTermLower)) {
                console.log(`✅ Description match found: "${recipe.title}"`);
                return true;
            }
            
            // Tertiary search: Basic ingredient search
            if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
                const ingredientMatch = recipe.ingredients.some(ingredient => {
                    // Handle string ingredients
                    if (typeof ingredient === 'string') {
                        return ingredient.toLowerCase().includes(searchTermLower);
                    }
                    // Handle object ingredients with various name fields
                    if (typeof ingredient === 'object' && ingredient !== null) {
                        const nameFields = [
                            ingredient.ingredient_name,
                            ingredient.ingredient,
                            ingredient.name,
                            ingredient.item
                        ];
                        
                        return nameFields.some(field => 
                            field && typeof field === 'string' && field.toLowerCase().includes(searchTermLower)
                        );
                    }
                    return false;
                });
                
                if (ingredientMatch) {
                    console.log(`✅ Ingredient match found: "${recipe.title}"`);
                    return true;
                }
            }
            
            // Additional searches: cuisine, meal type, contributor
            const additionalFields = [
                recipe.cuisine,
                recipe.meal_type,
                recipe.contributor?.username,
                recipe.contributor?.first_name,
                recipe.contributor?.last_name
            ];
            
            const additionalMatch = additionalFields.some(field => 
                field && typeof field === 'string' && field.toLowerCase().includes(searchTermLower)
            );
            
            if (additionalMatch) {
                console.log(`✅ Additional field match found: "${recipe.title}"`);
                return true;
            }
            
            return false;
        });
        
        console.log(`📊 Local search found ${results.length} results for "${searchTerm}"`);
        
        recipeData = results;
        displayRecipes(results);
        
        // Show appropriate message
        if (results.length === 0) {
            displaySearchError(`No recipes found for "${searchTerm}"`);
        } else {
            showToast(`Found ${results.length} recipe${results.length === 1 ? '' : 's'} matching "${searchTerm}"`, '#4CAF50');
        }
    }
    
    function displaySearchError(message) {
        const recipesGrid = document.querySelector('.recipes-grid');
        if (!recipesGrid) return;
        
        recipesGrid.innerHTML = `
            <div class="search-error" style="grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <i class="fas fa-search" style="font-size: 50px; color: #ccc; margin-bottom: 20px;"></i>
                <h3 style="color: #333; margin-bottom: 15px;">${message}</h3>
                <p style="color: #666; margin-bottom: 20px;">Try searching for:</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; text-align: left;">
                    <div>
                        <h4 style="color: #ff6b35; margin-bottom: 10px;">🍽️ Recipe Names</h4>
                        <ul style="color: #666; padding-left: 20px;">
                            <li>"Chicken Curry"</li>
                            <li>"Pasta Bolognese"</li>
                            <li>"Chocolate Cake"</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style="color: #ff6b35; margin-bottom: 10px;">🥗 Ingredients</h4>
                        <ul style="color: #666; padding-left: 20px;">
                            <li>"Chicken"</li>
                            <li>"Tomato"</li>
                            <li>"Rice"</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style="color: #ff6b35; margin-bottom: 10px;">🌍 Cuisines</h4>
                        <ul style="color: #666; padding-left: 20px;">
                            <li>"Italian"</li>
                            <li>"Mexican"</li>
                            <li>"Asian"</li>
                        </ul>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <button onclick="clearSearch()" style="margin-right: 10px; padding: 12px 24px; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        <i class="fas fa-times"></i> Clear Search
                    </button>
                    <button onclick="fetchRecipes().then(recipes => { allRecipes = recipes; recipeData = recipes; displayRecipes(recipes); })" style="padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        <i class="fas fa-refresh"></i> Reload All Recipes
                    </button>
                </div>
            </div>
        `;
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
    
    // Clear search function
    function clearSearch() {
        console.log('🧹 Clearing search');
        
        // Clear search input
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Hide clear button
        if (clearSearchButton) {
            clearSearchButton.style.display = 'none';
        }
        
        // Reset to all recipes
        recipeData = [...allRecipes];
        displayRecipes(allRecipes);
        resetFilters();
        
        // Show success message
        showToast('Search cleared - showing all recipes', '#4CAF50');
    }

    // Make clearSearch globally available for the error display
    window.clearSearch = clearSearch;

    // Event listeners
    const showAllRecipesButton = document.getElementById('showAllRecipes');
    
    if (searchButton) {
        searchButton.addEventListener('click', searchRecipes);
    }
    
    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', clearSearch);
    }
    
    if (showAllRecipesButton) {
        showAllRecipesButton.addEventListener('click', function() {
            console.log('🔄 Show All Recipes button clicked');
            clearSearch();
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
    
    // Initialize Create Recipe button based on user verification status
    initializeCreateRecipeButton();
    
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