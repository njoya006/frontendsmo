document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Recipes.js loaded successfully with image fallback utilities!');
    // Global variables
    let recipeData = [];
    let allRecipes = []; // Keep original data for reset
    let verificationCheckInterval = null; // For periodic checks
    let currentVerificationStatus = null; // Track current status

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
        
        console.log('🚀 === STARTING DATABASE RECIPE FETCH ===');
        console.log('� API URL: https://njoya.pythonanywhere.com/api/recipes/');
        console.log('🔍 Auth token present:', token ? 'YES (length: ' + token.length + ')' : 'NO');
        console.log('🔍 Browser online:', navigator.onLine);
        console.log('🔍 Current timestamp:', new Date().toISOString());
        
        try {
            console.log('🔄 Initializing fetch request to database API...');
            
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Token ${token}`;
                console.log('🔐 Added authorization header');
            }
            
            console.log('📡 Making fetch request...');
            const response = await fetch('https://njoya.pythonanywhere.com/api/recipes/', {
                method: 'GET',
                headers: headers,
                mode: 'cors' // Explicitly set CORS mode
            });
            
            console.log('📥 Fetch request completed!');
            
            console.log('🔍 Response status:', response.status);
            console.log('🔍 Response ok:', response.ok);
            console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                console.error(`❌ API response not ok: ${response.status} ${response.statusText}`);
                if (response.status === 404) {
                    console.error('❌ API endpoint not found - check if backend is deployed');
                } else if (response.status >= 500) {
                    console.error('❌ Server error - backend may be down');
                } else if (response.status === 403 || response.status === 401) {
                    console.error('❌ Authentication error - trying without token');
                    // Try again without token
                    const retryResponse = await fetch('https://njoya.pythonanywhere.com/api/recipes/', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        mode: 'cors'
                    });
                    if (retryResponse.ok) {
                        const retryData = await retryResponse.json();
                        console.log('✅ Retry successful without token');
                        return retryData;
                    }
                }
                console.warn('⚠️ API call failed, using fallback data');
                return getFallbackRecipes();
            }
            
            const data = await response.json();
            console.log('✅ Successfully fetched recipes from API');
            console.log('🔍 Raw API Response type:', typeof data);
            console.log('🔍 Raw API Response:', data);
            console.log('🔍 Total recipes fetched:', Array.isArray(data) ? data.length : 'Not an array');
            
            if (Array.isArray(data) && data.length > 0) {
                console.log('🔍 First recipe complete object:', JSON.stringify(data[0], null, 2));
                console.log('🔍 First recipe has contributor:', !!data[0].contributor);
                console.log('🔍 All recipe fields:', Object.keys(data[0]));
                
                // Don't filter by contributor if none have it - show all recipes
                const recipesWithContributor = data.filter(recipe => recipe.contributor);
                if (recipesWithContributor.length > 0) {
                    console.log(`🔍 Found ${recipesWithContributor.length} recipes with contributors out of ${data.length} total`);
                    return recipesWithContributor;
                } else {
                    console.log('⚠️ No recipes have contributor field - showing all recipes anyway');
                    return data;
                }
            } else if (Array.isArray(data)) {
                console.log('⚠️ API returned empty array - no recipes found');
                return getFallbackRecipes();
            } else {
                console.error('❌ API returned non-array data:', data);
                return getFallbackRecipes();
            }
            
        } catch (error) {
            console.error('🚨 === CRITICAL API FETCH ERROR ===');
            console.error('❌ Error type:', error.name);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            console.error('❌ Full error object:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                console.error('🔍 DIAGNOSIS: This is a network/CORS/connectivity error');
                console.error('🔍 Possible causes:');
                console.error('   1. Backend server is not running');
                console.error('   2. CORS headers not configured on backend');
                console.error('   3. Network connectivity issue');
                console.error('   4. Firewall/antivirus blocking the request');
                console.error('   5. Backend URL is incorrect or inaccessible');
            } else if (error.name === 'AbortError') {
                console.error('🔍 DIAGNOSIS: Request was aborted (timeout)');
            } else {
                console.error('🔍 DIAGNOSIS: Unknown error type');
            }
            
            console.warn('⚠️ FALLING BACK TO MOCK DATA DUE TO ERROR');
            console.log('🔄 === RETURNING FALLBACK RECIPES ===');
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
        const recipesGrid = document.getElementById('recipesGrid');
        if (!recipesGrid) {
            console.error('Recipes grid element not found - DOM might not be ready');
            console.log('Available elements:', document.querySelectorAll('[id*="recipe"]'));
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
                // Badge logic
                let badgeHtml = '';
                if (recipe.contributor.verified_badge) {
                    const badge = recipe.contributor.verified_badge;
                    badgeHtml = `<span class="verified-badge" style="color:${badge.color || '#2ecc40'}; margin-left:6px; font-size:13px; vertical-align:middle;">
                        ${badge.icon || '✅'} <span style="font-size:12px;">${badge.label || ''}</span>
                    </span>`;
                }
                contributorHtml = `
                    <div class="contributor-info" style="display:flex;align-items:center;margin-bottom:8px;">
                        ${createImageWithFallback(
                            profileImageUrl, 
                            'Profile', 
                            'width:32px;height:32px;border-radius:50%;object-fit:cover;margin-right:8px;',
                            DEFAULT_PROFILE_IMAGE
                        )}
                        <div>
                            <div style="font-weight:600;font-size:14px;display:flex;align-items:center;gap:4px;">
                                <span>${recipe.contributor.username || 'Unknown Chef'}</span>
                                ${badgeHtml}
                            </div>
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

    // Make search functions globally available for external access
    window.clearSearch = clearSearch;
    window.performApiSearch = performApiSearch;
    window.performExactLookup = performExactLookup;

    // ======= API SEARCH WITH DEBOUNCING & PAGINATION =======
    
    let searchDebounceTimer = null;
    let currentSearchPage = 1;
    let lastSearchQuery = '';
    
    // Debounced API search function
    function debounceApiSearch(query, delay = 300) {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            if (query.trim()) {
                performApiSearch(query.trim(), 1);
            }
        }, delay);
    }
    
    // Main API search function (no auth required)
    async function performApiSearch(query, page = 1) {
        if (!query) return;
        
        lastSearchQuery = query;
        currentSearchPage = page;
        
        console.log(`🔎 API Search: "${query}" (page ${page})`);
        
        // Show loading state
        const recipesGrid = document.querySelector('.recipes-grid') || document.getElementById('recipesGrid');
        if (recipesGrid) {
            recipesGrid.innerHTML = `
                <div class="loading-search" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 50px; color: #ff6b35; margin-bottom: 20px;"></i>
                    <h3>Searching recipes...</h3>
                    <p style="color: #666;">Page ${page}</p>
                </div>
            `;
        }
        
        try {
            const params = new URLSearchParams({
                name: query,
                page: page.toString()
            });
            
            const response = await fetch(`https://njoya.pythonanywhere.com/api/recipes/search/?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                    // No auth header - unauthenticated access allowed
                }
            });
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('🔎 API Search Response:', data);
            
            // Handle no results with suggestions
            if (data.count === 0 && data.suggestions && data.suggestions.length > 0) {
                renderSearchSuggestions(query, data.suggestions);
                return;
            }
            
            // Update global recipe data
            recipeData = data.results || [];
            displayRecipes(recipeData);
            
            // Render pagination
            renderSearchPagination(data);
            
            // Show success message
            showToast(`Found ${data.count} recipes for "${query}"`, '#4CAF50');
            
        } catch (error) {
            console.error('❌ API Search Error:', error);
            renderSearchError(`Search failed: ${error.message}`);
        }
    }
    
    // Render search suggestions when no results found
    function renderSearchSuggestions(query, suggestions) {
        const recipesGrid = document.querySelector('.recipes-grid') || document.getElementById('recipesGrid');
        if (!recipesGrid) return;
        
        const suggestionButtons = suggestions.map(suggestion => 
            `<button class="btn btn-outline suggestion-btn" data-suggestion="${encodeURIComponent(suggestion)}" style="margin: 5px;">
                ${suggestion}
            </button>`
        ).join('');
        
        recipesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <i class="fas fa-search" style="font-size: 50px; color: #ccc; margin-bottom: 20px;"></i>
                <h3 style="color: #333; margin-bottom: 15px;">No recipes found matching "${query}"</h3>
                <p style="color: #666; margin-bottom: 20px;">Try one of these suggestions:</p>
                <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin: 20px 0;">
                    ${suggestionButtons}
                </div>
                <button onclick="clearSearch()" class="btn btn-primary" style="margin-top: 20px;">
                    <i class="fas fa-times"></i> Clear Search
                </button>
            </div>
        `;
        
        // Add click handlers for suggestions
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const suggestion = decodeURIComponent(e.target.dataset.suggestion);
                if (searchInput) {
                    searchInput.value = suggestion;
                }
                performApiSearch(suggestion, 1);
            });
        });
    }
    
    // Render pagination controls
    function renderSearchPagination(data) {
        // Remove existing pagination
        const existingPagination = document.querySelector('.search-pagination');
        if (existingPagination) {
            existingPagination.remove();
        }
        
        if (!data.next && !data.previous) {
            return; // No pagination needed
        }
        
        const pagination = document.createElement('div');
        pagination.className = 'search-pagination';
        pagination.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            margin: 30px 0;
            padding: 20px;
            background: rgba(255,255,255,0.9);
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn-pagination';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Previous';
        prevBtn.disabled = !data.previous;
        prevBtn.style.cssText = `
            background: ${data.previous ? '#4CAF50' : '#ccc'};
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: ${data.previous ? 'pointer' : 'not-allowed'};
            font-size: 14px;
            transition: all 0.3s ease;
        `;
        
        if (data.previous) {
            prevBtn.addEventListener('click', () => {
                const prevPage = currentSearchPage - 1;
                performApiSearch(lastSearchQuery, prevPage);
            });
        }
        
        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Page ${currentSearchPage}`;
        pageInfo.style.cssText = `
            padding: 10px 20px;
            background: #f5f5f5;
            border-radius: 6px;
            font-weight: 500;
            color: #333;
        `;
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn-pagination';
        nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = !data.next;
        nextBtn.style.cssText = `
            background: ${data.next ? '#4CAF50' : '#ccc'};
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: ${data.next ? 'pointer' : 'not-allowed'};
            font-size: 14px;
            transition: all 0.3s ease;
        `;
        
        if (data.next) {
            nextBtn.addEventListener('click', () => {
                const nextPage = currentSearchPage + 1;
                performApiSearch(lastSearchQuery, nextPage);
            });
        }
        
        pagination.appendChild(prevBtn);
        pagination.appendChild(pageInfo);
        pagination.appendChild(nextBtn);
        
        // Insert after recipes grid
        const recipesGrid = document.querySelector('.recipes-grid') || document.getElementById('recipesGrid');
        if (recipesGrid && recipesGrid.parentNode) {
            recipesGrid.parentNode.insertBefore(pagination, recipesGrid.nextSibling);
        }
    }
    
    // Exact lookup by name for deep links
    async function performExactLookup(name) {
        if (!name) return;
        
        console.log(`🎯 Exact Lookup: "${name}"`);
        
        // Show loading state
        const recipesGrid = document.querySelector('.recipes-grid') || document.getElementById('recipesGrid');
        if (recipesGrid) {
            recipesGrid.innerHTML = `
                <div class="loading-search" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 50px; color: #ff6b35; margin-bottom: 20px;"></i>
                    <h3>Looking up recipe...</h3>
                </div>
            `;
        }
        
        try {
            // Encode name for URL (replace spaces with hyphens)
            const encodedName = encodeURIComponent(name.replace(/\s+/g, '-'));
            
            const response = await fetch(`https://njoya.pythonanywhere.com/api/recipes/by-name/${encodedName}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                    // No auth header - unauthenticated access allowed
                }
            });
            
            if (response.ok) {
                const recipe = await response.json();
                console.log('🎯 Exact Lookup Success:', recipe);
                
                recipeData = [recipe];
                displayRecipes([recipe]);
                
                // Remove any pagination
                const existingPagination = document.querySelector('.search-pagination');
                if (existingPagination) {
                    existingPagination.remove();
                }
                
                showToast(`Found recipe: "${recipe.title}"`, '#4CAF50');
                
            } else if (response.status === 404) {
                const errorData = await response.json();
                console.log('🎯 Recipe not found, showing suggestion:', errorData);
                
                // Show suggestion or fallback to search
                const suggestion = errorData.suggestion || `Try searching for "${name}"`;
                renderSearchError(`Recipe "${name}" not found. ${suggestion}`, name);
                
            } else {
                throw new Error(`Lookup failed: ${response.status}`);
            }
            
        } catch (error) {
            console.error('❌ Exact Lookup Error:', error);
            renderSearchError(`Lookup failed: ${error.message}`, name);
        }
    }
    
    // Enhanced search error with fallback search option
    function renderSearchError(message, fallbackQuery = null) {
        const recipesGrid = document.querySelector('.recipes-grid') || document.getElementById('recipesGrid');
        if (!recipesGrid) return;
        
        const fallbackButton = fallbackQuery ? 
            `<button onclick="performApiSearch('${fallbackQuery}', 1)" class="btn btn-outline" style="margin: 10px;">
                <i class="fas fa-search"></i> Search for "${fallbackQuery}"
            </button>` : '';
        
        recipesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <i class="fas fa-exclamation-triangle" style="font-size: 50px; color: #ff6b35; margin-bottom: 20px;"></i>
                <h3 style="color: #333; margin-bottom: 15px;">${message}</h3>
                <div style="margin: 20px 0;">
                    ${fallbackButton}
                    <button onclick="clearSearch()" class="btn btn-primary" style="margin: 10px;">
                        <i class="fas fa-times"></i> Clear Search
                    </button>
                </div>
            </div>
        `;
    }
    
    // Check for deep links on page load
    function initializeDeepLinkSearch() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const nameParam = urlParams.get('name');
            
            if (nameParam) {
                const decodedName = decodeURIComponent(nameParam);
                console.log('🔗 Deep link search detected:', decodedName);
                
                if (searchInput) {
                    searchInput.value = decodedName;
                }
                
                // Try exact lookup first, then search
                performExactLookup(decodedName);
                return;
            }
            
            // Check for /by-name/ path pattern
            const path = window.location.pathname;
            const byNameMatch = path.match(/\/by-name\/(.+)$/);
            if (byNameMatch) {
                const encodedName = byNameMatch[1];
                const decodedName = decodeURIComponent(encodedName.replace(/-/g, ' '));
                console.log('🔗 By-name deep link detected:', decodedName);
                
                if (searchInput) {
                    searchInput.value = decodedName;
                }
                
                performExactLookup(decodedName);
            }
            
        } catch (error) {
            console.warn('⚠️ Deep link initialization error:', error);
        }
    }
    
    // Enhanced search input handler with debouncing
    function setupEnhancedSearch() {
        if (!searchInput) return;
        
        // Remove existing event listeners to avoid duplicates
        searchInput.removeEventListener('input', searchRecipes);
        
        // Add new debounced search handler
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            
            if (!query) {
                // Clear search
                clearTimeout(searchDebounceTimer);
                recipeData = [...allRecipes];
                displayRecipes(allRecipes);
                
                // Remove pagination
                const existingPagination = document.querySelector('.search-pagination');
                if (existingPagination) {
                    existingPagination.remove();
                }
                
                return;
            }
            
            // Show clear button
            if (clearSearchButton) {
                clearSearchButton.style.display = 'inline-block';
            }
            
            // Perform local search immediately for better UX
            performLocalSearch(query);
            
            // Debounced API search for comprehensive results
            debounceApiSearch(query);
        });
        
        // Keep existing search button functionality
        if (searchButton) {
            searchButton.addEventListener('click', function() {
                const query = searchInput.value.trim();
                if (query) {
                    performApiSearch(query, 1);
                }
            });
        }
    }
    
    // Initialize enhanced search functionality
    setupEnhancedSearch();
    initializeDeepLinkSearch();

    // ======= CREATE RECIPE BUTTON INITIALIZATION =======
    
    // ======= ENHANCED VERIFICATION CHECK =======
    
    async function checkUserVerification() {
        console.log('🔍 Checking user verification with new is_verified_contributor field...');
        // Get auth token
        const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (!authToken) {
            console.log('❌ No auth token found');
            return { isVerified: false, reason: 'not_logged_in' };
        }
        try {
            const response = await fetch('https://njoya.pythonanywhere.com/api/users/profile/', {
                headers: {
                    'Authorization': authToken.startsWith('Token ') ? authToken : `Token ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                console.log('❌ Profile request failed:', response.status);
                return { isVerified: false, reason: 'api_error', status: response.status };
            }
            const profileData = await response.json();
            const isVerified = profileData.is_verified_contributor === true;
            return {
                isVerified,
                reason: isVerified ? 'verified' : 'not_verified',
                profileData
            };
        } catch (error) {
            console.error('❌ Error checking verification:', error);
            return { isVerified: false, reason: 'error', error: error.message };
        }
    }

    // Periodic verification status check
    async function periodicVerificationCheck() {
        try {
            console.log('� Performing periodic verification check...');
            
            const newVerificationResult = await checkUserVerification();
            
            // Check if verification status has changed
            if (currentVerificationStatus && 
                currentVerificationStatus.isVerified !== newVerificationResult.isVerified) {
                
                console.log('🚨 Verification status changed!');
                console.log('Previous:', currentVerificationStatus.isVerified);
                console.log('Current:', newVerificationResult.isVerified);
                
                // Update the create recipe button immediately
                currentVerificationStatus = newVerificationResult;
                await initializeCreateRecipeButton();
                
                // Show notification to user
                if (newVerificationResult.isVerified) {
                    showToast('✅ Your account has been verified! You can now create recipes.', '#4caf50');
                } else {
                    showToast('⚠️ Your verification status has changed. Recipe creation is now restricted.', '#ff9800');
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Periodic verification check failed:', error);
        }
    }

    async function initializeCreateRecipeButton() {
        console.log('🚀 Initializing Create Recipe button...');
        console.log('🔍 Container element:', document.getElementById('createRecipeButtonContainer'));
        
        const container = document.getElementById('createRecipeButtonContainer');
        if (!container) {
            console.error('❌ Create Recipe button container not found in DOM');
            console.log('🔍 Available containers:', document.querySelectorAll('[id*="create"]'));
            return;
        }

        console.log('✅ Container found, clearing existing content...');
        // Clear any existing content
        container.innerHTML = '';

        try {
            console.log('🔄 Starting verification check...');
            const verificationResult = await checkUserVerification();
            console.log('✅ Verification check result:', verificationResult);
            console.log('🔍 Is verified?', verificationResult.isVerified);
            console.log('🔍 Reason:', verificationResult.reason);
            
            // Store current verification status for comparison
            currentVerificationStatus = verificationResult;
            
            if (verificationResult.isVerified) {
                console.log('✅ User is verified - showing Create Recipe button');
                // Create the Create Recipe button
                const createButton = document.createElement('div');
                createButton.className = 'create-recipe-section';
                createButton.innerHTML = `
                    <div class="container" style="text-align: center; margin: 20px 0;">
                        <button id="createRecipeBtn" class="create-recipe-btn">
                            <i class="fas fa-plus-circle"></i>
                            Create New Recipe
                        </button>
                        <p style="margin-top: 10px; font-size: 14px; color: #666;">
                            <i class="fas fa-check-circle" style="color: #4caf50; margin-right: 5px;"></i>
                            Verified users can create and share recipes
                        </p>
                    </div>
                `;
                container.appendChild(createButton);
                // Add click event to open the modal
                const createBtn = document.getElementById('createRecipeBtn');
                if (createBtn) {
                    createBtn.addEventListener('click', function() {
                        console.log('🎯 Create Recipe button clicked');
                        // Double-check verification before opening modal
                        checkUserVerification().then(currentStatus => {
                            if (currentStatus.isVerified) {
                                const modal = document.getElementById('createRecipeModal');
                                if (modal) {
                                    modal.style.display = 'block';
                                    document.body.style.overflow = 'hidden';
                                }
                            } else {
                                showToast('⚠️ Verification required to create recipes. Please verify your account.', '#ff9800');
                                // Refresh the button status
                                initializeCreateRecipeButton();
                            }
                        });
                    });
                }
            } else if (verificationResult.reason === 'not_logged_in') {
                console.log('❌ User not logged in - showing login prompt');
                
                const loginPrompt = document.createElement('div');
                loginPrompt.className = 'login-prompt';
                loginPrompt.innerHTML = `
                    <div class="container" style="text-align: center; margin: 20px 0;">
                        <div style="background: rgba(244, 67, 54, 0.1); border: 1px solid #f44336; border-radius: 8px; padding: 15px; color: #c62828;">
                            <i class="fas fa-sign-in-alt" style="margin-right: 8px;"></i>
                            <strong>Login Required</strong>
                            <p style="margin: 8px 0 0 0; font-size: 14px;">
                                Please <a href="Login.html" style="color: #1b5e20; text-decoration: underline;">log in</a> to create recipes
                            </p>
                        </div>
                    </div>
                `;
                
                container.appendChild(loginPrompt);
                
            } else {
                console.log('❌ User is not verified - showing verification notice');
                
                const verificationNotice = document.createElement('div');
                verificationNotice.className = 'verification-notice';
                verificationNotice.innerHTML = `
                    <div class="container" style="text-align: center; margin: 20px 0;">
                        <div style="background: rgba(255, 193, 7, 0.1); border: 1px solid #ffc107; border-radius: 8px; padding: 15px; color: #856404;">
                            <i class="fas fa-shield-alt" style="margin-right: 8px;"></i>
                            <strong>Verification Required</strong>
                            <p style="margin: 8px 0 0 0; font-size: 14px;">
                                Only verified users can create recipes. 
                                <a href="verification.html" style="color: #1b5e20; text-decoration: underline;">Apply for verification</a>
                            </p>
                        </div>
                    </div>
                `;
                
                container.appendChild(verificationNotice);
            }
            
        } catch (error) {
            console.error('❌ Error in initializeCreateRecipeButton:', error);
            
            // Show error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-notice';
            errorMessage.innerHTML = `
                <div class="container" style="text-align: center; margin: 20px 0;">
                    <div style="background: rgba(244, 67, 54, 0.1); border: 1px solid #f44336; border-radius: 8px; padding: 15px; color: #c62828;">
                        <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
                        <strong>Error Loading</strong>
                        <p style="margin: 8px 0 0 0; font-size: 14px;">
                            Unable to check verification status. Please refresh the page.
                        </p>
                    </div>
                </div>
            `;
            
            container.appendChild(errorMessage);
        }
    }

    // Setup manual refresh button
    const refreshVerificationBtn = document.getElementById('refreshVerificationBtn');
    if (refreshVerificationBtn) {
        refreshVerificationBtn.addEventListener('click', async function() {
            console.log('🔄 Manual verification refresh requested');
            
            // Show loading state
            const originalText = refreshVerificationBtn.innerHTML;
            refreshVerificationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
            refreshVerificationBtn.disabled = true;
            
            try {
                // Clear cache and force refresh
                if (window.universalVerification) {
                    window.universalVerification.clearCache();
                }
                
                // Re-check verification
                await initializeCreateRecipeButton();
                
                showToast('✅ Verification status refreshed', '#4caf50');
                
            } catch (error) {
                console.error('❌ Manual refresh failed:', error);
                showToast('❌ Failed to refresh verification status', '#f44336');
            } finally {
                // Restore button state
                refreshVerificationBtn.innerHTML = originalText;
                refreshVerificationBtn.disabled = false;
            }
        });
        
        // Show the refresh button for logged-in users
        const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (authToken) {
            refreshVerificationBtn.style.display = 'inline-flex';
        }
    }

    // ======= MODAL FUNCTIONALITY =======
    
    // Handle modal closing
    function setupModalHandlers() {
        const modal = document.getElementById('createRecipeModal');
        const closeBtn = document.getElementById('closeCreateRecipeModal');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                console.log('🔒 Closing Create Recipe modal');
                modal.style.display = 'none';
                document.body.style.overflow = 'auto'; // Restore scroll
            });
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                console.log('🔒 Closing modal - clicked outside');
                modal.style.display = 'none';
                document.body.style.overflow = 'auto'; // Restore scroll
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && modal.style.display === 'block') {
                console.log('🔒 Closing modal - Escape key');
                modal.style.display = 'none';
                document.body.style.overflow = 'auto'; // Restore scroll
            }
        });
    }
    
    // Initialize modal handlers
    setupModalHandlers();
    
    // ======= LOAD INITIAL RECIPES =======
    // Robust recipe loading with proper DOM checks
    function initializeRecipeLoading() {
        console.log('🔄 Initializing recipe loading system...');
        const recipesGridCheck = document.getElementById('recipesGrid');
        console.log('🔍 RecipesGrid element:', recipesGridCheck);
        
        if (!recipesGridCheck) {
            console.error('❌ RecipesGrid element not found! Check HTML structure.');
            console.log('🔍 Available recipe elements:', document.querySelectorAll('[id*="recipe"]'));
            console.log('🔍 All elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            
            // Try again after a delay
            setTimeout(initializeRecipeLoading, 500);
            return;
        }
        
        console.log('✅ RecipesGrid element found, proceeding with recipe loading...');
        
        // Check for force flags from diagnostic tool
        const forceLoad = localStorage.getItem('forceLoadRecipes');
        const loadFallback = localStorage.getItem('loadFallbackRecipes');
        
        if (forceLoad === 'true') {
            console.log('🔧 Force load flag detected - forcing recipe load');
            localStorage.removeItem('forceLoadRecipes'); // Clear flag
        }
        
        if (loadFallback === 'true') {
            console.log('🔧 Fallback flag detected - loading sample recipes');
            localStorage.removeItem('loadFallbackRecipes'); // Clear flag
            const fallbackRecipes = getFallbackRecipes();
            allRecipes = fallbackRecipes;
            recipeData = fallbackRecipes;
            displayRecipes(fallbackRecipes);
            console.log('✅ Sample recipes loaded via flag');
        } else {
            // Normal recipe loading with better error handling - PRIORITIZE DATABASE RECIPES
            console.log('🌐 STARTING DATABASE RECIPE LOADING PROCESS...');
            console.log('🔍 API URL: https://njoya.pythonanywhere.com/api/recipes/');
            console.log('🔍 Current URL:', window.location.href);
            console.log('🔍 Timestamp:', new Date().toISOString());
            
            // Add a visual indicator that we're trying to load from database
            const recipesGridCheck = document.getElementById('recipesGrid');
            if (recipesGridCheck) {
                recipesGridCheck.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: rgba(0,123,255,0.1); border-radius: 12px; border-left: 4px solid #007bff;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #0056b3; font-weight: 600; font-size: 18px;">
                            <i class="fas fa-database"></i>
                            <span>Loading recipes from your database...</span>
                        </div>
                        <div style="margin-top: 8px; color: #666; font-size: 14px;">
                            Connecting to: njoya.pythonanywhere.com/api/recipes/
                        </div>
                    </div>
                `;
            }
            
            fetchRecipes().then(recipes => {
                console.log('📥 API FETCH COMPLETED - Analyzing response...');
                console.log('✅ API Response received:', recipes ? recipes.length : 'null/undefined', 'recipes');
                
                if (recipes && recipes.length > 0) {
                    // Check if these are real recipes or fallback recipes
                    const isFallback = recipes.some(r => 
                        r.contributor && (
                            r.contributor.username === 'ChopSmo Chef' || 
                            r.contributor.username === 'Pasta Master' ||
                            r.contributor.username === 'Soup Master' ||
                            r.title?.includes('Sample')
                        )
                    );
                    
                    if (isFallback) {
                        console.error('❌ PROBLEM: Received FALLBACK/MOCK recipes instead of database recipes!');
                        console.error('� This means the API call failed and returned mock data');
                        console.error('🔍 Mock recipe titles:', recipes.map(r => r.title || r.name));
                        
                        // Show error message to user
                        if (recipesGridCheck) {
                            recipesGridCheck.innerHTML = `
                                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: rgba(220,53,69,0.1); border-radius: 12px; border-left: 4px solid #dc3545;">
                                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #721c24; font-weight: 600; font-size: 18px;">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        <span>Database connection failed - showing sample recipes</span>
                                    </div>
                                    <div style="margin-top: 8px; color: #666; font-size: 14px;">
                                        Using offline fallback recipes
                                    </div>
                                </div>
                            `;
                        }
                        
                        // Display fallback recipes after delay
                        setTimeout(() => {
                            allRecipes = recipes;
                            recipeData = recipes;
                            displayRecipes(recipes);
                        }, 2000);
                    } else {
                        console.log('🎉 SUCCESS: Loaded REAL recipes from your database!');
                        console.log('🔍 Real recipe titles:', recipes.slice(0, 5).map(r => r.title || r.name));
                        console.log('🔍 Contributors:', recipes.slice(0, 5).map(r => r.contributor?.username || 'Unknown'));
                        
                        // Show success message
                        if (recipesGridCheck) {
                            recipesGridCheck.innerHTML = `
                                <div style="grid-column: 1 / -1; text-align: center; padding: 20px; background: rgba(40,167,69,0.1); border-radius: 12px; border-left: 4px solid #28a745;">
                                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #155724; font-weight: 600;">
                                        <i class="fas fa-check-circle"></i>
                                        <span>Successfully loaded ${recipes.length} recipes from your database!</span>
                                    </div>
                                </div>
                            `;
                        }
                        
                        allRecipes = recipes;
                        recipeData = recipes;
                        
                        // Display after a short delay to show the success message
                        setTimeout(() => {
                            displayRecipes(recipes);
                        }, 1500);
                    }
                } else {
                    console.error('❌ No recipes received from API');
                    
                    // Show empty database message
                    if (recipesGridCheck) {
                        recipesGridCheck.innerHTML = `
                            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: rgba(255,193,7,0.1); border-radius: 12px; border-left: 4px solid #ffc107;">
                                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #856404; font-weight: 600; font-size: 18px;">
                                    <i class="fas fa-database"></i>
                                    <span>Your database is empty</span>
                                </div>
                                <div style="margin-top: 8px; color: #666; font-size: 14px;">
                                    Add some recipes to your database to see them here!
                                </div>
                            </div>
                        `;
                    }
                }
                
                console.log('✅ Recipe loading process completed');
                
            }).catch(error => {
                console.error('❌ CRITICAL ERROR: Recipe loading failed completely:', error);
                console.error('� Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
                
                // Show critical error message
                if (recipesGridCheck) {
                    recipesGridCheck.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: rgba(220,53,69,0.1); border-radius: 12px; border-left: 4px solid #dc3545;">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #721c24; font-weight: 600; font-size: 18px;">
                                <i class="fas fa-exclamation-circle"></i>
                                <span>Critical Error: Cannot load recipes</span>
                            </div>
                            <div style="margin-top: 8px; color: #666; font-size: 14px;">
                                Error: ${error.message}<br>
                                <a href="recipe-fix-tools.html" style="color: #007bff;">Click here for diagnostic tools</a>
                            </div>
                        </div>
                    `;
                }
                
                // Load fallback recipes as absolute last resort
                setTimeout(() => {
                    console.log('� Loading fallback recipes as last resort...');
                    const fallbackRecipes = getFallbackRecipes();
                    allRecipes = fallbackRecipes;
                    recipeData = fallbackRecipes;
                    displayRecipes(fallbackRecipes);
                    console.log('✅ Fallback recipes displayed');
                }, 3000);
            });
        }
    }
    
    // Start initialization with delay to ensure DOM is ready
    setTimeout(initializeRecipeLoading, 100);
    
    // Initialize Create Recipe button based on user verification status
    initializeCreateRecipeButton();
    
    // Start periodic verification checks (every 30 seconds)
    verificationCheckInterval = setInterval(periodicVerificationCheck, 30000);
    
    // Cleanup interval on page unload
    window.addEventListener('beforeunload', function() {
        if (verificationCheckInterval) {
            clearInterval(verificationCheckInterval);
        }
    });

    // Handle visibility changes to refresh verification status
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log('👁️ Page became visible - checking verification status');
            // Small delay to ensure any backend changes are reflected
            setTimeout(async () => {
                await periodicVerificationCheck();
            }, 1000);
        }
    });
    
    // Also check when window gets focus
    window.addEventListener('focus', function() {
        console.log('🔍 Window gained focus - checking verification status');
        setTimeout(async () => {
            await periodicVerificationCheck();
        }, 1000);
    });

    // ======= QUICK DEBUG OVERRIDE =======
    
    // Quick function to test with forced verification
    window.testWithForcedVerification = function() {
        console.log('🔧 Testing with forced verification...');
        const container = document.getElementById('createRecipeButtonContainer');
        if (container) {
            container.innerHTML = '';
            
            const createButton = document.createElement('div');
            createButton.className = 'create-recipe-section';
            createButton.innerHTML = `
                <div class="container" style="text-align: center; margin: 20px 0;">
                    <button id="createRecipeBtn" class="create-recipe-btn">
                        <i class="fas fa-plus-circle"></i>
                        Create New Recipe
                    </button>
                    <p style="margin-top: 10px; font-size: 14px; color: #666;">
                        <i class="fas fa-check-circle" style="color: #4caf50; margin-right: 5px;"></i>
                        DEBUG: Forced verification test
                    </p>
                </div>
            `;
            container.appendChild(createButton);
            
            const createBtn = document.getElementById('createRecipeBtn');
            if (createBtn) {
                createBtn.addEventListener('click', function() {
                    console.log('🎯 Create Recipe button clicked (forced test)');
                    const modal = document.getElementById('createRecipeModal');
                    if (modal) {
                        modal.style.display = 'block';
                        document.body.style.overflow = 'hidden';
                    }
                });
            }
            
            console.log('✅ Button created with forced verification');
        }
    };

    // ======= BROWSER CONSOLE TEST FUNCTIONS =======
    // Use these functions in the browser console to test the Create Recipe button
    
    window.testCreateRecipeButton = async function() {
        console.log('🧪 Testing Create Recipe Button functionality...');
        console.log('🔍 Container exists?', !!document.getElementById('createRecipeButtonContainer'));
        console.log('🔍 Current container content:', document.getElementById('createRecipeButtonContainer')?.innerHTML);
        
        const verification = await checkUserVerification();
        console.log('🔍 Verification result:', verification);
        
        // Force re-initialize
        await initializeCreateRecipeButton();
        
        console.log('🔍 Container content after init:', document.getElementById('createRecipeButtonContainer')?.innerHTML);
    };
    
    window.forceRefreshVerification = async function() {
        console.log('🔄 Forcing verification status refresh...');
        
        // Clear verification cache
        if (window.universalVerification) {
            window.universalVerification.clearCache();
        }
        
        // Re-check verification and update button
        await initializeCreateRecipeButton();
        
        console.log('✅ Verification status refreshed');
    };
    
    window.forceShowCreateButton = function() {
        console.log('🔧 Forcing Create Recipe button to show...');
        const container = document.getElementById('createRecipeButtonContainer');
        if (container) {
            container.innerHTML = `
                <div class="create-recipe-section" style="text-align: center;">
                    <button class="create-recipe-btn" id="createRecipeBtn">
                        <i class="fas fa-plus-circle"></i>
                        Create New Recipe (DEBUG)
                    </button>
                </div>
            `;
            
            // Add event listener
            const btn = document.getElementById('createRecipeBtn');
            if (btn) {
                btn.addEventListener('click', () => {
                    console.log('🔥 Create Recipe button clicked!');
                    const modal = document.getElementById('createRecipeModal');
                    if (modal) modal.style.display = 'block';
                });
                console.log('✅ Button forced to show and event listener added');
            }
        }
    };
    
    // Force load recipes function for debugging
    window.forceLoadRecipes = async function() {
        console.log('🔧 FORCE LOADING RECIPES...');
        console.log('🔍 RecipesGrid element:', document.getElementById('recipesGrid'));
        
        try {
            const recipes = await fetchRecipes();
            console.log('✅ Fetched recipes:', recipes.length);
            // You can add more debug/test logic here if needed
        } catch (e) {
            console.error('❌ Error in forceLoadRecipes:', e);
        }
    };
    
    // ======= CREATE RECIPE FORM ENHANCEMENTS =======

    // Utility: Fetch options from backend
    async function fetchOptions(endpoint) {
        try {
            console.log(`[DEBUG] Fetching options for: ${endpoint}`);
            const response = await fetch(`https://njoya.pythonanywhere.com/api/${endpoint}/`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            console.log(`[DEBUG] Response for ${endpoint}:`, data);
            if (!response.ok) {
                console.error(`[ERROR] Fetch for ${endpoint} failed:`, data);
                return [];
            }
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error(`[ERROR] Exception fetching ${endpoint}:`, e);
            return [];
        }
    }

    // Populate select options for categories, cuisines, tags
    async function populateRecipeFormOptions() {
        const [categories, cuisines, tags] = await Promise.all([
            fetchOptions('categories'),
            fetchOptions('cuisines'),
            fetchOptions('tags')
        ]);
        const catSel = document.getElementById('recipeCategories');
        const cuiSel = document.getElementById('recipeCuisines');
        const tagSel = document.getElementById('recipeTags');
        if (catSel) {
            catSel.innerHTML = categories.length
                ? categories.map(c => `<option value="${c.id || c.name}">${c.name}</option>`).join('')
                : '<option disabled selected>No categories found</option>';
            console.log('[DEBUG] Categories select populated:', catSel.innerHTML);
        }
        if (cuiSel) {
            cuiSel.innerHTML = cuisines.length
                ? cuisines.map(c => `<option value="${c.id || c.name}">${c.name}</option>`).join('')
                : '<option disabled selected>No cuisines found</option>';
            console.log('[DEBUG] Cuisines select populated:', cuiSel.innerHTML);
        }
        if (tagSel) {
            tagSel.innerHTML = tags.length
                ? tags.map(t => `<option value="${t.id || t.name}">${t.name}</option>`).join('')
                : '<option disabled selected>No tags found</option>';
            console.log('[DEBUG] Tags select populated:', tagSel.innerHTML);
        }
    }

    // Ingredient add/remove logic
    function setupIngredientFields() {
        const list = document.getElementById('ingredientsList');
        const addBtn = document.getElementById('addIngredientBtn');
        if (!list || !addBtn) return;
        function createIngredientRow() {
            const row = document.createElement('div');
            row.className = 'ingredient-row';
            row.style.display = 'flex';
            row.style.gap = '8px';
            row.style.marginBottom = '8px';
            row.innerHTML = `
                <input type="text" name="ingredient_name[]" placeholder="Ingredient" required style="flex:2;min-width:0;"/>
                <input type="text" name="quantity[]" placeholder="Qty" required style="width:60px;"/>
                <input type="text" name="unit[]" placeholder="Unit" style="width:60px;"/>
                <input type="text" name="preparation[]" placeholder="Preparation (optional)" style="flex:1;min-width:0;"/>
                <button type="button" class="btn btn-outline btn-remove-ingredient" title="Remove">&times;</button>
            `;
            row.querySelector('.btn-remove-ingredient').onclick = () => row.remove();
            return row;
        }
        addBtn.onclick = () => list.appendChild(createIngredientRow());
        // Add one row by default if empty
        if (!list.children.length) addBtn.onclick();
    }

    // Style file input and add modern look
    function styleRecipeFileInput() {
        const fileInput = document.getElementById('recipeImage');
        if (!fileInput) return;
        fileInput.style.display = 'none';
        let label = fileInput.nextElementSibling;
        if (!label || label.tagName !== 'LABEL') {
            label = document.createElement('label');
            label.htmlFor = 'recipeImage';
            fileInput.parentNode.insertBefore(label, fileInput.nextSibling);
        }
        label.className = 'btn btn-outline';
        label.style.marginTop = '8px';
        label.innerHTML = '<i class="fas fa-upload"></i> Choose File';
        fileInput.onchange = function() {
            label.innerHTML = this.files && this.files[0] ? `<i class="fas fa-upload"></i> ${this.files[0].name}` : '<i class="fas fa-upload"></i> Choose File';
        };
    }

    // Enhance form on modal open
    function enhanceCreateRecipeForm() {
        populateRecipeFormOptions();
        setupIngredientFields();
        styleRecipeFileInput();
        // Style Add Ingredient button
        const addBtn = document.getElementById('addIngredientBtn');
        if (addBtn) {
            addBtn.className = 'btn btn-primary';
            addBtn.style.marginTop = '8px';
        }
    }

    // Hook into modal open
    const createRecipeModal = document.getElementById('createRecipeModal');
    if (createRecipeModal) {
        const observer = new MutationObserver(() => {
            if (createRecipeModal.style.display === 'block') {
                setTimeout(enhanceCreateRecipeForm, 100);
            }
        });
        observer.observe(createRecipeModal, { attributes: true, attributeFilter: ['style'] });
    }
    
    // ======= CREATE RECIPE FORM SUBMISSION HANDLER =======
    const createRecipeForm = document.getElementById('createRecipeForm');
    if (createRecipeForm) {
        createRecipeForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Collect ingredient fields
            const ingredientNames = Array.from(document.getElementsByName('ingredient_name[]')).map(input => input.value.trim());
            const quantities = Array.from(document.getElementsByName('quantity[]')).map(input => input.value.trim());
            const units = Array.from(document.getElementsByName('unit[]')).map(input => input.value.trim());
            const preparations = Array.from(document.getElementsByName('preparation[]')).map(input => input.value.trim());
            // Build ingredients array with preparation
            const ingredients = ingredientNames.map((name, i) => ({
                name,
                quantity: quantities[i] || '',
                unit: units[i] || '',
                preparation: preparations[i] || '' // Optional
            }));

            // Collect other form fields
            const title = document.getElementById('recipeTitle').value.trim();
            const name = document.getElementById('recipeName').value.trim();
            const description = document.getElementById('recipeDescription').value.trim();
            const instructions = document.getElementById('recipeInstructions').value.trim();
            const estimatedCostInput = document.getElementById('estimated_cost').value;
            const estimated_cost = estimatedCostInput !== '' ? parseFloat(estimatedCostInput) : null;

            // Collect categories, cuisines, tags (multi-select)
            const getSelectedValues = sel => Array.from(sel.selectedOptions).map(opt => opt.value);
            const categories = getSelectedValues(document.getElementById('recipeCategories'));
            const cuisines = getSelectedValues(document.getElementById('recipeCuisines'));
            const tags = getSelectedValues(document.getElementById('recipeTags'));

            // Validation
            const errors = {};
            if (!title) errors.title = 'Title is required';
            if (!description) errors.description = 'Description is required';
            if (estimatedCostInput !== '' && (isNaN(estimated_cost) || estimated_cost < 0)) {
                errors.estimated_cost = 'Cost must be a valid positive number';
            }
            // Add more validation as needed
            if (Object.keys(errors).length > 0) {
                showToast(Object.values(errors).join('\n'), '#f44336');
                return;
            }

            // Build recipe data object
            const recipeData = {
                title,
                name,
                description,
                instructions,
                estimated_cost,
                ingredients,
                categories,
                cuisines,
                tags
            };

            // Auth token
            const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            if (!authToken) {
                showToast('You must be logged in to create a recipe.', '#f44336');
                return;
            }

            try {
                const response = await fetch('https://njoya.pythonanywhere.com/api/recipes/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authToken.startsWith('Token ') ? authToken : `Token ${authToken}`
                    },
                    body: JSON.stringify(recipeData)
                });
                if (response.ok) {
                    showToast('Recipe created successfully!', '#4CAF50');
                    // Optionally close modal and refresh recipes
                    document.getElementById('createRecipeModal').style.display = 'none';
                    document.body.style.overflow = 'auto';
                    setTimeout(() => fetchRecipes().then(recipes => {
                        allRecipes = recipes;
                        recipeData = recipes;
                        displayRecipes(recipes);
                    }), 1000);
                } else {
                    const errorData = await response.json();
                    showToast('Failed to create recipe: ' + (errorData.detail || JSON.stringify(errorData)), '#f44336');
                }
            } catch (err) {
                showToast('Error creating recipe: ' + err.message, '#f44336');
            }
        });
    }
    
    // ======= FAILSAFE RECIPE LOADING =======
    // If no recipes are loaded after 3 seconds, force load fallback recipes
    setTimeout(() => {
        const recipesGridCheck = document.getElementById('recipesGrid');
        if (recipesGridCheck && (!recipeData || recipeData.length === 0)) {
            console.log('⚠️ FAILSAFE: No recipes detected after 3 seconds, loading fallback...');
            const fallbackRecipes = getFallbackRecipes();
            allRecipes = fallbackRecipes;
            recipeData = fallbackRecipes;
            displayRecipes(fallbackRecipes);
            console.log('✅ FAILSAFE: Fallback recipes loaded');
        } else if (recipesGridCheck && recipeData && recipeData.length > 0) {
            console.log('✅ FAILSAFE: Recipes are properly loaded', recipeData.length);
        } else if (!recipesGridCheck) {
            console.error('❌ FAILSAFE: RecipesGrid element still not found after 3 seconds');
        }
    }, 3000);

}); // End of DOMContentLoaded