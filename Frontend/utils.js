// Recipe Search and API Utilities for ChopSmo

class RecipeAPI {
    constructor(baseUrl = 'http://127.0.0.1:8000') {
        this.baseUrl = baseUrl;
        this.authToken = this.getAuthToken();
    }

    // Get auth token from storage
    getAuthToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    // Set auth token
    setAuthToken(token) {
        localStorage.setItem('authToken', token);
        this.authToken = token;
    }    // Get default headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        // Add authorization header if token exists
        if (this.authToken && typeof this.authToken === 'string') {
            headers['Authorization'] = this.authToken.startsWith('Token ') 
                ? this.authToken 
                : `Token ${this.authToken}`;
        }        return headers;
    }    // Get CSRF token from cookie or Django endpoint
    async getCSRFToken() {
        console.log('🔒 Getting CSRF token...');
        
        // First try to get from cookie
        const name = 'csrftoken';
        let cookieValue = null;
        
        console.log('🍪 Checking cookies:', document.cookie);
        
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    console.log('🔒 CSRF token found in cookie:', cookieValue.substring(0, 16) + '...');
                    break;
                }
            }
        }

        // If no cookie token, try to get from Django endpoint
        if (!cookieValue) {
            console.log('🔒 No CSRF token in cookie, trying endpoint...');
            try {
                const response = await fetch(`${this.baseUrl}/api/csrf-token/`, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                console.log('🔒 CSRF endpoint response:', response.status, response.statusText);
                
                if (response.ok) {
                    const data = await response.json();
                    cookieValue = data.csrfToken;
                    console.log('🔒 CSRF token from endpoint:', cookieValue ? cookieValue.substring(0, 16) + '...' : 'null');
                } else {
                    console.warn('🔒 CSRF endpoint failed:', response.status, response.statusText);
                }
            } catch (error) {
                console.warn('🔒 Could not fetch CSRF token from endpoint:', error);
            }
        }

        // If still no token, try alternative methods
        if (!cookieValue) {
            console.log('🔒 Trying alternative CSRF cookie names...');
            
            // Try common Django CSRF cookie variations
            const altNames = ['csrftoken', 'csrf_token', 'X-CSRFToken', 'django_csrf_token'];
            
            for (const altName of altNames) {
                if (document.cookie && document.cookie !== '') {
                    const cookies = document.cookie.split(';');
                    for (let i = 0; i < cookies.length; i++) {
                        const cookie = cookies[i].trim();
                        if (cookie.substring(0, altName.length + 1) === (altName + '=')) {
                            cookieValue = decodeURIComponent(cookie.substring(altName.length + 1));
                            console.log(`🔒 CSRF token found with alternative name ${altName}:`, cookieValue.substring(0, 16) + '...');
                            break;
                        }
                    }
                }
                if (cookieValue) break;
            }
        }        // If still no token, try to get it by making a simple GET request first
        if (!cookieValue) {
            console.log('🔒 Trying to get CSRF token by making a GET request first...');
            try {
                await fetch(`${this.baseUrl}/api/recipes/`, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                // Now try to get the token from cookie again
                if (document.cookie && document.cookie !== '') {
                    const cookies = document.cookie.split(';');
                    for (let i = 0; i < cookies.length; i++) {
                        const cookie = cookies[i].trim();
                        if (cookie.substring(0, name.length + 1) === (name + '=')) {
                            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                            console.log('🔒 CSRF token found after GET request:', cookieValue.substring(0, 16) + '...');
                            break;
                        }
                    }
                }
            } catch (error) {
                console.warn('🔒 Failed to get CSRF token via GET request:', error);
            }
        }

        if (!cookieValue) {
            console.error('🔒 No CSRF token found anywhere!');
            console.error('🔒 Available cookies:', document.cookie);
            console.error('🔒 Make sure Django CSRF_TRUSTED_ORIGINS includes:', window.location.origin);
        } else {
            console.log('🔒 Final CSRF token:', cookieValue.substring(0, 16) + '...');
        }

        return cookieValue;
    }

    // Search recipes by keyword with filters
    async searchRecipes(query, filters = {}) {
        try {
            const params = new URLSearchParams();
            
            if (query) params.append('search', query);
            if (filters.category) params.append('categories', filters.category);
            if (filters.tags) params.append('tags', filters.tags);
            if (filters.meal_type) params.append('meal_type', filters.meal_type);
            if (filters.cuisine) params.append('cuisines', filters.cuisine);

            const response = await fetch(`${this.baseUrl}/api/recipes/?${params}`, {
                method: 'GET',
                headers: this.getHeaders(),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Recipe search error:', error);
            throw error;
        }
    }

    // Get recipe suggestions by ingredients
    async getRecipeSuggestions(ingredientNames) {
        try {
            const response = await fetch(`${this.baseUrl}/api/recipes/suggest-by-ingredients/`, {
                method: 'POST',
                headers: this.getHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    ingredient_names: ingredientNames
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Recipe suggestions error:', error);
            throw error;
        }
    }

    // Get all categories
    async getCategories() {
        try {
            const response = await fetch(`${this.baseUrl}/api/recipes/categories/`, {
                method: 'GET',
                headers: this.getHeaders(),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Categories fetch error:', error);
            return [];
        }
    }

    // Get all tags
    async getTags() {
        try {
            const response = await fetch(`${this.baseUrl}/api/recipes/tags/`, {
                method: 'GET',
                headers: this.getHeaders(),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Tags fetch error:', error);
            return [];
        }
    }

    // Get all cuisines
    async getCuisines() {
        try {
            const response = await fetch(`${this.baseUrl}/api/recipes/cuisines/`, {
                method: 'GET',
                headers: this.getHeaders(),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Cuisines fetch error:', error);
            return [];
        }
    }    // Get recipe by ID
    async getRecipe(id) {
        try {
            console.log(`Fetching recipe from: ${this.baseUrl}/api/recipes/${id}/`);
            const response = await fetch(`${this.baseUrl}/api/recipes/${id}/`, {
                method: 'GET',
                headers: this.getHeaders(),
                credentials: 'include'
            });

            console.log('Recipe API response status:', response.status);
            console.log('Recipe API response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                console.log('Recipe API error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Recipe API success response:', data);
            return data;
        } catch (error) {
            console.error('Recipe fetch error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            throw error;
        }
    }    // Update recipe by ID
    async updateRecipe(id, data) {
        try {
            console.log(`🔄 Updating recipe: ${this.baseUrl}/api/recipes/${id}/`);
            console.log('📤 Update data being sent:', JSON.stringify(data, null, 2));
            
            const response = await fetch(`${this.baseUrl}/api/recipes/${id}/`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                credentials: 'include',
                body: JSON.stringify(data)
            });

            console.log('📥 Update recipe response status:', response.status);
            console.log('📥 Update recipe response headers:', [...response.headers.entries()]);

            if (!response.ok) {
                let errorDetails = 'Unknown error';
                try {
                    const errorText = await response.text();
                    console.log('📥 Update recipe error response text:', errorText);
                    
                    // Try to parse as JSON for structured error
                    try {
                        const errorJson = JSON.parse(errorText);
                        console.log('📥 Update recipe error JSON:', errorJson);
                        
                        // Format Django validation errors nicely
                        if (errorJson.ingredients) {
                            errorDetails = `Ingredient validation error: ${JSON.stringify(errorJson.ingredients)}`;
                        } else if (typeof errorJson === 'object') {
                            errorDetails = Object.entries(errorJson)
                                .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                                .join('; ');
                        } else {
                            errorDetails = errorText;
                        }
                    } catch (parseError) {
                        errorDetails = errorText;
                    }
                } catch (textError) {
                    console.log('Could not read error response text:', textError);
                }
                
                const errorMessage = `HTTP ${response.status}: ${errorDetails}`;
                console.error('❌ Update recipe failed:', errorMessage);
                throw new Error(errorMessage);
            }

            try {
                const result = await response.json();
                console.log('✅ Recipe updated successfully:', result);
                return result;
            } catch (jsonError) {
                console.warn('Could not parse successful response as JSON:', jsonError);
                // Sometimes PATCH returns 204 No Content
                return { success: true, id: id };
            }
        } catch (error) {
            console.error('❌ Recipe update error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            throw error;        }
    }

    // Update recipe with image file using FormData
    async updateRecipeWithImage(id, data, imageFile) {
        try {
            console.log(`🖼️ Updating recipe with image: ${this.baseUrl}/api/recipes/${id}/`);
            console.log('📤 Recipe data:', data);
            console.log('📤 Image file:', imageFile.name, 'Size:', imageFile.size, 'Type:', imageFile.type);
            
            // Create FormData for multipart/form-data upload
            const formData = new FormData();
            
            // Add image file
            formData.append('image', imageFile);
              // Add recipe data fields (exclude ingredients for image uploads to avoid validation issues)
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    // Skip ingredients when doing image upload to avoid Django validation issues  
                    if (key === 'ingredients') {
                        console.log('⚠️ Skipping ingredients in image upload (not supported in current UI)');
                        return;
                    }
                    formData.append(key, data[key]);
                }
            });            // For FormData, don't set Content-Type header - let browser set it
            // Get CSRF token asynchronously with improved error handling
            console.log('🔒 Getting CSRF token for image upload...');
            const csrfToken = await this.getCSRFToken();
            
            if (!csrfToken) {
                throw new Error('CSRF token is required for image upload. Please ensure Django CSRF_TRUSTED_ORIGINS includes your frontend URL and the CSRF endpoint is working.');
            }
            
            console.log('🔒 CSRF token obtained for image upload:', csrfToken.substring(0, 16) + '...');
            
            const headers = {
                'X-CSRFToken': csrfToken
            };

            const response = await fetch(`${this.baseUrl}/api/recipes/${id}/`, {
                method: 'PATCH',
                headers: headers,
                credentials: 'include',
                body: formData  // Use FormData instead of JSON
            });

            console.log('📥 Update recipe with image response status:', response.status);
            console.log('📥 Update recipe with image response headers:', [...response.headers.entries()]);

            if (!response.ok) {
                let errorDetails = 'Unknown error';
                try {
                    const errorText = await response.text();
                    console.log('📥 Update recipe with image error response text:', errorText);
                    
                    // Try to parse as JSON for structured error
                    try {
                        const errorJson = JSON.parse(errorText);
                        console.log('📥 Update recipe with image error JSON:', errorJson);
                          // Format Django validation errors nicely
                        if (errorJson.ingredients) {
                            errorDetails = `Ingredient validation error: ${JSON.stringify(errorJson.ingredients)}`;
                        } else if (errorJson.image) {
                            errorDetails = `Image validation error: ${Array.isArray(errorJson.image) ? errorJson.image.join(', ') : errorJson.image}`;
                        } else if (errorJson.detail && errorJson.detail.includes('CSRF')) {
                            errorDetails = `CSRF Error: ${errorJson.detail}. Please configure Django CSRF_TRUSTED_ORIGINS to include '${window.location.origin}' in your Django settings.`;
                        } else if (typeof errorJson === 'object') {
                            errorDetails = Object.entries(errorJson)
                                .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                                .join('; ');
                        } else {
                            errorDetails = errorText;
                        }
                    } catch (parseError) {
                        errorDetails = errorText;
                    }
                } catch (textError) {
                    console.log('Could not read error response text:', textError);
                }
                
                const errorMessage = `HTTP ${response.status}: ${errorDetails}`;
                console.error('❌ Update recipe with image failed:', errorMessage);
                throw new Error(errorMessage);
            }

            try {
                const result = await response.json();
                console.log('✅ Recipe with image updated successfully:', result);
                return result;
            } catch (jsonError) {
                console.warn('Could not parse successful response as JSON:', jsonError);
                // Sometimes PATCH returns 204 No Content
                return { success: true, id: id };
            }
        } catch (error) {
            console.error('❌ Recipe with image update error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            throw error;
        }
    }

    // Delete recipe by ID
    async deleteRecipe(id) {
        try {
            console.log(`Deleting recipe: ${this.baseUrl}/api/recipes/${id}/`);
            const response = await fetch(`${this.baseUrl}/api/recipes/${id}/`, {
                method: 'DELETE',
                headers: this.getHeaders(),
                credentials: 'include'
            });

            console.log('Delete recipe response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                console.log('Delete recipe error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            console.log('Recipe deleted successfully');
            return true;
        } catch (error) {
            console.error('Recipe delete error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            throw error;
        }
    }

    // Get current user profile
    async getCurrentUser() {
        try {
            console.log(`Getting current user: ${this.baseUrl}/api/users/profile/`);
            const response = await fetch(`${this.baseUrl}/api/users/profile/`, {
                method: 'GET',
                headers: this.getHeaders(),
                credentials: 'include'
            });

            console.log('Current user response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                console.log('Current user error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('Current user data:', result);
            return result;
        } catch (error) {
            console.error('Current user fetch error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            throw error;
        }
    }
}

// Recipe display utilities
class RecipeDisplayUtils {    // Create a recipe card element
    static createRecipeCard(recipe, onClick = null) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        
        // Set up click handler
        const handleClick = onClick || ((recipe) => {
            // Default click handler - navigate to recipe detail page
            window.location.href = `recipe-detail.html?id=${recipe.id}`;
        });
        
        card.onclick = () => handleClick(recipe);
        card.style.cursor = 'pointer';        // Handle different possible image field names
        let imageUrl = recipe.image || recipe.image_url || recipe.photo;
        
        // Fix image URL if it's a Django media path
        if (imageUrl && imageUrl.includes('/media/')) {
            const filename = imageUrl.split('/').pop();
            // Try local images folder first, fallback to Django media URL
            imageUrl = `images/${filename}`;
        } else if (!imageUrl) {
            imageUrl = 'assets/default-recipe.jpg';
        }
        
        // Handle different possible field names for description
        const description = recipe.description || recipe.summary || 'No description available';
        
        // Handle ingredients display if needed
        const ingredients = recipe.ingredients || [];
        const missingIngredients = recipe.missing_ingredients || [];

        card.innerHTML = `
            <div class="recipe-image-container">
                <img src="${imageUrl}" alt="${recipe.title || recipe.name}" class="recipe-image" 
                     onerror="this.src='assets/default-recipe.jpg'">
                ${missingIngredients.length > 0 ? `
                    <div class="missing-ingredients-badge">
                        <i class="fas fa-exclamation-triangle"></i>
                        ${missingIngredients.length} missing
                    </div>
                ` : ''}
            </div>
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.title || recipe.name}</h3>
                <p class="recipe-description">${description}</p>
                
                ${recipe.message ? `<p class="recipe-message">${recipe.message}</p>` : ''}
                
                <div class="recipe-meta">
                    <div class="recipe-tags">
                        ${(recipe.tags || []).slice(0, 3).map(tag => 
                            `<span class="recipe-tag">${tag.name || tag}</span>`
                        ).join('')}
                        ${(recipe.categories || []).slice(0, 2).map(category => 
                            `<span class="recipe-tag category">${category.name || category}</span>`
                        ).join('')}
                    </div>
                    <div class="recipe-timing">
                        ${recipe.prep_time ? `<span><i class="fas fa-clock"></i> ${recipe.prep_time}min</span>` : ''}
                        ${recipe.servings ? `<span><i class="fas fa-users"></i> ${recipe.servings}</span>` : ''}
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    // Show loading state
    static showLoading(container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Searching for delicious recipes...</p>
            </div>
        `;
    }

    // Show error state
    static showError(container, message = 'Failed to load recipes. Please try again.') {
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Oops! Something went wrong</h4>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-btn">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }

    // Show no results state
    static showNoResults(container, message = 'No recipes found') {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h4>${message}</h4>
                <p>Try adjusting your search terms or filters</p>
            </div>
        `;
    }

    // Format cooking time
    static formatTime(minutes) {
        if (!minutes) return '';
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }

    // Truncate text
    static truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
}

// Form validation utilities
class FormValidator {
    static validateSearch(query, filters) {
        if (!query && !Object.values(filters).some(filter => filter)) {
            throw new Error('Please enter a search term or select a filter');
        }
        return true;
    }

    static validateIngredients(ingredientsText) {
        if (!ingredientsText || !ingredientsText.trim()) {
            throw new Error('Please enter at least one ingredient');
        }
        
        const ingredients = ingredientsText.split(',').map(ing => ing.trim()).filter(ing => ing);
        if (ingredients.length === 0) {
            throw new Error('Please enter valid ingredients');
        }
        
        return ingredients;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RecipeAPI, RecipeDisplayUtils, FormValidator };
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
    window.RecipeAPI = RecipeAPI;
    window.RecipeDisplayUtils = RecipeDisplayUtils;
    window.FormValidator = FormValidator;
}
