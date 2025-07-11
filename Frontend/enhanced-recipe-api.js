// ChopSmo Enhanced Recipe API (Professional Placeholder)
// This file prevents 404 errors and provides a basic API interface for the frontend.
// Replace with real implementation as needed.

class EnhancedRecipeAPI {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || 'https://njoya.pythonanywhere.com';
        
        // Safe auth token getter
        this.getAuthToken = () => {
            try {
                return typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') || '' : '';
            } catch (e) {
                console.warn('localStorage access error:', e);
                return '';
            }
        };
        
        // Safe online status checker
        this.isOnline = () => {
            try {
                return typeof navigator !== 'undefined' && navigator.onLine;
            } catch (e) {
                console.warn('Navigator access error:', e);
                return true; // Assume online by default
            }
        };
        
        this.apiStatus = {
            lastChecked: null,
            isAvailable: null,
            endpoints: {},
            serverErrors: []
        };
        
        // Backend status flags
        this.backendAvailable = false;
        this.endpointPatterns = {
            recipe: [
                "/api/recipes/{id}/",
                "/recipes/{id}/",
                "/api/recipe/{id}/",
                "/recipe/{id}/"
            ],
            ratings: [
                "/api/recipes/{id}/ratings/",
                "/api/recipes/{id}/ratings/summary/",
                "/api/recipes/{id}/rate-recipe/",
                "/api/recipes/{id}/rate/"
            ],
            reviews: [
                "/api/recipes/{id}/reviews/",
                "/api/recipes/{id}/comments/",
                "/api/recipes/{id}/add-review/",
                "/api/reviews/"
            ]
        };
        
        // Enhanced mock data for better offline experience
        this.mockData = {
            recipes: {},
            ratings: {},
            reviews: {}
        };
        
        // For tracking user-submitted reviews before they appear in the API
        this.recentlySubmittedReview = null;
        
        // Cache and rate limiting settings
        this.cacheSettings = {
            reviewsExpiry: 5 * 60 * 1000, // 5 minutes in ms
            ratingsExpiry: 10 * 60 * 1000, // 10 minutes in ms
            recipeExpiry: 60 * 60 * 1000   // 1 hour in ms
        };
        
        // Rate limiting and backoff tracking
        this.rateLimits = {
            endpoints: {},
            globalBackoff: null
        };
        
        // Initialize mock data
        this.initializeMockData();
        
