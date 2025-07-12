// --- Global variables for recipe management ---
let mealData = [];
var validIngredientNames = [];

// --- Filter DOM elements ---
const mealTypeFilter = document.getElementById('meal-type');
const cuisineFilter = document.getElementById('cuisine');
const cookingTimeFilter = document.getElementById('cooking-time');

// --- Enhanced search functionality ---
function initSearch() {
    const searchInput = document.getElementById('mealSearch');
    const searchButton = document.getElementById('searchButton');
    const searchTags = document.querySelectorAll('.remove-tag');
    
    if (!searchInput || !searchButton) {
        console.warn('Search elements not found in DOM');
        return;
    }
    
    // Search when button is clicked
    searchButton.addEventListener('click', performSearch);
    
    // Search when Enter is pressed
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Search as user types (debounced)
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(performSearch, 500);
    });
    
    // Remove tag functionality
    searchTags.forEach(tag => {
        tag.addEventListener('click', function() {
            this.parentElement.remove();
            performSearch(); // Update results when tags are removed
        });
    });
}

async function performSearch() {
    const searchInput = document.getElementById('mealSearch');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim();
    console.log('Performing search for:', searchTerm);
    
    // Show loading state
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (suggestionsGrid) {
        suggestionsGrid.innerHTML = '<div class="loading-spinner">Searching recipes...</div>';
    }
    
    try {
        let results = [];
        
        // Use enhanced recipe API if available
        if (window.enhancedRecipeAPI && searchTerm) {
            console.log('Using enhanced recipe API for search');
            
            // Get current filter values
            const filters = {
                meal_type: mealTypeFilter?.value || 'all',
                cuisine: cuisineFilter?.value || 'all',
                max_cooking_time: cookingTimeFilter?.value || 'all'
            };
            
            // Remove 'all' values
            Object.keys(filters).forEach(key => {
                if (filters[key] === 'all') {
                    delete filters[key];
                }
            });
            
            results = await window.enhancedRecipeAPI.searchRecipes(searchTerm, {
                includeIngredients: true,
                limit: 20,
                filters: filters
            });
            
            console.log('Search results from API:', results);
            
        } else if (searchTerm) {
            // Fallback to local search if API not available
            console.log('Using local search fallback');
            results = getFilteredMeals().filter(meal => {
                return meal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       meal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       meal.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       meal.type.toLowerCase().includes(searchTerm.toLowerCase());
            });
        } else {
            // No search term, show filtered results
            results = getFilteredMeals();
        }
        
        // Display results
        if (results.length === 0) {
            displayNoResults(searchTerm);
        } else {
            // Transform results to meal format if needed
            const formattedResults = results.map(item => {
                // If it's already in the expected format, return as-is
                if (item.title || item.name) {
                    return {
                        ...item,
                        title: item.title || item.name,
                        id: item.id || Math.random().toString(36).substr(2, 9)
                    };
                }
                return item;
            });
            
            displayMeals(formattedResults);
        }
        
    } catch (error) {
        console.error('Search error:', error);
        displaySearchError(error.message);
    }
}

function displayNoResults(searchTerm) {
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (!suggestionsGrid) return;
    
    suggestionsGrid.innerHTML = '<div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;"><h3>No recipes found</h3><p>No recipes match "' + searchTerm + '". Try different keywords.</p></div>';
}

function displaySearchError(errorMessage) {
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (!suggestionsGrid) return;
    
    suggestionsGrid.innerHTML = '<div class="search-error" style="grid-column: 1 / -1; text-align: center; padding: 40px;"><h3>Search Error</h3><p>Unable to search recipes: ' + errorMessage + '</p><button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 5px; cursor: pointer;">Retry</button></div>';
}

function getFilteredMeals() {
    // This would combine your existing filter logic
    const typeValue = mealTypeFilter.value;
    const cuisineValue = cuisineFilter.value;
    const timeValue = cookingTimeFilter.value;
    
    return mealData.filter(meal => {
        return (typeValue === 'all' || meal.type === typeValue) &&
               (cuisineValue === 'all' || meal.cuisine === cuisineValue) &&
               (timeValue === 'all' || meal.time <= parseInt(timeValue));
    });
}

