/**
 * ChopSmo Recipe Rating & Comments System
 * - Star rating functionality
 * - Reviews and comments
 * - Social interactions (likes, etc)
 * - Authenticated operations
 */

class RecipeRatingSystem {
    constructor() {
        const apiBase = (typeof window !== 'undefined' && typeof window.getChopsmoApiBaseUrl === 'function')
            ? window.getChopsmoApiBaseUrl()
            : ((typeof window !== 'undefined' && window.CHOPSMO_CONFIG && window.CHOPSMO_CONFIG.API_BASE_URL)
                ? window.CHOPSMO_CONFIG.API_BASE_URL
                : 'https://api.chopsmo.site');
        if (typeof window !== 'undefined' && typeof window.buildChopsmoApiUrl === 'function') {
            this.baseUrl = window.buildChopsmoApiUrl('/').replace(/\/$/, '');
        } else {
            this.baseUrl = `${apiBase.replace(/\/$/, '')}/api`;
        }
        this.recipeId = null;
        this.currentPage = 1;
        this.hasMoreComments = false;
        this.userRating = 0;
        this.isAuthenticated = false;
        this.commentsPerPage = 5;
        this.isSubmitting = false;
        
    // Check authentication status (normalized)
    this.authToken = window.getAuthToken && window.getAuthToken();
    this.isAuthenticated = !!this.authToken;
        
        // Initialize when document is ready
        document.addEventListener('DOMContentLoaded', () => {
            try {
                console.log('Initializing Recipe Rating System');
                this.initializeElements();
                this.setupEventListeners();
                
                // Get recipe ID from URL
                const urlParams = new URLSearchParams(window.location.search);
                this.recipeId = urlParams.get('id');
                
                if (this.recipeId) {
                    console.log('Recipe ID found:', this.recipeId);
                    
                    // Start non-critical operations with delays to not block page loading
                    setTimeout(() => {
                        try {
                            this.loadRatingsAndReviews();
                        } catch(err) {
                            console.warn('Loading ratings failed:', err);
                        }
                    }, 1000); // Increased delay to allow page to load first
                } else {
                    console.error('No recipe ID found in URL');
                }
            } catch (error) {
                console.error('Recipe Rating System initialization failed:', error);
            }
        });
    }
    
    // Simplified initialization without aggressive endpoint discovery
    initializeForRecipe() {
        // This method can be called later if needed for advanced API discovery
        console.log('Recipe rating system ready for recipe ID:', this.recipeId);
    }
    
    initializeElements() {
        // Rating summary elements
        this.averageRatingValue = document.getElementById('averageRatingValue');
        this.averageStarsDisplay = document.getElementById('averageStarsDisplay');
        this.ratingCount = document.getElementById('ratingCount');
        this.ratingBreakdown = document.getElementById('ratingBreakdown');
        
        // User rating elements
        this.userRatingSection = document.getElementById('userRatingSection');
        this.ratingLoginPrompt = document.getElementById('ratingLoginPrompt');
        this.userRatingStars = document.getElementById('userRatingStars');
        this.reviewForm = document.getElementById('reviewForm');
        this.reviewText = document.getElementById('reviewText');
        this.charCount = document.getElementById('charCount');
        this.submitReviewBtn = document.getElementById('submitReviewBtn');
        
        // Comments elements
        this.commentCount = document.getElementById('commentCount');
        this.commentsContainer = document.getElementById('commentsContainer');
        this.loadMoreContainer = document.getElementById('loadMoreContainer');
        this.loadMoreCommentsBtn = document.getElementById('loadMoreCommentsBtn');
        
        // Show appropriate sections based on authentication
        this.updateUIForAuth();
    }
    
    updateUIForAuth() {
        if (this.isAuthenticated) {
            if (this.ratingLoginPrompt) this.ratingLoginPrompt.style.display = 'none';
            if (this.userRatingStars) this.userRatingStars.style.display = 'flex';
            if (this.reviewForm) this.reviewForm.style.display = 'block';
        } else {
            if (this.ratingLoginPrompt) this.ratingLoginPrompt.style.display = 'block';
            if (this.userRatingStars) this.userRatingStars.style.display = 'none';
            if (this.reviewForm) this.reviewForm.style.display = 'none';
        }
    }
    
