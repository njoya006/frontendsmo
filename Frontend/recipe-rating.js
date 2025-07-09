/**
 * ChopSmo Recipe Rating & Comments System
 * - Star rating functionality
 * - Reviews and comments
 * - Social interactions (likes, etc)
 * - Authenticated operations
 */

class RecipeRatingSystem {
    constructor() {
        this.baseUrl = 'https://njoya.pythonanywhere.com/api';
        this.recipeId = null;
        this.currentPage = 1;
        this.hasMoreComments = false;
        this.userRating = 0;
        this.isAuthenticated = false;
        this.commentsPerPage = 5;
        this.isSubmitting = false;
        
        // Check authentication status
        this.authToken = localStorage.getItem('authToken');
        this.isAuthenticated = !!this.authToken;
        
        // Initialize when document is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeElements();
            this.setupEventListeners();
            
            // Get recipe ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            this.recipeId = urlParams.get('id');
            
            if (this.recipeId) {
                this.loadRatingsAndReviews();
            } else {
                console.error('No recipe ID found in URL');
            }
        });
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
    
    // Fetch recipe ratings data
    async fetchRecipeRatings() {
        try {
            const response = await fetch(`${this.baseUrl}/recipes/${this.recipeId}/ratings/summary/`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`Error fetching ratings: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch recipe ratings:', error);
            return {
                average_rating: 0,
                total_ratings: 0,
                distribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            };
        }
    }
    
    // Fetch user's existing rating if available
    async fetchUserRating() {
        if (!this.isAuthenticated) return null;
        
        try {
            const response = await fetch(`${this.baseUrl}/recipes/${this.recipeId}/user-rating/`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            if (response.status === 404) {
                return null; // User hasn't rated this recipe yet
            }
            
            if (!response.ok) {
                throw new Error(`Error fetching user rating: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch user rating:', error);
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
    
    // Submit user's rating
    async submitUserRating(rating) {
        if (!this.isAuthenticated) {
            this.showError('Please log in to rate recipes');
            return;
        }
        
        if (this.isSubmitting) return;
        this.isSubmitting = true;
        
        try {
            const response = await fetch(`${this.baseUrl}/recipes/${this.recipeId}/rate/`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    rating: rating
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error submitting rating: ${response.statusText}`);
            }
            
            // Show success message
            this.showSuccess('Your rating has been saved!');
            
            // If there's a review form, show it after rating
            if (this.reviewForm) {
                this.reviewForm.style.display = 'block';
            }
            
            // Reload ratings to update the UI
            const ratingsData = await this.fetchRecipeRatings();
            this.displayRatingSummary(ratingsData);
            
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
        
        const reviewText = this.reviewText.value.trim();
        
        try {
            const response = await fetch(`${this.baseUrl}/recipes/${this.recipeId}/review/`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    rating: this.userRating,
                    review: reviewText
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error submitting review: ${response.statusText}`);
            }
            
            // Show success message
            this.showSuccess('Your review has been published!');
            
            // Clear the form
            this.reviewText.value = '';
            this.charCount.textContent = '0';
            
            // Reload comments to include the new review
            await this.loadComments(true);
            
        } catch (error) {
            console.error('Failed to submit review:', error);
            this.showError('Failed to publish your review. Please try again.');
        } finally {
            this.isSubmitting = false;
        }
    }
    
    // Load comments/reviews for the recipe
    async loadComments(reset = false) {
        if (reset) {
            this.currentPage = 1;
            if (this.commentsContainer) {
                this.commentsContainer.innerHTML = '';
            }
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/recipes/${this.recipeId}/comments/?page=${this.currentPage}&page_size=${this.commentsPerPage}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`Error fetching comments: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Display comments
            this.displayComments(data.results);
            
            // Update pagination
            this.hasMoreComments = !!data.next;
            if (this.loadMoreContainer) {
                this.loadMoreContainer.style.display = this.hasMoreComments ? 'flex' : 'none';
            }
            
            // Update comment count
            if (this.commentCount) {
                this.commentCount.textContent = data.count || 0;
            }
            
        } catch (error) {
            console.error('Failed to load comments:', error);
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
        
        if (comments.length === 0 && this.currentPage === 1) {
            this.commentsContainer.innerHTML = '<div class="no-comments">No reviews yet. Be the first to review this recipe!</div>';
            return;
        }
        
        const currentUserId = this.getCurrentUserId();
        
        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment-card';
            
            // Add special class if this is the current user's comment
            if (currentUserId && comment.user.id === currentUserId) {
                commentElement.classList.add('own-comment');
            }
            
            // Create avatar with first letter of username
            const firstLetter = comment.user.username.charAt(0).toUpperCase();
            
            // Format date
            const commentDate = new Date(comment.created_at);
            const formattedDate = this.formatDate(commentDate);
            
            commentElement.innerHTML = `
                <div class="comment-header">
                    <div class="comment-author">
                        <div class="comment-avatar">${firstLetter}</div>
                        <div>
                            <div class="comment-author-name">
                                ${this.escapeHTML(comment.user.username)}
                                ${comment.user.is_verified ? '<i class="fas fa-check-circle verified-badge" title="Verified Contributor"></i>' : ''}
                            </div>
                            <div class="comment-date">${formattedDate}</div>
                        </div>
                    </div>
                </div>
                <div class="comment-rating">
                    ${this.generateStarsHTML(comment.rating)}
                </div>
                <div class="comment-content">
                    ${comment.review ? this.escapeHTML(comment.review) : '<em>No written review</em>'}
                </div>
                <div class="comment-actions">
                    <button class="comment-action" data-comment-id="${comment.id}" data-action="like">
                        <i class="far fa-thumbs-up"></i> Helpful
                        <span class="like-count">${comment.likes_count || 0}</span>
                    </button>
                    ${this.isAuthenticated && currentUserId === comment.user.id ? `
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
            const response = await fetch(`${this.baseUrl}/comments/${commentId}/like/`, {
                method: 'POST',
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`Error liking comment: ${response.statusText}`);
            }
            
            const data = await response.json();
            
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
                const response = await fetch(`${this.baseUrl}/comments/${commentId}/`, {
                    method: 'DELETE',
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
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 30) {
            return date.toLocaleDateString();
        } else if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffMins > 0) {
            return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
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
    
    // Show toast notification
    showToast(message, type = 'info') {
        // Find toast element or create one if needed
        let toast = document.getElementById('toast');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            document.body.appendChild(toast);
        }
        
        // Clear previous classes and add new ones
        toast.className = 'toast';
        toast.classList.add(`toast-${type}`);
        
        // Set icon based on type
        let icon = 'fas fa-info-circle';
        if (type === 'success') icon = 'fas fa-check-circle';
        if (type === 'error') icon = 'fas fa-exclamation-circle';
        if (type === 'warning') icon = 'fas fa-exclamation-triangle';
        
        // Set content
        toast.innerHTML = `<div class="toast-icon"><i class="${icon}"></i></div><div class="toast-message">${message}</div>`;
        
        // Show the toast
        toast.classList.add('show');
        
        // Hide the toast after a delay
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
}

// Initialize the rating system
const recipeRatingSystem = new RecipeRatingSystem();