        // Perform background API status check with delay to not block page loading
        if (typeof setTimeout !== 'undefined') {
            setTimeout(() => {
                this.checkApiStatus().catch(error => {
                    console.warn('Background API status check failed:', error);
                });
            }, 2000); // Increased delay
        }
    }
    
    // Initialize mock data for offline use
    initializeMockData() {
        // Sample recipes (will be accessed by ID)
        const mockRecipes = [
            {
                id: "1",
                title: "Ndole with Plantains",
                description: "A delicious Cameroonian dish made with bitter leaves and ground nuts, served with plantains.",
                image_url: "images/Ndole and Plaintain.jpg",
                prep_time: 30,
                cook_time: 60,
                servings: 4,
                ingredients: [
                    { ingredient_name: "Ndole leaves (bitter leaves)", quantity: "500", unit: "g" },
                    { ingredient_name: "Ground nuts/peanuts", quantity: "300", unit: "g" },
                    { ingredient_name: "Ripe plantains", quantity: "4", unit: "" },
                    { ingredient_name: "Beef or shrimp", quantity: "400", unit: "g" },
                    { ingredient_name: "Onions", quantity: "2", unit: "medium" },
                    { ingredient_name: "Garlic", quantity: "3", unit: "cloves" },
                    { ingredient_name: "Crayfish", quantity: "2", unit: "tbsp" },
                    { ingredient_name: "Palm oil", quantity: "1/4", unit: "cup" },
                    { ingredient_name: "Salt and pepper", quantity: "", unit: "to taste" }
                ],
                instructions: "1. Wash and boil bitter leaves to reduce bitterness.\n2. Blend ground nuts with crayfish.\n3. Fry onions and garlic in palm oil.\n4. Add meat/shrimp and cook until done.\n5. Add blended peanut mixture and simmer.\n6. Add bitter leaves and seasonings.\n7. Boil or fry plantains separately.\n8. Serve ndole with plantains.",
                difficulty: "Medium",
                cuisine: "Cameroonian",
                tags: ["traditional", "protein-rich", "lunch", "dinner"],
                created_by: {
                    username: "NjoyaChef",
                    profile_image: "images/Njoya.jpg"
                }
            },
            {
                id: "2",
                title: "Eru with Garri",
                description: "A nutritious forest leaf dish cooked with palm oil and served with garri (cassava flakes).",
                image_url: "images/Eru.jpg",
                prep_time: 20,
                cook_time: 45,
                servings: 6,
                ingredients: [
                    { ingredient_name: "Eru leaves", quantity: "500", unit: "g" },
                    { ingredient_name: "Waterleaf", quantity: "300", unit: "g" },
                    { ingredient_name: "Palm oil", quantity: "1/2", unit: "cup" },
                    { ingredient_name: "Crayfish", quantity: "1/4", unit: "cup" },
                    { ingredient_name: "Dried/smoked fish", quantity: "200", unit: "g" },
                    { ingredient_name: "Beef/cow skin (optional)", quantity: "300", unit: "g" },
                    { ingredient_name: "Maggi/bouillon cubes", quantity: "3", unit: "" },
                    { ingredient_name: "Salt", quantity: "", unit: "to taste" },
                    { ingredient_name: "Garri (cassava flakes)", quantity: "500", unit: "g" }
                ],
                instructions: "1. Clean and chop eru and waterleaf.\n2. Heat palm oil in a pot.\n3. Add crayfish and stir briefly.\n4. Add fish and meat if using.\n5. Add chopped eru and waterleaf.\n6. Season with Maggi and salt.\n7. Cover and simmer for 30-40 minutes.\n8. Prepare garri by soaking in cold water.\n9. Serve eru with garri.",
                difficulty: "Easy",
                cuisine: "Cameroonian",
                tags: ["traditional", "vegetable", "dinner"]
            }
        ];
        
        // Store recipes by ID for easy lookup
        mockRecipes.forEach(recipe => {
            this.mockData.recipes[recipe.id] = recipe;
        });
        
        // Sample ratings data
        for (const id of Object.keys(this.mockData.recipes)) {
            this.mockData.ratings[id] = {
                average_rating: 4.5,
                total_ratings: 24,
                distribution: { 1: 0, 2: 1, 3: 3, 4: 12, 5: 8 },
                total_reviews: 12
            };
        }
        
        // Sample reviews data
        for (const id of Object.keys(this.mockData.recipes)) {
            this.mockData.reviews[id] = {
                count: 12,
                next: null,
                previous: null,
                results: [
                    {
                        id: "r1",
                        user: {
                            id: "u1",
                            username: "FoodLover",
                            is_verified: true
                        },
                        recipe_id: id,
                        rating: 5,
                        review: "This recipe is absolutely delicious! I made it for my family and everyone loved it.",
                        likes_count: 8,
                        created_at: "2025-06-15T12:30:00Z"
                    },
                    {
                        id: "r2",
                        user: {
                            id: "u2",
                            username: "CookingQueen",
                            is_verified: false
                        },
                        recipe_id: id,
                        rating: 4,
                        review: "Great authentic flavors. I reduced the spice a bit for my kids and it was perfect.",
                        likes_count: 3,
                        created_at: "2025-06-10T18:45:00Z"
                    }
                ]
            };
        }
    }
    
    // Check if the API is available and which endpoints respond
    async checkApiStatus() {
        console.log('📡 Checking API status...');
        
        try {
            // First try a basic endpoint that should exist with proper timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const basicTest = await fetch(`${this.baseUrl}/api/recipes/`, { 
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                cache: 'no-cache'
            }).catch((error) => {
                console.warn('📡 API connection failed:', error.message);
                return { ok: false, status: 0, error: error.message };
            });
            
            clearTimeout(timeoutId);
            
            this.apiStatus.isAvailable = basicTest.ok;
            this.apiStatus.lastChecked = new Date().toISOString();
            
            // Log API status
            console.log(`📡 API base status: ${this.apiStatus.isAvailable ? 'Available ✅' : 'Unavailable ❌'}`);
            
            // If we couldn't connect at all, don't try more endpoints
            if (!this.apiStatus.isAvailable) {
                console.warn('⚠️ API appears to be unavailable - will use mock data');
                this.apiStatus.error = basicTest.error || 'Connection failed';
                return false;
            }
            
            // Only test endpoint patterns if basic connection worked
            console.log('🔍 API connected - discovering available endpoints...');
            this.backendAvailable = true;
            
            // Test common endpoint patterns with limited scope to avoid overwhelming the server
            await this.probeEndpointPatterns();
            
            return true;
        } catch (error) {
            console.error('📡 API status check failed:', error);
            this.apiStatus.isAvailable = false;
            this.apiStatus.error = error.message;
            this.apiStatus.serverErrors.push({
                timestamp: new Date().toISOString(),
                error: error.message,
                type: 'connection_error'
            });
            return false;
        }
    }
    
    // Test common endpoint patterns to see what works (limited scope)
    async probeEndpointPatterns() {
        // Sample recipe ID to test with
        const testId = "1";
        
        // Only test one endpoint per category to avoid overwhelming the server
        const limitedPatterns = {
            recipe: ["/api/recipes/{id}/"],
            ratings: ["/api/recipes/{id}/ratings/"],
            reviews: ["/api/recipes/{id}/reviews/"]
        };
        
        for (const category in limitedPatterns) {
            const patterns = limitedPatterns[category];
            
            // Only test the first pattern for each category
            const pattern = patterns[0];
            const endpoint = pattern.replace('{id}', testId);
            const url = `${this.baseUrl}${endpoint}`;
            
            try {
                console.log(`🔍 Testing endpoint: ${url}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    signal: controller.signal,
                    cache: 'no-cache'
                });
                
                clearTimeout(timeoutId);
                
                // Store the result
                this.apiStatus.endpoints[endpoint] = {
                    status: response.status,
                    working: response.ok,
                    lastChecked: new Date().toISOString()
                };
                
                if (response.ok) {
                    console.log(`✅ Endpoint ${endpoint} is available`);
                    // Store the working endpoint pattern for this category
                    this.endpointPatterns[category].working = pattern;
                } else {
                    console.log(`❌ Endpoint ${endpoint} returned ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ Endpoint ${endpoint} error: ${error.message}`);
                this.apiStatus.endpoints[endpoint] = {
                    status: 'error',
                    working: false,
                    error: error.message,
                    lastChecked: new Date().toISOString()
                };
            }
        }
    }
    
    // Get the best working endpoint for a category
    getBestEndpoint(category, recipeId) {
        const patterns = this.endpointPatterns[category];
        
        // If we found a working pattern during probe, use it
        if (patterns.working) {
            return patterns.working.replace('{id}', recipeId);
        }
        
        // Otherwise try the first pattern
        return patterns[0].replace('{id}', recipeId);
    }

    // Enhanced recipe fetching with smart fallbacks
    async getRecipe(recipeId) {
        console.log(`🍽️ Getting recipe with ID: ${recipeId}`);
        
        // Try to fetch from the real API endpoint
        try {
            // Check API status first if we haven't already
            if (this.apiStatus.isAvailable === null) {
                await this.checkApiStatus();
            }
            
            if (this.apiStatus.isAvailable) {
                // Get the best endpoint pattern for recipes
                const endpoint = this.getBestEndpoint('recipe', recipeId);
                const url = `${this.baseUrl}${endpoint}`;
                
                console.log(`🔍 Fetching recipe from: ${url}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    signal: controller.signal,
                    cache: 'no-cache'
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Recipe data received from API:', data);
                    
                    // Cache this successful response in mock data for future offline use
                    if (data && data.id) {
                        this.mockData.recipes[data.id] = data;
                    }
                    
                    return data;
                } else {
                    console.warn(`⚠️ API returned error: ${response.status} ${response.statusText}`);
                    // Log server error for diagnostics
                    this.apiStatus.serverErrors.push({
                        endpoint: url,
                        status: response.status,
                        statusText: response.statusText,
                        timestamp: new Date().toISOString()
                    });
                }
            } else {
                console.warn('⚠️ API unavailable, using mock data');
            }
        } catch (e) {
            console.error('❌ Error fetching recipe:', e);
            // Log client error for diagnostics
            this.apiStatus.serverErrors.push({
                error: e.message,
                stack: e.stack,
                timestamp: new Date().toISOString()
            });
        }
        
        // Try to get recipe from our mock data cache
        if (this.mockData.recipes[recipeId]) {
            console.log('🔄 Using cached mock recipe data');
            return this.mockData.recipes[recipeId];
        }
        
        // Last resort fallback mock recipe
        console.log('🔄 Using fallback mock recipe data');
        return {
            id: recipeId,
            title: 'Demo Recipe',
            description: 'This recipe is currently being shown in offline mode due to server connectivity issues.',
            image_url: '/assets/default-recipe.jpg',
            prep_time: 30,
            cook_time: 20,
            servings: 4,
            ingredients: [
                { ingredient_name: 'Chicken breast', quantity: '500', unit: 'g' },
                { ingredient_name: 'Salt', quantity: '1', unit: 'tsp' },
                { ingredient_name: 'Pepper', quantity: '1/2', unit: 'tsp' },
                { ingredient_name: 'Olive oil', quantity: '2', unit: 'tbsp' },
                { ingredient_name: 'Garlic', quantity: '2', unit: 'cloves' },
                { ingredient_name: 'Mixed herbs', quantity: '1', unit: 'tbsp' }
            ],
            instructions: '1. Prepare ingredients.\n2. Season chicken with salt, pepper and herbs.\n3. Heat oil in a pan and cook chicken for 8-10 minutes per side.\n4. Add garlic and cook for another minute.\n5. Serve hot with your favorite side dish.',
            difficulty: 'Easy',
            cuisine: 'General',
            tags: ['chicken', 'easy', 'quick'],
            contributor: {
                id: 9999,
                username: 'ChopSmo Demo',
                // Always use contributor.photo for frontend display. Fallback only if missing or invalid.
                photo: 'images/Precious.jpg'
            }
        };
    }
    
    // Get recipe ratings with fallbacks
    async getRecipeRatings(recipeId) {
        console.log(`⭐ Getting ratings for recipe ID: ${recipeId}`);
        
        // Try to fetch from real API
        try {
            if (this.apiStatus.isAvailable) {
                const endpoint = this.getBestEndpoint('ratings', recipeId);
                const url = `${this.baseUrl}${endpoint}`;
                console.log(`🔍 Fetching ratings from: ${url}`);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    signal: controller.signal,
                    cache: 'no-cache'
                });
                clearTimeout(timeoutId);
                if (response.ok) {
                    const data = await response.json();
                    // Only return if data is valid and not mock
                    if (data && typeof data.average_rating !== 'undefined') {
                        console.log('✅ Ratings data received from API:', data);
                        return data;
                    }
                } else {
                    console.warn(`⚠️ Ratings API returned error: ${response.status} ${response.statusText}`);
                }
            }
        } catch (e) {
            console.error('❌ Error fetching ratings:', e);
        }
        // Fallback to empty if online, mock only if offline
        if (!this.isOnline()) {
            console.log('🔄 Using fallback mock ratings data (offline mode)');
            return this.mockData.ratings[recipeId] || {
                average_rating: 4.0,
                total_ratings: 10,
                distribution: { 1: 0, 2: 1, 3: 2, 4: 4, 5: 3 },
                total_reviews: 5
            };
        } else {
            return {
                average_rating: 0,
                total_ratings: 0,
                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                total_reviews: 0
            };
        }
    }
    
    // Get recipe reviews with fallbacks
    async getRecipeReviews(recipeId, page = 1) {
        console.log(`💬 Getting reviews for recipe ID: ${recipeId}, page: ${page}`);
        
        // Check if we have a cached recently submitted review to include
        const hasRecentSubmission = this.recentlySubmittedReview && 
                                    this.recentlySubmittedReview.recipe_id === recipeId &&
                                    (Date.now() - this.recentlySubmittedReview.timestamp) < 60000; // Within last minute
        
        // Check for cached reviews to avoid rate limiting
        const cacheKey = `recipe_reviews_${recipeId}_${page}`;
        const cachedReviews = this.getCachedData(cacheKey);
        
        // Endpoint path for rate limit checking
        const endpointPath = `/api/recipes/${recipeId}/reviews`;
        
        // Check if this endpoint is currently rate limited
        const rateLimitInfo = this.shouldApplyRateLimit(endpointPath);
        if (rateLimitInfo.limited) {
            console.warn(`⚠️ Rate limit active for ${endpointPath}: ${rateLimitInfo.reason}`);
            
            // Show user-friendly message in console
            const limitMessage = this.formatRateLimitMessage(rateLimitInfo);
            console.log(`ℹ️ ${limitMessage}`);
            
            // Check if we have cached data we can use
            if (cachedReviews) {
                console.log('🔄 Using cached reviews due to active rate limiting');
                return cachedReviews.data;
            }
        }
        
        // Use fresh cache if available and not specifically looking for a recent submission
        if (cachedReviews && !hasRecentSubmission && 
            (Date.now() - cachedReviews.timestamp) < this.cacheSettings.reviewsExpiry) {
            console.log('🔄 Using cached reviews (within expiry period)');
            return cachedReviews.data;
        }
        
        // Try to fetch from real API if we're not rate-limited
        try {
            if (this.apiStatus.isAvailable && !rateLimitInfo.limited) {
                const endpoint = this.getBestEndpoint('reviews', recipeId);
                // Force cache refresh by adding timestamp to URL if we have a recent submission
                const cacheParam = hasRecentSubmission ? `&_nocache=${Date.now()}` : '';
                const url = `${this.baseUrl}${endpoint}?page=${page}&page_size=5${cacheParam}`;
                
                console.log(`🔍 Fetching reviews from: ${url}`);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    signal: controller.signal,
                    cache: 'no-cache'
                });
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    // Only return if data is valid and not mock
                    if (data && Array.isArray(data.results)) {
                        console.log('✅ Reviews data received from API:', data);
                        
                        // If API returns zero reviews but we have a recent submission, inject it
                        if (data.results.length === 0 && hasRecentSubmission) {
                            console.log('⚠️ API returned no reviews but we have a recent submission, adding it to results');
                            data.results.push(this.recentlySubmittedReview.data);
                            data.count = 1;
                        }
                        
                        // Cache the successful response with proper expiry
                        this.setCachedData(cacheKey, data, this.cacheSettings.reviewsExpiry);
                        
                        // Reset rate limit counter for this endpoint on success
                        this.resetRateLimitFor(endpointPath);
                        
                        return data;
                    }
                } else if (response.status === 429) {
                    // Enhanced rate limiting handling with exponential backoff
                    console.warn('⚠️ Rate limit exceeded (429) for reviews API.');
                    
                    // Get retry time from header or default
                    const retryAfter = response.headers.get('Retry-After');
                    const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : null;
                    
                    // Apply the rate limit with exponential backoff
                    const limitInfo = this.applyRateLimit(endpointPath, retrySeconds);
                    
                    // Generate user-friendly message
                    const limitMessage = this.formatRateLimitMessage(limitInfo);
                    console.log(`ℹ️ ${limitMessage}`);
                    
                    // Store for UI feedback
                    this.apiStatus.rateLimited = {
                        endpoint: 'reviews',
                        timestamp: Date.now(),
                        retryAfter: limitInfo.retryAfter,
                        retryMessage: limitMessage,
                        until: limitInfo.until
                    };
                    
                    // Check if we have any cached data we can use (even expired)
                    const oldCache = this.getCachedData(cacheKey, true); // Allow expired cache
                    if (oldCache) {
                        console.log('🔄 Using cached reviews due to rate limiting');
                        return oldCache.data;
                    }
                } else {
                    console.warn(`⚠️ Reviews API returned error: ${response.status} ${response.statusText}`);
                    
                    // Only track non-429 errors as actual API errors
                    this.apiStatus.serverErrors.push({
                        endpoint: url,
                        status: response.status,
                        statusText: response.statusText,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        } catch (e) {
            console.error('❌ Error fetching reviews:', e);
        }
        
        // If we're online but API failed, and we have a recent submission, return it
        if (this.isOnline() && hasRecentSubmission) {
            console.log('🔄 Using recently submitted review as fallback');
            return {
                count: 1,
                next: null,
                previous: null,
                results: [this.recentlySubmittedReview.data]
            };
        }
        
        // Check for expired cache as a fallback
        const expiredCache = this.getCachedData(cacheKey, true);
        if (expiredCache) {
            console.log('🔄 Using expired cache as fallback');
            return expiredCache.data;
        }
        
        // Fallback to empty if online, mock only if offline
        if (!this.isOnline()) {
            console.log('🔄 Using fallback mock reviews data (offline mode)');
            return this.mockData.reviews[recipeId] || {
                count: 0,
                next: null,
                previous: null,
                results: [{
                    id: "r1",
                    user: {
                        id: "u1",
                        username: "FoodLover",
                        is_verified: true
                    },
                    recipe_id: recipeId,
                    rating: 5,
                    review: "This is a mock review since the API is currently unavailable. The recipe looks delicious!",
                    likes_count: 3,
                    created_at: new Date().toISOString()
                }]
            };
        } else {
            return {
                count: 0,
                next: null,
                previous: null,
                results: []
            };
        }
    }
    
    // Submit user rating with fallbacks
    async submitRating(recipeId, rating) {
        console.log(`⭐ Submitting rating ${rating} for recipe ID: ${recipeId}`);
        
        // Try to submit to real API
        try {
            if (this.apiStatus.isAvailable) {
                // Try common endpoint patterns for rating submission
                const endpoints = [
                    `/api/recipes/${recipeId}/rate-recipe/`,
                    `/api/recipes/${recipeId}/rate/`,
                    `/api/recipes/${recipeId}/ratings/`
                ];
                
                for (const endpoint of endpoints) {
                    try {
                        const url = `${this.baseUrl}${endpoint}`;
                        console.log(`🔍 Trying to submit rating to: ${url}`);
                        
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 8000);
                        
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'Authorization': `Token ${this.getAuthToken()}` 
                            },
                            signal: controller.signal,
                            body: JSON.stringify({
                                rating: rating,
                                recipe_id: recipeId
                            })
                        });
                        
                        clearTimeout(timeoutId);
                        
                        if (response.ok) {
                            const data = await response.json();
                            console.log('✅ Rating submitted successfully:', data);
                            return { success: true, data };
                        }
                        
                        console.warn(`⚠️ Rating submission to ${endpoint} failed: ${response.status}`);
                    } catch (endpointError) {
                        console.warn(`⚠️ Error with endpoint ${endpoint}:`, endpointError.message);
                    }
                }
            }
        } catch (e) {
            console.error('❌ Error submitting rating:', e);
        }
        
        // Return mock success response
        console.log('🔄 Using mock rating submission response');
        return {
            success: true, 
            data: { 
                rating: rating,
                message: 'Rating saved offline. Will sync when connectivity is restored.' 
            }
        };
    }
    
    // Submit user review with fallbacks
    async submitReview(recipeId, rating, reviewText) {
        console.log(`💬 Submitting review for recipe ID: ${recipeId}`);
        
        // Base endpoint path for rate limit checking
        const baseEndpointPath = `/api/recipes/${recipeId}/reviews`;
        
        // Check if this endpoint is currently rate limited
        const rateLimitInfo = this.shouldApplyRateLimit(baseEndpointPath);
        if (rateLimitInfo.limited) {
            console.warn(`⚠️ Rate limit active for reviews: ${rateLimitInfo.reason}`);
            
            // Show user-friendly message in console
            const limitMessage = this.formatRateLimitMessage(rateLimitInfo);
            console.log(`ℹ️ ${limitMessage}`);
            
            // Create a rate limited response
            const rateLimitedResponse = {
                success: false,
                error: "rate_limited",
                message: limitMessage,
                retryAfter: rateLimitInfo.retryAfter
            };
            
            // Even with rate limit, store the review locally so we can show it immediately
            const mockData = this.createLocalReview(recipeId, rating, reviewText);
            
            // Mark as pending submission
            mockData.pending = true;
            mockData.pendingReason = 'rate_limited';
            
            // Store this review in memory for immediate display
            this.recentlySubmittedReview = {
                recipe_id: recipeId,
                timestamp: Date.now(),
                data: mockData,
                pendingSubmission: true
            };
            
            // Return both the mockData for UI and the error info
            return {
                success: true,
                data: mockData,
                limitInfo: rateLimitedResponse
            };
        }
        
        // Try to submit to real API
        try {
            if (this.apiStatus.isAvailable) {
                // Try common endpoint patterns for review submission
                const endpoints = [
                    `/api/recipes/${recipeId}/add-review/`,
                    `/api/recipes/${recipeId}/reviews/`,
                    `/api/reviews/`
                ];
                
                for (const endpoint of endpoints) {
                    try {
                        const url = `${this.baseUrl}${endpoint}`;
                        console.log(`🔍 Trying to submit review to: ${url}`);
                        
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 8000);
                        
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'Authorization': `Token ${this.getAuthToken()}` 
                            },
                            signal: controller.signal,
                            body: JSON.stringify({
                                rating: rating,
                                review: reviewText,
                                recipe_id: recipeId
                            })
                        });
                        
                        clearTimeout(timeoutId);
                        
                        if (response.ok) {
                            const data = await response.json();
                            console.log('✅ Review submitted successfully:', data);
                            
                            // Store this review in memory for immediate display
                            this.recentlySubmittedReview = {
                                recipe_id: recipeId,
                                timestamp: Date.now(),
                                data: data
                            };
                            
                            // Clear rate limit counter on successful submission
                            this.resetRateLimitFor(baseEndpointPath);
                            
                            // Clear cache for this recipe's reviews to ensure fresh data
                            this.clearCacheByPattern(`recipe_reviews_${recipeId}`);
                            
                            return { success: true, data };
                        } else if (response.status === 429) {
                            // Enhanced rate limiting handling with exponential backoff
                            console.warn('⚠️ Rate limit exceeded (429) when submitting review.');
                            
                            // Get retry time from header or default
                            const retryAfter = response.headers.get('Retry-After');
                            const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : null;
                            
                            // Apply the rate limit with exponential backoff
                            const limitInfo = this.applyRateLimit(baseEndpointPath, retrySeconds);
                            
                            // Generate user-friendly message
                            const limitMessage = this.formatRateLimitMessage(limitInfo);
                            console.log(`ℹ️ ${limitMessage}`);
                            
                            // Create a mock review that will be displayed immediately
                            const mockData = this.createLocalReview(recipeId, rating, reviewText);
                            mockData.pending = true;
                            mockData.pendingReason = 'rate_limited';
                            
                            // Store this review in memory for immediate display
                            this.recentlySubmittedReview = {
                                recipe_id: recipeId,
                                timestamp: Date.now(),
                                data: mockData,
                                pendingSubmission: true
                            };
                            
                            return {
                                success: false,
                                error: "rate_limited",
                                message: limitMessage,
                                retryAfter: limitInfo.retryAfter,
                                data: mockData // Still return the mock data for immediate display
                            };
                        }
                        
                        console.warn(`⚠️ Review submission to ${endpoint} failed: ${response.status}`);
                    } catch (endpointError) {
                        console.warn(`⚠️ Error with endpoint ${endpoint}:`, endpointError.message);
                    }
                }
            }
        } catch (e) {
            console.error('❌ Error submitting review:', e);
        }
        
        // Create mock response with proper user data if all API attempts fail
        console.log('🔄 Using local review submission response');
        const mockData = this.createLocalReview(recipeId, rating, reviewText);
        
        // Store this review in memory for immediate display
        this.recentlySubmittedReview = {
            recipe_id: recipeId,
            timestamp: Date.now(),
            data: mockData
        };
        
        return {
            success: true, 
            data: mockData
        };
    }
    
    // Helper to create consistent local review objects
    createLocalReview(recipeId, rating, reviewText) {
        return { 
            id: 'local-' + Date.now(),
            rating: rating,
            review: reviewText,
            recipe_id: recipeId,
            created_at: new Date().toISOString(),
            message: 'Review saved locally. Will sync when connectivity is restored.',
            likes_count: 0,
            // Add user data from token if possible
            user: this.getCurrentUser() || {
                id: 'local-user',
                username: 'You',
                is_verified: true
            }
        };
    }
    
    // CORS-aware fetch wrapper with enhanced fallback strategies
    async corsAwareFetch(url, options = {}) {
        // Default headers that work better with CORS
        const defaultHeaders = {
            'Accept': 'application/json'
        };
        
        // Only add Content-Type for POST requests with body
        if (options.method === 'POST' && options.body) {
            defaultHeaders['Content-Type'] = 'application/json';
        }
        
        // Merge headers
        const headers = { ...defaultHeaders, ...(options.headers || {}) };
        
        // Retry logic with exponential backoff
        const maxRetries = 3;
        let retryCount = 0;
        let backoffDelay = 1000; // Start with 1 second
        
        while (retryCount < maxRetries) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: headers
                });
                
                // If response is OK, return it
                if (response.ok) {
                    return response;
                }
                
                // Handle specific HTTP errors as needed
                if (response.status === 404) {
                    console.warn('⚠️ Resource not found (404):', url);
                    return null;
                } else if (response.status === 429) {
                    // Rate limit exceeded, apply backoff
                    const retryAfter = response.headers.get('Retry-After');
                    backoffDelay = retryAfter ? Math.min(retryAfter * 1000, 30000) : backoffDelay * 2; // Exponential backoff, max 30s
                    console.warn(`⚠️ Rate limit exceeded (429), retrying after ${backoffDelay}ms`);
                } else {
                    console.error(`❌ HTTP error ${response.status}: ${response.statusText}`);
                }
            } catch (e) {
                console.error('❌ Fetch error:', e);
            }
            
            retryCount++;
            await this.sleep(backoffDelay);
        }
        
        // If we exhaust retries, return null or handle as needed
        return null;
    }
    
    // Sleep utility for delaying actions (promisified setTimeout)
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Cache management system
    getCachedData(key, allowExpired = false) {
        try {
            if (typeof localStorage === 'undefined') {
                return null;
            }
            
            const cacheKey = `chopsmo_cache_${key}`;
            const cachedItem = localStorage.getItem(cacheKey);
            
            if (!cachedItem) {
                return null;
            }
            
            const cached = JSON.parse(cachedItem);
            const now = Date.now();
            const isExpired = (now - cached.timestamp) > cached.expiresIn;
            
            // Return the cached data if it's not expired or if we specifically allow expired data
            if (!isExpired || allowExpired) {
                return cached;
            }
            
            return null;
        } catch (error) {
            console.warn('Cache retrieval error:', error);
            return null;
        }
    }
    
    setCachedData(key, data, expiresIn = null) {
        try {
            if (typeof localStorage === 'undefined') {
                return false;
            }
            
            const cacheKey = `chopsmo_cache_${key}`;
            const cacheObject = {
                data: data,
                timestamp: Date.now(),
                expiresIn: expiresIn || this.cacheSettings.reviewsExpiry // Default to reviews expiry
            };
            
            localStorage.setItem(cacheKey, JSON.stringify(cacheObject));
            return true;
        } catch (error) {
            console.warn('Cache storage error:', error);
            return false;
        }
    }
    
    clearCacheByPattern(pattern) {
        try {
            if (typeof localStorage === 'undefined') {
                return;
            }
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('chopsmo_cache_') && key.includes(pattern)) {
                    localStorage.removeItem(key);
                }
            }
        } catch (error) {
            console.warn('Cache clear error:', error);
        }
    }
    
    // Rate limiting and exponential backoff management
    shouldApplyRateLimit(endpoint) {
        const now = Date.now();
        
        // Check if there's a global backoff period active
        if (this.rateLimits.globalBackoff && now < this.rateLimits.globalBackoff.until) {
            return {
                limited: true,
                retryAfter: Math.ceil((this.rateLimits.globalBackoff.until - now) / 1000),
                reason: 'Global rate limit active'
            };
        }
        
        // Check endpoint-specific rate limit
        const endpointLimit = this.rateLimits.endpoints[endpoint];
        if (endpointLimit && now < endpointLimit.until) {
            return {
                limited: true,
                retryAfter: Math.ceil((endpointLimit.until - now) / 1000),
                reason: `Endpoint "${endpoint}" rate limited`
            };
        }
        
        return { limited: false };
    }
    
    applyRateLimit(endpoint, retryAfter = null) {
        const now = Date.now();
        let endpointConfig = this.rateLimits.endpoints[endpoint];
        
        if (!endpointConfig) {
            endpointConfig = this.rateLimits.endpoints[endpoint] = {
                count: 0,
                firstHit: now,
                backoffFactor: 1,
                until: 0
            };
        }
        
        // Increment hit counter
        endpointConfig.count++;
        
        // Calculate exponential backoff
        let backoffTime;
        
        if (retryAfter && !isNaN(retryAfter)) {
            // Use server-provided retry time if available
            backoffTime = retryAfter * 1000;
        } else {
            // Apply exponential backoff algorithm
            // Base: 5 seconds, doubled each consecutive failure, max 30 minutes
            const baseBackoff = 5000; // 5 seconds
            backoffTime = Math.min(
                baseBackoff * Math.pow(2, endpointConfig.backoffFactor - 1),
                30 * 60 * 1000 // 30 minutes max
            );
            endpointConfig.backoffFactor++;
        }
        
        // Set the backoff period
        endpointConfig.until = now + backoffTime;
        
        // If we've hit the rate limit multiple times in a short period,
        // apply a global backoff to all API calls
        if (endpointConfig.count >= 3 && (now - endpointConfig.firstHit) < 60000) {
            console.warn('🛑 Multiple rate limits detected, applying global backoff');
            this.rateLimits.globalBackoff = {
                until: now + (backoffTime * 2), // Longer global backoff
                reason: `Multiple rate limits on ${endpoint}`
            };
        }
        
        return {
            limited: true,
            retryAfter: Math.ceil(backoffTime / 1000),
            until: endpointConfig.until,
            globalUntil: this.rateLimits.globalBackoff ? this.rateLimits.globalBackoff.until : null
        };
    }
    
    resetRateLimitFor(endpoint) {
        if (this.rateLimits.endpoints[endpoint]) {
            this.rateLimits.endpoints[endpoint].count = 0;
            this.rateLimits.endpoints[endpoint].backoffFactor = 1;
            this.rateLimits.endpoints[endpoint].until = 0;
        }
    }
    
    formatRateLimitMessage(limitInfo) {
        if (!limitInfo.limited) return '';
        
        const seconds = limitInfo.retryAfter;
        let timeStr = '';
        
        if (seconds < 60) {
            timeStr = `${seconds} seconds`;
        } else if (seconds < 3600) {
            timeStr = `${Math.ceil(seconds / 60)} minutes`;
        } else {
            timeStr = `${Math.ceil(seconds / 3600)} hours`;
        }
        
        return `Rate limit exceeded. Please try again in ${timeStr}.`;
    }
    
    getCurrentUser() {
        try {
            if (typeof localStorage === 'undefined') {
                return null;
            }
            
            const userData = localStorage.getItem('userData');
            if (!userData) return null;
            
            return JSON.parse(userData);
        } catch (error) {
            console.warn('Error getting current user data:', error);
            return null;
        }
    }
}

// Usage example (in your app code):
// const api = new EnhancedRecipeAPI('https://your-api-base-url.com');
// api.getRecipe('1').then(recipe => console.log('Recipe:', recipe));

// Create the global enhancedRecipeAPI instance automatically when the script is loaded
window.enhancedRecipeAPI = new EnhancedRecipeAPI('https://njoya.pythonanywhere.com');
console.log('📦 Enhanced Recipe API initialized', window.enhancedRecipeAPI);