    setupEventListeners() {
        // Set up star rating UI
        if (this.userRatingStars) {
            const stars = this.userRatingStars.querySelectorAll('.star');
            stars.forEach(star => {
                star.addEventListener('click', () => {
                    const rating = parseInt(star.dataset.rating, 10);
                    this.userRating = rating;
                    this.updateStarDisplay();
                    this.submitUserRating(rating);
                });
                
                // Highlight stars on hover
                star.addEventListener('mouseenter', () => {
                    const rating = parseInt(star.dataset.rating, 10);
                    this.highlightStars(rating);
                });
                
                // Reset stars on mouse leave
                star.addEventListener('mouseleave', () => {
                    this.resetStarHighlights();
                });
            });
        }
        
        // Character count for review text
        if (this.reviewText) {
            this.reviewText.addEventListener('input', () => {
                const length = this.reviewText.value.length;
                if (this.charCount) this.charCount.textContent = length;
            });
        }
        
        // Submit review button
        if (this.submitReviewBtn) {
            this.submitReviewBtn.addEventListener('click', () => {
                this.submitReview();
            });
        }
        
        // Load more comments button
        if (this.loadMoreCommentsBtn) {
            this.loadMoreCommentsBtn.addEventListener('click', () => {
                this.loadMoreComments();
            });
        }
    }
    
    // Highlight stars up to the given rating
    highlightStars(rating) {
        if (!this.userRatingStars) return;
        
        const stars = this.userRatingStars.querySelectorAll('.star');
        stars.forEach(star => {
            const starRating = parseInt(star.dataset.rating, 10);
            const starIcon = star.querySelector('i');
            
            if (starRating <= rating) {
                starIcon.className = 'fas fa-star';
            } else {
                starIcon.className = 'far fa-star';
            }
        });
    }
    
    // Reset star highlights to current user rating
    resetStarHighlights() {
        this.updateStarDisplay();
    }
    
    // Update star display based on current user rating
    updateStarDisplay() {
        if (!this.userRatingStars) return;
        
        const stars = this.userRatingStars.querySelectorAll('.star');
        stars.forEach(star => {
            const starRating = parseInt(star.dataset.rating, 10);
            const starIcon = star.querySelector('i');
            
            if (starRating <= this.userRating) {
                starIcon.className = 'fas fa-star';
                star.classList.add('selected');
            } else {
                starIcon.className = 'far fa-star';
                star.classList.remove('selected');
            }
        });
    }
    
    // Load ratings and reviews for the current recipe
    async loadRatingsAndReviews() {
        try {
            // Get average rating and distribution
            const ratingsData = await this.fetchRecipeRatings();
            this.displayRatingSummary(ratingsData);
            
            // Check if user already rated this recipe
            if (this.isAuthenticated) {
                const userRating = await this.fetchUserRating();
                if (userRating) {
                    this.userRating = userRating.rating;
                    if (this.reviewText && userRating.review) {
                        this.reviewText.value = userRating.review;
                        this.charCount.textContent = userRating.review.length;
                    }
                    this.updateStarDisplay();
                }
            }
            
            // Load comments
            await this.loadComments();
            
        } catch (error) {
            console.error('Error loading ratings and reviews:', error);
            this.showError('Failed to load ratings and reviews');
        }
    }
    