// Update displayMeals function to handle search results
function displayMeals(mealsOrSuggestions) {
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (!suggestionsGrid) return;
    
    // Remove any loading spinner or previous content
    suggestionsGrid.innerHTML = '';
    
    if (!Array.isArray(mealsOrSuggestions) || mealsOrSuggestions.length === 0) {
        suggestionsGrid.innerHTML = '<div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;"><h3>No meals found matching your criteria</h3><p>Try adjusting your search or filters</p></div>';
        return;
    }
    
    // Display each meal
    mealsOrSuggestions.forEach(meal => {
        const title = meal.displayTitle || meal.title || '';
        const description = meal.displayDescription || meal.description || '';
        const image = meal.image || 'assets/default-recipe.jpg';
        const type = meal.type ? (meal.type.charAt ? meal.type.charAt(0).toUpperCase() + meal.type.slice(1) : meal.type) : '';
        const cuisine = meal.cuisine ? (meal.cuisine.charAt ? meal.cuisine.charAt(0).toUpperCase() + meal.cuisine.slice(1) : meal.cuisine) : '';
        const time = meal.time || '';
        const calories = meal.calories || '';
        
        suggestionsGrid.innerHTML += '<div class="meal-card" onclick="viewMeal(\'' + meal.id + '\')" style="cursor: pointer;"><div class="meal-image" style="background-image: url(' + image + ')"><span class="meal-badge">' + type + '</span></div><div class="meal-content"><h3 class="meal-title">' + title + '</h3><p class="meal-description">' + description + '</p><div class="meal-meta"><span><i class="fas fa-globe-americas"></i> ' + cuisine + '</span><span><i class="fas fa-clock"></i> ' + time + ' mins</span><span><i class="fas fa-fire"></i> ' + calories + ' kcal</span></div><div class="meal-actions" onclick="event.stopPropagation();"><button class="btn-save" data-id="' + meal.id + '"><i class="fas fa-plus"></i> Save</button><button class="btn-view" data-id="' + meal.id + '"><i class="fas fa-eye"></i> View</button></div></div></div>';
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.btn-save').forEach(btn => {
        btn.addEventListener('click', function() {
            saveMeal(this.dataset.id);
        });
    });
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function() {
            viewMeal(this.dataset.id);
        });
    });
}

// View meal details
function viewMeal(mealId) {
    console.log('viewMeal called with ID:', mealId);
    
    // Navigate to recipe detail page with the meal/recipe ID
    if (mealId) {
        const debugParam = new URLSearchParams(window.location.search).get('debug') === 'true' ? '&debug=true' : '';
        const targetUrl = 'recipe-detail.html?id=' + mealId + debugParam;
        
        console.log('Navigating to:', targetUrl);
        window.location.href = targetUrl;
    } else {
        console.error('No meal ID provided for viewing');
        alert('Error: No meal ID provided for viewing');
    }
}

// Save meal to plan
function saveMeal(mealId) {
    const meal = mealData.find(m => m.id === parseInt(mealId));
    alert('Added "' + meal.title + '" to your meal plan!');
}

// Make functions globally available
window.viewMeal = viewMeal;