    // Fetch recipe ratings data with enhanced error handling
    async fetchRecipeRatings() {
        try {
            // First try using the enhanced API if available
            if (window.enhancedRecipeAPI && typeof window.enhancedRecipeAPI.getRecipeRatings === 'function') {
                console.log('Using enhanced API for ratings');
                const data = await window.enhancedRecipeAPI.getRecipeRatings(this.recipeId);
                
                // Transform the data into the expected format if needed
                const formattedData = {
                    average_rating: data.average_rating || 0,
                    total_ratings: data.count || data.total_ratings || 0,
                    distribution: data.distribution || {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
                    total_reviews: data.review_count || data.total_reviews || data.count || 0
                };
                
                return formattedData;
            }
            
            // Fallback to direct API call if enhanced API is not available
            console.log(`Fetching ratings from: ${this.baseUrl}/recipes/${this.recipeId}/ratings/`);
            
            // Try multiple endpoint patterns since we're seeing 404s
            const endpointsToTry = [
                `/recipes/${this.recipeId}/ratings/`,
                `/recipes/${this.recipeId}/ratings/summary/`,
                `/recipes/${this.recipeId}/rating/`
            ];
            
            let response = null;
            let data = null;
            
            for (const endpoint of endpointsToTry) {
                try {
                    response = await fetch(`${this.baseUrl}${endpoint}`, {
                        method: 'GET',
                        headers: this.getHeaders()
                    });
                    
                    if (response.ok) {
                        data = await response.json();
                        console.log(`Ratings data received from ${endpoint}:`, data);
                        break;
                    } else {
                        console.warn(`Endpoint ${endpoint} returned ${response.status}`);
                    }
                } catch (endpointError) {
                    console.warn(`Error with endpoint ${endpoint}:`, endpointError);
                }
            }
            
            if (!data) {
                throw new Error('All rating endpoints failed');
            }
            
            // Transform the data into the expected format if needed
            const formattedData = {
                average_rating: data.average_rating || 0,
                total_ratings: data.count || 0,
                distribution: data.distribution || {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
                total_reviews: data.review_count || data.count || 0
            };
            
            return formattedData;
        } catch (error) {
            console.error('Failed to fetch recipe ratings:', error);
            
            // Only return mock data if offline, otherwise show zero/empty
            if (!navigator.onLine) {
                return {
                    average_rating: 4.2,
                    total_ratings: 15,
                    distribution: {1: 0, 2: 1, 3: 2, 4: 5, 5: 7},
                    total_reviews: 8
                };
            } else {
                return {
                    average_rating: 0,
                    total_ratings: 0,
                    distribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
                    total_reviews: 0
                };
            }
        }
    }
    
    // Fetch user's existing rating with enhanced error handling
    async fetchUserRating() {
        if (!this.isAuthenticated) return null;
        
        try {
            // Try multiple endpoint patterns since we're seeing 404s
            const endpointsToTry = [
                `/recipes/${this.recipeId}/user-review/`,
                `/recipes/${this.recipeId}/user-rating/`,
                `/recipe/${this.recipeId}/user-review/`
            ];
            
            let response = null;
            let data = null;
            
            for (const endpoint of endpointsToTry) {
                try {
                    console.log(`Trying to fetch user rating from: ${this.baseUrl}${endpoint}`);
                    response = await fetch(`${this.baseUrl}${endpoint}`, {
                        method: 'GET',
                        headers: this.getHeaders()
                    });
                    
                    if (response.ok) {
                        data = await response.json();
                        console.log(`User rating data received from ${endpoint}:`, data);
                        break;
                    } else if (response.status === 404) {
                        console.log(`User has not rated this recipe yet (${endpoint})`);
                    } else {
                        console.warn(`Endpoint ${endpoint} returned ${response.status}`);
                    }
                } catch (endpointError) {
                    console.warn(`Error with endpoint ${endpoint}:`, endpointError);
                }
            }
            
            // If we have data, return it
            if (data) return data;
            
            // Check for 404 (no rating yet)
            if (response && response.status === 404) {
                return null; // User hasn't rated this recipe yet
            }
            
            throw new Error('Could not retrieve user rating');
        } catch (error) {
            console.error('Failed to fetch user rating:', error);
            
            // If user is logged in and we're in demo mode, return a mock rating
            if (this.recipeId === '1' || this.recipeId === '2') {
                // Show mock data only for demo recipes
                return null;
            }
            
            return null;
        }
    }
    
    // Display rating summary in the UI
    displayRatingSummary(data) {
        // Update average rating
        if (this.averageRatingValue) {
            this.averageRatingValue.textContent = data.average_rating ? data.average_rating.toFixed(1) : '0.0';
        }
        
        // Update rating count
        if (this.ratingCount) {
            this.ratingCount.textContent = data.total_ratings || 0;
        }
        
        // Update comment count display
        if (this.commentCount) {
            this.commentCount.textContent = data.total_reviews || 0;
        }
        
        // Update average stars display
        if (this.averageStarsDisplay) {
            this.averageStarsDisplay.innerHTML = this.generateStarsHTML(data.average_rating || 0);
        }
        
        // Update rating breakdown
        if (this.ratingBreakdown) {
            let breakdownHTML = '';
            
            // Get total count for calculating percentages
            const total = data.total_ratings || 0;
            
            // Generate breakdown for each star rating (5 to 1)
            for (let i = 5; i >= 1; i--) {
                const count = data.distribution?.[i] || 0;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                
                breakdownHTML += `
                <div class="breakdown-item">
                    <span class="breakdown-label">${i} ★</span>
                    <div class="breakdown-bar">
                        <div class="breakdown-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="breakdown-count">${count}</span>
                </div>`;
            }
            
            this.ratingBreakdown.innerHTML = breakdownHTML;
        }
    }
    
    // Generate HTML for star display
    generateStarsHTML(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let starsHTML = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star"></i>';
        }
        
        // Half star
        if (halfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="far fa-star"></i>';
        }
        
        return starsHTML;
    }
    
    // Submit user's rating with enhanced API support
    async submitUserRating(rating) {
        if (!this.isAuthenticated) {
            this.showError('Please log in to rate recipes');
            return;
        }
        
        if (this.isSubmitting) return;
        this.isSubmitting = true;
        
        try {
            // First try using the enhanced API if available
            if (window.enhancedRecipeAPI && typeof window.enhancedRecipeAPI.submitRating === 'function') {
                console.log('Using enhanced API for submitting rating');
                const result = await window.enhancedRecipeAPI.submitRating(this.recipeId, rating);
                
                if (result && result.success) {
                    console.log('Enhanced API rating submission successful:', result);
                    
                    // Show success message
                    this.showSuccess('Your rating has been saved!');
                    
                    // If there's a review form, show it after rating
                    if (this.reviewForm) {
                        this.reviewForm.style.display = 'block';
                    }
                    
                    // Reload ratings to update the UI
                    const ratingsData = await this.fetchRecipeRatings();
                    this.displayRatingSummary(ratingsData);
                    return;
                }
            }
            
            // Fallback to direct API call
            console.log(`Submitting rating to: ${this.baseUrl}/recipes/${this.recipeId}/rate-recipe/`);
            
            // Try multiple endpoints for better success rate
            const endpointsToTry = [
                `/recipes/${this.recipeId}/rate-recipe/`,
                `/recipes/${this.recipeId}/rate/`,
                `/recipes/${this.recipeId}/ratings/`
            ];
            
            let success = false;
            let responseData = null;
            
            for (const endpoint of endpointsToTry) {
                try {
                    const response = await fetch(`${this.baseUrl}${endpoint}`, {
                        method: 'POST',
                        headers: this.getHeaders(),
                        body: JSON.stringify({
                            rating: rating,
                            recipe_id: this.recipeId
                        })
                    });
                    
                    if (response.ok) {
                        responseData = await response.json();
                        console.log(`Rating submission to ${endpoint} successful:`, responseData);
                        success = true;
                        break;
                    } else {
                        console.warn(`Endpoint ${endpoint} returned ${response.status}`);
                    }
                } catch (endpointError) {
                    console.warn(`Error with endpoint ${endpoint}:`, endpointError);
                }
            }
            
            if (success) {
                // Show success message
                this.showSuccess('Your rating has been saved!');
                
                // If there's a review form, show it after rating
                if (this.reviewForm) {
                    this.reviewForm.style.display = 'block';
                }
                
                // Reload ratings to update the UI
                const ratingsData = await this.fetchRecipeRatings();
                this.displayRatingSummary(ratingsData);
            } else {
                throw new Error('All rating submission endpoints failed');
            }
        } catch (error) {
            console.error('Failed to submit rating:', error);
            this.showError('Failed to save your rating. Please try again.');
        } finally {
            this.isSubmitting = false;
        }
    }
    
    // Submit user's review
    async submitReview() {
        if (!this.isAuthenticated) {
            this.showError('Please log in to review recipes');
            return;
        }
        
        if (this.isSubmitting) return;
        this.isSubmitting = true;
        
        // Check if user has rated
        if (this.userRating === 0) {
            this.showError('Please select a star rating first');
            this.isSubmitting = false;
            return;
        }
        
        // Show immediate feedback to the user
        this.showInfo('Submitting your review...');
        
        const reviewText = this.reviewText.value.trim();
        
        try {
            // First try using the enhanced API if available
            if (window.enhancedRecipeAPI && typeof window.enhancedRecipeAPI.submitReview === 'function') {
                console.log('Using enhanced API for submitting review');
                const result = await window.enhancedRecipeAPI.submitReview(this.recipeId, this.userRating, reviewText);
                
                if (result && result.success) {
                    console.log('Enhanced API review submission successful:', result);
                    
                    // Check if we're rate limited but still have local data
                    if (result.limitInfo && result.limitInfo.limited) {
                        // Show rate limit message but still show the review locally
                        this.showWarning(`Your review is saved locally. ${result.limitInfo.message}`);
                    } else {
                        // Show regular success message
                        this.showSuccess('Your review has been published!');
                    }
                    
                    // Clear the form
                    this.reviewText.value = '';
                    if (this.charCount) this.charCount.textContent = '0';
                    
                    // Reload ratings and comments to include the new review
                    await this.loadRatingsAndReviews();
                    return;
                } else {
                    console.warn('Enhanced API review submission returned non-success:', result);
                }
            }
            
            // Fallback to direct API call with multiple endpoint attempts
            const endpointsToTry = [
                `/recipes/${this.recipeId}/add-review/`,
                `/recipes/${this.recipeId}/reviews/`,
                `/reviews/`
            ];
            
            let success = false;
            let responseData = null;
            
            for (const endpoint of endpointsToTry) {
                try {
                    console.log(`Submitting review to: ${this.baseUrl}${endpoint}`);
                    const response = await fetch(`${this.baseUrl}${endpoint}`, {
                        method: 'POST',
                        headers: this.getHeaders(),
                        body: JSON.stringify({
                            rating: this.userRating,
                            review: reviewText,
                            recipe_id: this.recipeId
                        })
                    });
                    
                    if (response.ok) {
                        responseData = await response.json();
                        console.log(`Review submission to ${endpoint} successful:`, responseData);
                        success = true;
                        break;
                    } else {
                        const errorText = await response.text();
                        console.warn(`Endpoint ${endpoint} returned ${response.status}:`, errorText);
                    }
                } catch (endpointError) {
                    console.warn(`Error with endpoint ${endpoint}:`, endpointError);
                }
            }
            
            if (success) {
                // Show success message
                this.showSuccess('Your review has been published!');
                // Clear the form
                this.reviewText.value = '';
                if (this.charCount) this.charCount.textContent = '0';
                // Reload ratings and comments to include the new review
                await this.loadRatingsAndReviews();
            } else {
                throw new Error('All review submission endpoints failed');
            }
            
        } catch (error) {
            console.error('Failed to submit review:', error);
            this.showError('Failed to publish your review. Please try again.');
        } finally {
            this.isSubmitting = false;
        }
    }
    
    // Load comments/reviews for the recipe with enhanced API support
    async loadComments(reset = false) {
        if (reset) {
            this.currentPage = 1;
            if (this.commentsContainer) {
                this.commentsContainer.innerHTML = '';
            }
        }
        
        try {
            // First try using the enhanced API if available
            if (window.enhancedRecipeAPI && typeof window.enhancedRecipeAPI.getRecipeReviews === 'function') {
                console.log('Using enhanced API for fetching reviews');
                
                // Check for rate limit info before fetching
                if (window.enhancedRecipeAPI.apiStatus && window.enhancedRecipeAPI.apiStatus.rateLimited) {
                    const rateLimited = window.enhancedRecipeAPI.apiStatus.rateLimited;
                    const now = Date.now();
                    
                    // If rate limit is still active and we're not loading the first page
                    if (rateLimited.until && now < rateLimited.until && this.currentPage > 1) {
                        // Show warning about rate limit for pagination only
                        this.showWarning(`Rate limit active. Please wait before loading more reviews. ${rateLimited.retryMessage || ''}`);
                        return;
                    }
                }
                
                const data = await window.enhancedRecipeAPI.getRecipeReviews(this.recipeId, this.currentPage);
                
                console.log('Enhanced API reviews data:', data);
                
                // Display comments
                this.displayComments(data.results || []);
                
                // Update pagination
                this.hasMoreComments = !!data.next;
                if (this.loadMoreContainer) {
                    this.loadMoreContainer.style.display = this.hasMoreComments ? 'flex' : 'none';
                }
                
                // Update comment count
                if (this.commentCount) {
                    this.commentCount.textContent = data.count || 0;
                }
                
                // Check if this data came from cache due to rate limiting
                if (window.enhancedRecipeAPI.apiStatus && 
                    window.enhancedRecipeAPI.apiStatus.rateLimited &&
                    window.enhancedRecipeAPI.apiStatus.rateLimited.timestamp > Date.now() - 5000) {
                    // Show warning about rate limiting
                    const message = window.enhancedRecipeAPI.apiStatus.rateLimited.retryMessage || 
                                   'Rate limit reached. Using cached data.';
                    this.showWarning(message);
                }
                
                return;
            }
            
            // Fallback to direct API call with multiple endpoint attempts
            const endpointsToTry = [
                `/recipes/${this.recipeId}/reviews/`,
                `/recipes/${this.recipeId}/comments/`,
                `/reviews/?recipe_id=${this.recipeId}`
            ];
            
            let data = null;
            
            for (const endpoint of endpointsToTry) {
                try {
                    console.log(`Fetching comments from: ${this.baseUrl}${endpoint}?page=${this.currentPage}&page_size=${this.commentsPerPage}`);
                    const response = await fetch(`${this.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}page=${this.currentPage}&page_size=${this.commentsPerPage}`, {
                        method: 'GET',
                        headers: this.getHeaders()
                    });
                    
                    if (response.ok) {
                        data = await response.json();
                        console.log(`Comments data received from ${endpoint}:`, data);
                        break;
                    } else {
                        console.warn(`Endpoint ${endpoint} returned ${response.status}`);
                    }
                } catch (endpointError) {
                    console.warn(`Error with endpoint ${endpoint}:`, endpointError);
                }
            }
            
            if (data) {
                // Display comments
                this.displayComments(data.results || []);
                
                // Update pagination
                this.hasMoreComments = !!data.next;
                if (this.loadMoreContainer) {
                    this.loadMoreContainer.style.display = this.hasMoreComments ? 'flex' : 'none';
                }
                
                // Update comment count
                const commentCount = data.count || (data.results ? data.results.length : 0);
                if (this.commentCount) {
                    this.commentCount.textContent = commentCount;
                    
                    // Also update reviews count in any other places it might appear
                    const reviewCountElements = document.querySelectorAll('.review-count, .rating-count');
                    reviewCountElements.forEach(el => {
                        // Only update if it's specifically showing review/comment count
                        if (el.classList.contains('review-count') || 
                            el.closest('.rating-summary-reviews') || 
                            el.getAttribute('data-count-type') === 'reviews') {
                            el.textContent = commentCount;
                        }
                    });
                }
            } else {
                throw new Error('All comment endpoints failed');
            }
            
        } catch (error) {
            console.error('Failed to load comments:', error);
            
            // If no comments are loaded yet, show mock data ONLY in offline mode
            if (!navigator.onLine && this.currentPage === 1 && (!this.commentsContainer || this.commentsContainer.children.length === 0)) {
                console.log('Using mock comments data as fallback (offline mode)');
                // Generate mock comments
                const mockComments = [
                    {
                        id: 'mock-1',
                        user: {
                            username: 'FoodLover',
                            is_verified: true,
                            id: 'mock-user-1'
                        },
                        rating: 5,
                        review: 'This is a fantastic recipe! I made it for my family and they loved it. Will definitely make again.',
                        likes_count: 3,
                        created_at: new Date(Date.now() - 86400000).toISOString() // yesterday
                    },
                    {
                        id: 'mock-2',
                        user: {
                            username: 'CookingEnthusiast',
                            is_verified: false,
                            id: 'mock-user-2'
                        },
                        rating: 4,
                        review: 'Great recipe but I added a bit more seasoning to suit my taste. It turned out delicious!',
                        likes_count: 1,
                        created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
                    }
                ];
                this.displayComments(mockComments);
                // No pagination for mock data
                this.hasMoreComments = false;
                if (this.loadMoreContainer) {
                    this.loadMoreContainer.style.display = 'none';
                }
                // Update count
                if (this.commentCount) {
                    this.commentCount.textContent = mockComments.length;
                }
                // Show info toast
                this.showInfo('Showing demo reviews while offline');
                return;
            }
            
            this.showError('Failed to load comments');
        }
    }
    
    // Load more comments (pagination)
    async loadMoreComments() {
        if (!this.hasMoreComments || this.isSubmitting) return;
        
        this.isSubmitting = true;
        this.currentPage++;
        
        try {
            await this.loadComments();
        } finally {
            this.isSubmitting = false;
        }
    }
    
    // Display comments in the UI
    displayComments(comments) {
        if (!this.commentsContainer) return;
        
        // Handle case where comments is not an array or is empty
        if (!Array.isArray(comments) || comments.length === 0) {
            if (this.currentPage === 1) {
                this.commentsContainer.innerHTML = '<div class="no-comments">No reviews yet. Be the first to review this recipe!</div>';
            }
            return;
        }
        
        const currentUserId = this.getCurrentUserId();
        
        comments.forEach(comment => {
            // Skip if comment is missing critical data
            if (!comment || (typeof comment !== 'object')) {
                console.warn('Invalid comment object:', comment);
                return;
            }
            
            // Handle different API response structures
            const user = comment.user || comment.author || {};
            const username = user.username || user.name || 'Anonymous';
            const userId = user.id || user.user_id;
            const isVerified = user.is_verified || user.verified || false;
            const rating = comment.rating || comment.stars || 0;
            const reviewText = comment.review || comment.text || comment.content || '';
            const likesCount = comment.likes_count || comment.likes || 0;
            const createdAt = comment.created_at || comment.date || comment.timestamp || new Date().toISOString();
            
            const commentElement = document.createElement('div');
            commentElement.className = 'comment-card';
            
            // Add special class if this is the current user's comment
            if (currentUserId && userId === currentUserId) {
                commentElement.classList.add('own-comment');
            }
            
            // Create avatar with first letter of username
            const firstLetter = username.charAt(0).toUpperCase();
            
            // Format date
            const commentDate = new Date(createdAt);
            const formattedDate = this.formatDate(commentDate);
            
            commentElement.innerHTML = `
                <div class="comment-header">
                    <div class="comment-author">
                        <div class="comment-avatar">${firstLetter}</div>
                        <div>
                            <div class="comment-author-name">
                                ${this.escapeHTML(username)}
                                ${isVerified ? '<i class="fas fa-check-circle verified-badge" title="Verified Contributor"></i>' : ''}
                            </div>
                            <div class="comment-date">${formattedDate}</div>
                        </div>
                    </div>
                </div>
                <div class="comment-rating">
                    ${this.generateStarsHTML(rating)}
                </div>
                <div class="comment-content">
                    ${reviewText ? this.escapeHTML(reviewText) : '<em>No written review</em>'}
                </div>
                <div class="comment-actions">
                    <button class="comment-action" data-comment-id="${comment.id}" data-action="like">
                        <i class="far fa-thumbs-up"></i> Helpful
                        <span class="like-count">${likesCount}</span>
                    </button>
                    ${this.isAuthenticated && currentUserId === userId ? `
                        <button class="comment-action" data-comment-id="${comment.id}" data-action="edit">
                            <i class="far fa-edit"></i> Edit
                        </button>
                        <button class="comment-action" data-comment-id="${comment.id}" data-action="delete">
                            <i class="far fa-trash-alt"></i> Delete
                        </button>
                    ` : ''}
                </div>
            `;
            
            // Add event listeners for comment actions
            const likeButton = commentElement.querySelector('[data-action="like"]');
            if (likeButton) {
                likeButton.addEventListener('click', () => {
                    this.likeComment(comment.id, likeButton);
                });
            }
            
            const editButton = commentElement.querySelector('[data-action="edit"]');
            if (editButton) {
                editButton.addEventListener('click', () => {
                    this.editComment(comment.id);
                });
            }
            
            const deleteButton = commentElement.querySelector('[data-action="delete"]');
            if (deleteButton) {
                deleteButton.addEventListener('click', () => {
                    this.deleteComment(comment.id);
                });
            }
            
            this.commentsContainer.appendChild(commentElement);
        });
    }
    
    // Like a comment
    async likeComment(commentId, buttonElement) {
        if (!this.isAuthenticated) {
            this.showError('Please log in to mark reviews as helpful');
            return;
        }
        
        try {
            console.log(`Liking review at: ${this.baseUrl}/reviews/${commentId}/like/`);
            const response = await fetch(`${this.baseUrl}/reviews/${commentId}/like/`, {
                method: 'POST',
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`Error liking comment: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Like review response:', data);
            
            // Update like count in UI
            const likeCount = buttonElement.querySelector('.like-count');
            if (likeCount) {
                likeCount.textContent = data.likes_count;
            }
            
            // Toggle liked state
            const icon = buttonElement.querySelector('i');
            if (data.is_liked) {
                icon.className = 'fas fa-thumbs-up';
                buttonElement.classList.add('active');
            } else {
                icon.className = 'far fa-thumbs-up';
                buttonElement.classList.remove('active');
            }
            
        } catch (error) {
            console.error('Failed to like comment:', error);
            this.showError('Failed to mark review as helpful');
        }
    }
    
    // Edit comment
    editComment(commentId) {
        // To be implemented - will open an edit form
        console.log('Edit comment:', commentId);
        this.showInfo('Comment editing will be available soon');
    }
    
    // Delete comment
    async deleteComment(commentId) {
        if (confirm('Are you sure you want to delete your review? This action cannot be undone.')) {
            try {
                console.log(`Deleting review at: ${this.baseUrl}/reviews/${commentId}/delete/`);
                const response = await fetch(`${this.baseUrl}/reviews/${commentId}/delete/`, {
                    method: 'POST', // Using POST instead of DELETE as some API frameworks handle it better
                    headers: this.getHeaders()
                });
                
                if (!response.ok) {
                    throw new Error(`Error deleting comment: ${response.statusText}`);
                }
                
                // Show success message
                this.showSuccess('Your review has been deleted');
                
                // Reset user rating UI
                this.userRating = 0;
                this.updateStarDisplay();
                if (this.reviewText) {
                    this.reviewText.value = '';
                    this.charCount.textContent = '0';
                }
                
                // Reload comments and ratings
                await this.loadComments(true);
                const ratingsData = await this.fetchRecipeRatings();
                this.displayRatingSummary(ratingsData);
                
            } catch (error) {
                console.error('Failed to delete comment:', error);
                this.showError('Failed to delete your review');
            }
        }
    }
    
    // Get current user ID from token
    getCurrentUserId() {
        if (!this.authToken) return null;
        
        try {
            // Try to get user ID from local storage
            return localStorage.getItem('user_id');
        } catch (error) {
            console.error('Failed to get current user ID:', error);
            return null;
        }
    }
    
    // Format a date for display
    formatDate(date) {
        try {
            // Ensure we have a valid date object
            if (!(date instanceof Date) || isNaN(date.getTime())) {
                console.warn('Invalid date provided for formatting:', date);
                return 'Recently';
            }
            
            const now = new Date();
            const diffMs = now - date;
            
            // Handle future dates (can happen with time zone issues)
            if (diffMs < 0) {
                console.warn('Future date detected:', date);
                return 'Just now';
            }
            
            const diffSecs = Math.floor(diffMs / 1000);
            const diffMins = Math.floor(diffSecs / 60);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffDays > 30) {
                // Format date with month and day
                const options = { month: 'short', day: 'numeric' };
                if (date.getFullYear() !== now.getFullYear()) {
                    options.year = 'numeric';
                }
                return date.toLocaleDateString(undefined, options);
            } else if (diffDays > 0) {
                return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            } else if (diffHours > 0) {
                return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            } else if (diffMins > 0) {
                return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
            } else {
                return 'Just now';
            }
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Recently';
        }
    }
    
    // Escape HTML to prevent XSS
    escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    // Get authentication headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.authToken) {
            headers['Authorization'] = `Token ${this.authToken}`;
        }
        
        return headers;
    }
    
    // Show success toast
    showSuccess(message) {
        this.showToast(message, 'success');
    }
    
    // Show error toast
    showError(message) {
        this.showToast(message, 'error');
    }
    
    // Show info toast
    showInfo(message) {
        this.showToast(message, 'info');
    }
    
    // Show warning toast
    showWarning(message) {
        this.showToast(message, 'warning');
    }
    
    // Show toast notification
    showToast(message, type = 'info') {
        // Find toast element or create one if needed
        let toast = document.getElementById('toast');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            
            // Add default styling if not already in CSS
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.right = '20px';
            toast.style.minWidth = '250px';
            toast.style.padding = '15px 20px';
            toast.style.borderRadius = '8px';
            toast.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
            toast.style.zIndex = '10000';
            toast.style.display = 'flex';
            toast.style.alignItems = 'center';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'all 0.3s ease-in-out';
            
            document.body.appendChild(toast);
        }
        
        // Clear previous classes and add new ones
        toast.className = 'toast';
        toast.classList.add(`toast-${type}`);
        
        // Set colors based on type
        let backgroundColor, color, borderColor;
        
        switch (type) {
            case 'success':
                backgroundColor = '#e8f5e9';
                color = '#2e7d32';
                borderColor = '#a5d6a7';
                break;
            case 'error':
                backgroundColor = '#ffebee';
                color = '#c62828';
                borderColor = '#ef9a9a';
                break;
            case 'warning':
                backgroundColor = '#fff3e0';
                color = '#e65100';
                borderColor = '#ffcc80';
                break;
            default: // info
                backgroundColor = '#e3f2fd';
                color = '#1565c0';
                borderColor = '#90caf9';
                break;
        }
        
        toast.style.backgroundColor = backgroundColor;
        toast.style.color = color;
        toast.style.borderLeft = `4px solid ${borderColor}`;
        
        // Set icon based on type
        let icon = 'fas fa-info-circle';
        if (type === 'success') icon = 'fas fa-check-circle';
        if (type === 'error') icon = 'fas fa-exclamation-circle';
        if (type === 'warning') icon = 'fas fa-exclamation-triangle';
        
        // Set content
        toast.innerHTML = `<div class="toast-icon" style="margin-right:12px;font-size:20px;"><i class="${icon}"></i></div><div class="toast-message">${message}</div>`;
        
        // Show the toast
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        
        // Hide the toast after a delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
        }, 4000);
    }
}

// Initialize the rating system with error handling
try {
    console.log('Initializing Recipe Rating System');
    const recipeRatingSystem = new RecipeRatingSystem();
    window.recipeRatingSystem = recipeRatingSystem; // Make it available globally
} catch (error) {
    console.error('Failed to initialize Recipe Rating System:', error);
}