document.addEventListener('DOMContentLoaded', async function() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            authButtons.classList.toggle('active');
            this.querySelector('i').classList.toggle('fa-times');
        });
    }

    // Logout Functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }

    // Initialize enhanced functionality
    console.log('Initializing enhanced meal suggestion system...');
    
    // Wait for enhanced API to be available
    let apiInitialized = false;
    let retryCount = 0;
    const maxRetries = 10;
    
    const waitForEnhancedAPI = () => {
        return new Promise((resolve) => {
            const checkAPI = () => {
                if (window.enhancedRecipeAPI && typeof window.enhancedRecipeAPI.searchRecipes === 'function') {
                    console.log('Enhanced API is ready');
                    apiInitialized = true;
                    resolve(true);
                } else if (retryCount < maxRetries) {
                    retryCount++;
                    console.log('Waiting for enhanced API... attempt ' + retryCount + '/' + maxRetries);
                    setTimeout(checkAPI, 500);
                } else {
                    console.warn('Enhanced API not available after max retries');
                    resolve(false);
                }
            };
            checkAPI();
        });
    };
    
    // Wait for enhanced API and then initialize
    const apiReady = await waitForEnhancedAPI();
    
    if (!apiReady) {
        console.warn('Enhanced API not available, will use direct API calls only');
    }
    
    // Set up search functionality
    initSearch();
    
    // Load initial data
    console.log('Loading initial meal data...');
    try {
        await loadAllRecipes();
    } catch (error) {
        console.error('Failed to load initial recipes:', error);
        // Show a user-friendly message instead of just failing
        const suggestionsGrid = document.querySelector('.suggestions-grid');
        if (suggestionsGrid) {
            suggestionsGrid.innerHTML = '<div class="load-error" style="grid-column: 1 / -1; text-align: center; padding: 40px;"><h3>Unable to load recipes</h3><p>There was an issue loading the recipe database. This could be due to network connectivity issues, server maintenance, or authentication problems.</p><button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 5px; cursor: pointer;">Try Again</button></div>';
        }
    }

    // Utility function to load all recipes - matches Recipes.js approach
    async function loadAllRecipes() {
        console.log('Loading all recipes (same as Recipes page)...');
        
        const suggestionsGrid = document.querySelector('.suggestions-grid');
        if (suggestionsGrid) {
            suggestionsGrid.innerHTML = '<div class="loading-all-recipes" style="grid-column: 1 / -1; text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 50px; color: #ff6b35; margin-bottom: 20px;"></i><h3>Loading all recipes...</h3></div>';
        }
        
        try {
            // Use the same approach as Recipes.js
            const recipes = await fetchRecipesFromBackend();
            
            if (recipes && Array.isArray(recipes) && recipes.length > 0) {
                console.log('Successfully loaded ' + recipes.length + ' recipes from backend');
                console.log('First few recipes:', recipes.slice(0, 2));
                mealData = recipes;
                displayMeals(recipes);
            } else {
                console.log('No recipes available from backend, loading fallback data');
                const fallbackRecipes = getFallbackMealRecipes();
                mealData = fallbackRecipes;
                displayMeals(fallbackRecipes);
            }
            
        } catch (error) {
            console.error('Error loading all recipes:', error);
            console.log('Loading fallback recipes due to error...');
            const fallbackRecipes = getFallbackMealRecipes();
            mealData = fallbackRecipes;
            displayMeals(fallbackRecipes);
        }
    }

    // Fetch recipes from backend - same logic as Recipes.js
    async function fetchRecipesFromBackend() {
        const token = localStorage.getItem('authToken');
        try {
            console.log('Fetching recipes from API (same as Recipes page)...');
            const response = await fetch('https://njoya.pythonanywhere.com/api/recipes/', {
                method: 'GET',
                headers: token ? { 'Authorization': 'Token ' + token } : {},
            });
            
            if (!response.ok) {
                console.warn('API call failed with status: ' + response.status + ' ' + response.statusText);
                throw new Error('API call failed with status: ' + response.status);
            }
            
            const data = await response.json();
            console.log('Successfully fetched recipes from API');
            console.log('Raw API Response:', data);
            console.log('Total recipes fetched:', data.length);
            
            // Only use recipes that have a contributor (created by users) - same as Recipes.js
            const contributorRecipes = data.filter(recipe => recipe.contributor);
            console.log('Recipes with contributors: ' + contributorRecipes.length);
            
            // Format recipes for MealSuggestion display
            const formattedRecipes = contributorRecipes.map(recipe => ({
                ...recipe,
                title: recipe.title || recipe.name || 'Untitled Recipe',
                description: recipe.description || 'No description available',
                image: recipe.image || 'assets/default-recipe.jpg',
                type: recipe.meal_type || recipe.type || 'main',
                cuisine: recipe.cuisine || 'International',
                time: recipe.cooking_time || recipe.prep_time || recipe.time || '30',
                calories: recipe.calories || 'Unknown',
                servings: recipe.servings || '1-2'
            }));
            
            return formattedRecipes;
        } catch (error) {
            console.warn('Network error fetching recipes:', error);
            throw error; // Re-throw to trigger fallback in loadAllRecipes
        }
    }

    // Fallback recipes for when API is not available - similar to Recipes.js
    function getFallbackMealRecipes() {
        console.log('Loading fallback meal recipes...');
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
                type: "dinner",
                cuisine: "italian",
                contributor: { 
                    username: "ChopSmo Chef"
                }
            },
            {
                id: 2,
                title: "Healthy Salad Bowl",
                name: "Fresh Salad",
                description: "A nutritious and colorful salad bowl with fresh vegetables.",
                image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
                time: "15",
                calories: "200",
                servings: "2",
                type: "lunch",
                cuisine: "mediterranean",
                contributor: { 
                    username: "ChopSmo Chef"
                }
            },
            {
                id: 3,
                title: "Breakfast Pancakes",
                name: "Fluffy Pancakes",
                description: "Light and fluffy pancakes perfect for a weekend breakfast.",
                image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
                time: "25",
                calories: "300",
                servings: "3",
                type: "breakfast",
                cuisine: "american",
                contributor: { 
                    username: "ChopSmo Chef"
                }
            },
            {
                id: 4,
                title: "Ndole with Plantains",
                name: "Traditional Ndole",
                description: "A delicious Cameroonian dish made with bitter leaves and ground nuts, served with plantains.",
                image: "images/Ndole and Plaintain.jpg",
                time: "90",
                calories: "450",
                servings: "4",
                type: "dinner",
                cuisine: "cameroonian",
                contributor: { 
                    username: "NjoyaChef"
                }
            },
            {
                id: 5,
                title: "Eru with Garri",
                name: "Forest Leaf Eru",
                description: "A nutritious forest leaf dish cooked with palm oil and served with garri (cassava flakes).",
                image: "images/Eru.jpg",
                time: "65",
                calories: "320",
                servings: "6",
                type: "dinner",
                cuisine: "cameroonian",
                contributor: { 
                    username: "EruMaster"
                }
            }
        ];
    }

    // Make functions globally available
    window.loadAllRecipes = loadAllRecipes;

}); // End of DOMContentLoaded
