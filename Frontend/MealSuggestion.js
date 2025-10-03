const resolveMealSuggestionApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
        if (typeof window.getChopsmoApiBaseUrl === 'function') {
            const resolved = window.getChopsmoApiBaseUrl();
            if (resolved) return resolved;
        }
        if (typeof window.buildChopsmoUrl === 'function') {
            return window.buildChopsmoUrl();
        }
        if (window.CHOPSMO_CONFIG && window.CHOPSMO_CONFIG.API_BASE_URL) {
            return window.CHOPSMO_CONFIG.API_BASE_URL;
        }
    }
    return 'http://56.228.22.20';
};

const MEAL_SUGGESTION_API_BASE_URL = resolveMealSuggestionApiBaseUrl();
const MEAL_SUGGESTION_NORMALIZED_API_BASE = MEAL_SUGGESTION_API_BASE_URL.replace(/\/$/, '');
const buildMealSuggestionApiUrl = (path = '') => {
    if (typeof window !== 'undefined' && typeof window.buildChopsmoApiUrl === 'function') {
        return window.buildChopsmoApiUrl(path);
    }
    if (!path) return MEAL_SUGGESTION_NORMALIZED_API_BASE;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${MEAL_SUGGESTION_NORMALIZED_API_BASE}${normalizedPath}`;
};

const MEAL_SUGGESTION_ENDPOINTS = Object.freeze({
    suggestByIngredients: buildMealSuggestionApiUrl('/api/recipes/suggest-by-ingredients/'),
    recipes: buildMealSuggestionApiUrl('/api/recipes/'),
    ingredients: buildMealSuggestionApiUrl('/api/ingredients/')
});

// --- Ingredient Validation and Autocomplete ---
var validIngredientNames = [];

// --- Filter DOM elements (fix ReferenceError) ---
const mealTypeFilter = document.getElementById('meal-type');
const cuisineFilter = document.getElementById('cuisine');
const cookingTimeFilter = document.getElementById('cooking-time');

// --- Enhanced search functionality ---
function initSearch() {
    const searchInput = document.getElementById('mealSearch');
    const searchButton = document.getElementById('searchButton');
    const searchTags = document.querySelectorAll('.remove-tag');
    
    if (!searchInput || !searchButton) {
        console.warn('⚠️ Search elements not found in DOM');
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
    console.log('🔍 Performing search for:', searchTerm);
    
    // Show loading state
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (suggestionsGrid) {
        suggestionsGrid.innerHTML = '<div class="loading-spinner">🔍 Searching recipes...</div>';
    }
    
    try {
        let results = [];
        
        // Use enhanced recipe API if available
        if (window.enhancedRecipeAPI && searchTerm) {
            console.log('🚀 Using enhanced recipe API for search');
            
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
            
            console.log('✅ Search results from API:', results);
            
        } else if (searchTerm) {
            // Fallback to local search if API not available
            console.log('📋 Using local search fallback');
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
        console.error('❌ Search error:', error);
        displaySearchError(error.message);
    }
}

function displayNoResults(searchTerm) {
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (!suggestionsGrid) return;
    
    suggestionsGrid.innerHTML = `
        <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <i class="fas fa-search" style="font-size: 50px; color: #ccc; margin-bottom: 20px;"></i>
            <h3>No recipes found</h3>
            <p>No recipes match "${searchTerm}". Try:</p>
            <ul style="text-align: left; display: inline-block; margin-top: 15px;">
                <li>Different keywords</li>
                <li>Broader search terms</li>
                <li>Checking your spelling</li>
                <li>Using ingredient-based suggestions below</li>
            </ul>
        </div>
    `;
}

function displaySearchError(errorMessage) {
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (!suggestionsGrid) return;
    
    suggestionsGrid.innerHTML = `
        <div class="search-error" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 50px; color: #f44336; margin-bottom: 20px;"></i>
            <h3>Search Error</h3>
            <p>Unable to search recipes: ${errorMessage}</p>
            <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Retry
            </button>
        </div>
    `;
}

function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(searchTerm, 'gi');
    return text.replace(regex, match => 
        `<span class="highlight">${match}</span>`
    );
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

// --- Fetch meal suggestions from backend based on ingredients ---
async function fetchMealSuggestionsByIngredients(ingredientNames) {
    const token = localStorage.getItem('authToken');
    try {
    const response = await fetch(MEAL_SUGGESTION_ENDPOINTS.suggestByIngredients, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Token ${token}` } : {})
            },
            body: JSON.stringify({ ingredient_names: ingredientNames })
        });
        const data = await response.json();
        if (!response.ok) {
            // If backend provides suggestions or corrected ingredients, show them
            let errorMsg = 'Failed to load meal suggestions.';
            if (data.suggestions && typeof data.suggestions === 'object') {
                // Build a user-friendly message for each ingredient
                let suggestionLines = [];
                for (const [input, suggestion] of Object.entries(data.suggestions)) {
                    if (Array.isArray(suggestion) && suggestion.length === 0) {
                        suggestionLines.push(`No match found for: ${input}`);
                    } else if (typeof suggestion === 'string' && suggestion) {
                        suggestionLines.push(`Did you mean: ${suggestion} instead of ${input}?`);
                    } else if (Array.isArray(suggestion) && suggestion.length > 0) {
                        suggestionLines.push(`Did you mean: ${suggestion.join(', ')} instead of ${input}?`);
                    }
                }
                errorMsg = suggestionLines.join('\n');
            } else if (data.suggestions || data.corrected_ingredients) {
                let suggestionList = data.suggestions || data.corrected_ingredients;
                if (Array.isArray(suggestionList) && suggestionList.length > 0) {
                    errorMsg =
                        'Some ingredients were not recognized.\n' +
                        'Did you mean: ' + suggestionList.join(', ') + '?';
                }
            } else if (data.detail) errorMsg = data.detail;
            else if (data.error) errorMsg = data.error;
            else if (data.message) errorMsg = data.message;
            else if (typeof data === 'string') errorMsg = data;
            alert(errorMsg);
            return [];
        }
        // The backend should return an array of suggested recipes
        return data.suggested_recipes || [];
    } catch (error) {
        alert('Network error. Please try again later.');
        return [];
    }
}

// --- Enhanced ingredient-based meal suggestions ---
async function handleIngredientSuggestion() {
    console.log('🥘 Starting ingredient-based suggestion process...');
    
    // Collect ingredient names from the UI
    const ingredientTags = document.querySelectorAll('.ingredient-tag');
    let ingredientNames = Array.from(ingredientTags).map(tag => tag.dataset.name || tag.textContent.trim());
    
    // Also check input field
    const input = document.getElementById('ingredientInput');
    if (input && input.value) {
        const inputIngredients = input.value.split(',').map(s => s.trim()).filter(Boolean);
        ingredientNames = [...ingredientNames, ...inputIngredients];
    }
    
    // Remove duplicates
    ingredientNames = [...new Set(ingredientNames.filter(name => name && name.length > 0))];
    
    console.log('🥬 Collected ingredients:', ingredientNames);
    
    if (ingredientNames.length === 0) {
        alert('Please add some ingredients first to get suggestions.');
        return;
    }
    
    if (ingredientNames.length < 4) {
        alert('Please provide at least 4 ingredients for better suggestions. This ensures more accurate recipe matches.');
        return;
    }
    
    // Show loading state
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (suggestionsGrid) {
        suggestionsGrid.innerHTML = `
            <div class="loading-suggestions" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div class="spinner" style="margin-bottom: 20px;">🔄</div>
                <h3>Finding recipes with your ingredients...</h3>
                <p>Ingredients: ${ingredientNames.join(', ')}</p>
            </div>
        `;
    }
    
    try {
        let suggestions;
        
        // Use enhanced API if available
        if (window.enhancedRecipeAPI) {
            console.log('🚀 Using enhanced recipe API for ingredient suggestions');
            suggestions = await window.enhancedRecipeAPI.getRecipeSuggestions(ingredientNames, {
                limit: 15,
                includeMissing: true
            });
            
            if (suggestions.success && suggestions.recipes.length > 0) {
                console.log('✅ Enhanced API suggestions received:', suggestions);
                displayIngredientSuggestions(suggestions.recipes, ingredientNames);
            } else {
                console.log('⚠️ Enhanced API returned no results, trying fallback');
                displaySuggestionError(suggestions.error, suggestions.suggestions, ingredientNames);
            }
        } else {
            // Fallback to original API
            console.log('📡 Using fallback ingredient API');
            const fallbackSuggestions = await fetchMealSuggestionsByIngredients(ingredientNames);
            
            if (fallbackSuggestions && fallbackSuggestions.length > 0) {
                displayIngredientSuggestions(fallbackSuggestions, ingredientNames);
            } else {
                displayNoIngredientMatches(ingredientNames);
            }
        }
        
    } catch (error) {
        console.error('❌ Error getting ingredient suggestions:', error);
        displaySuggestionError(error.message, {}, ingredientNames);
    }
}

function displayIngredientSuggestions(suggestions, userIngredients) {
    console.log('🍽️ Displaying ingredient-based suggestions:', suggestions);
    
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (!suggestionsGrid) return;
    
    // Clear loading state
    suggestionsGrid.innerHTML = '';
    
    // Add header for ingredient-based results
    suggestionsGrid.innerHTML = `
        <div class="suggestions-header" style="grid-column: 1 / -1; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; color: #2c3e50;">
                <i class="fas fa-magic"></i> Recipe Suggestions Based On Your Ingredients
            </h3>
            <p style="margin: 0; color: #666;">
                <strong>Your ingredients:</strong> ${userIngredients.join(', ')}
            </p>
        </div>
    `;
    
    // Process and display suggestions
    suggestions.forEach((suggestion, index) => {
        const recipe = suggestion.recipe || suggestion;
        const message = suggestion.message || '';
        const missingIngredients = suggestion.missing_ingredients || [];
        const substitutions = suggestion.substitutions || {};
        const matchPercentage = suggestion.match_percentage || '';
        
        const title = recipe.title || recipe.name || 'Untitled Recipe';
        const description = recipe.description || 'No description available';
        const image = recipe.image || 'assets/default-recipe.jpg';
        const cuisine = recipe.cuisine || 'International';
        const cookingTime = recipe.cooking_time || recipe.time || 'Unknown';
        const difficulty = recipe.difficulty || 'Medium';
        
        // Create missing ingredients display
        const missingHtml = missingIngredients.length > 0 ? `
            <div class="missing-ingredients" style="margin: 8px 0; padding: 6px; background: #fff3cd; border-radius: 4px;">
                <small style="color: #856404;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Missing: ${missingIngredients.join(', ')}
                </small>
            </div>
        ` : '';
        
        // Create substitutions display
        const substitutionsHtml = Object.keys(substitutions).length > 0 ? `
            <div class="substitutions" style="margin: 8px 0; padding: 6px; background: #d1ecf1; border-radius: 4px;">
                <small style="color: #0c5460;">
                    <i class="fas fa-exchange-alt"></i> 
                    Substitutions: ${Object.entries(substitutions).map(([k, v]) => `${k} → ${v}`).join(', ')}
                </small>
            </div>
        ` : '';
        
        // Create match percentage display
        const matchHtml = matchPercentage ? `
            <div class="match-percentage" style="position: absolute; top: 10px; right: 10px; background: #28a745; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                ${matchPercentage}% match
            </div>
        ` : '';
        
        // Create suggestion message
        const messageHtml = message ? `
            <div class="suggestion-message" style="margin: 8px 0; padding: 6px; background: #d4edda; border-radius: 4px;">
                <small style="color: #155724;">
                    <i class="fas fa-lightbulb"></i> ${message}
                </small>
            </div>
        ` : '';
        
        suggestionsGrid.innerHTML += `
            <div class="meal-card suggestion-card" style="position: relative; cursor: pointer; border: 2px solid #e9ecef; transition: border-color 0.3s;" onclick="viewMeal('${recipe.id}')">
                ${matchHtml}
                <div class="meal-image" style="background-image: url('${image}'); height: 200px; background-size: cover; background-position: center; border-radius: 8px 8px 0 0;">
                    <span class="meal-badge" style="background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; position: absolute; bottom: 10px; left: 10px;">
                        ${cuisine}
                    </span>
                </div>
                <div class="meal-content" style="padding: 15px;">
                    <h3 class="meal-title" style="margin: 0 0 8px 0; font-size: 18px; line-height: 1.3;">${title}</h3>
                    <p class="meal-description" style="margin: 0 0 10px 0; color: #666; font-size: 14px; line-height: 1.4;">${description}</p>
                    
                    <div class="meal-meta" style="display: flex; gap: 15px; margin-bottom: 10px; font-size: 13px; color: #888;">
                        <span><i class="fas fa-clock"></i> ${cookingTime} mins</span>
                        <span><i class="fas fa-chart-bar"></i> ${difficulty}</span>
                    </div>
                    
                    ${messageHtml}
                    ${missingHtml}
                    ${substitutionsHtml}
                    
                    <div class="meal-actions" style="margin-top: 15px; display: flex; gap: 10px;" onclick="event.stopPropagation();">
                        <button class="btn-view" data-id="${recipe.id}" style="flex: 1; padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-eye"></i> View Recipe
                        </button>
                        <button class="btn-save" data-id="${recipe.id}" style="padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-bookmark"></i> Save
                        </button>
                    </div>
                </div>
            </div>
        `;
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
    
    console.log('✅ Ingredient suggestions displayed successfully');
}

function displaySuggestionError(error, suggestions, userIngredients) {
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (!suggestionsGrid) return;
    
    let suggestionText = '';
    if (suggestions && Object.keys(suggestions).length > 0) {
        suggestionText = Object.entries(suggestions).map(([input, suggestion]) => {
            if (Array.isArray(suggestion) && suggestion.length > 0) {
                return `Did you mean "${suggestion.join(', ')}" instead of "${input}"?`;
            } else if (typeof suggestion === 'string' && suggestion) {
                return `Did you mean "${suggestion}" instead of "${input}"?`;
            }
            return `No matches found for "${input}"`;
        }).join('<br>');
    }
    
    suggestionsGrid.innerHTML = `
        <div class="suggestion-error" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <i class="fas fa-exclamation-circle" style="font-size: 50px; color: #f39c12; margin-bottom: 20px;"></i>
            <h3>Unable to find recipe suggestions</h3>
            <p><strong>Your ingredients:</strong> ${userIngredients.join(', ')}</p>
            ${suggestionText ? `<div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 8px;"><strong>Suggestions:</strong><br>${suggestionText}</div>` : ''}
            <p>Try:</p>
            <ul style="text-align: left; display: inline-block; margin-top: 15px;">
                <li>Checking your ingredient spelling</li>
                <li>Using more common ingredient names</li>
                <li>Adding more ingredients (at least 3-4 work best)</li>
                <li>Browsing our recipe collection instead</li>
            </ul>
            <button onclick="loadAllRecipes()" style="margin-top: 15px; padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Browse All Recipes
            </button>
        </div>
    `;
}

function displayNoIngredientMatches(userIngredients) {
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (!suggestionsGrid) return;
    
    suggestionsGrid.innerHTML = `
        <div class="no-matches" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <i class="fas fa-search" style="font-size: 50px; color: #6c757d; margin-bottom: 20px;"></i>
            <h3>No recipes found with these ingredients</h3>
            <p><strong>Your ingredients:</strong> ${userIngredients.join(', ')}</p>
            <div style="margin: 20px 0; padding: 15px; background: #e9ecef; border-radius: 8px;">
                <strong>Tips for better results:</strong>
                <ul style="text-align: left; display: inline-block; margin-top: 10px;">
                    <li>Try common ingredients like chicken, rice, pasta, tomato</li>
                    <li>Use simple ingredient names (e.g., "tomato" not "cherry tomatoes")</li>
                    <li>Add staple ingredients like onion, garlic, oil</li>
                    <li>Include a protein and a carb for main dishes</li>
                </ul>
            </div>
            <button onclick="loadAllRecipes()" style="margin-top: 15px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Browse All Recipes
            </button>
        </div>
    `;
}

// Example usage: fetch suggestions for pasta
// You can call this function with the actual user-selected ingredients
// For demo, let's use some common pasta ingredients
const pastaIngredients = ['pasta', 'tomato', 'olive oil', 'garlic'];
fetchMealSuggestionsByIngredients(pastaIngredients).then(suggestions => {
    mealData = suggestions;
    displayMeals(mealData);
});

// Update displayMeals function to handle search results
function displayMeals(mealsOrSuggestions) {
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (!suggestionsGrid) return;
    // Remove any loading spinner or previous content
    suggestionsGrid.innerHTML = '';
    // If backend returns the new format: [{recipe, message, ...}]
    if (Array.isArray(mealsOrSuggestions) && mealsOrSuggestions.length > 0 && mealsOrSuggestions[0].recipe) {
        mealsOrSuggestions.forEach(suggestion => {
            const recipe = suggestion.recipe || {};
            const title = recipe.title || recipe.name || '';
            const description = recipe.description || '';
            // Use default image if none provided
            const image = recipe.image || 'assets/default-recipe.jpg';
            const type = recipe.type ? (recipe.type.charAt ? recipe.type.charAt(0).toUpperCase() + recipe.type.slice(1) : recipe.type) : '';
            const cuisine = recipe.cuisine ? (recipe.cuisine.charAt ? recipe.cuisine.charAt(0).toUpperCase() + recipe.cuisine.slice(1) : recipe.cuisine) : '';
            const time = recipe.time || '';
            const calories = recipe.calories || '';
            const message = suggestion.message || '';
            const missing = suggestion.missing_ingredients && suggestion.missing_ingredients.length > 0
                ? `<div class='missing-ingredients' style='color:#f44336;font-size:14px;margin:8px 0;'>Missing: ${suggestion.missing_ingredients.join(', ')}</div>`
                : '';
            let substitutions = '';
            if (suggestion.substitutions && Object.keys(suggestion.substitutions).length > 0) {
                substitutions = `<div class='substitutions' style='color:#888;font-size:13px;margin:6px 0;'>Substitutions: ` +
                    Object.entries(suggestion.substitutions).map(([k, v]) => `${k} → ${v}`).join(', ') + '</div>';
            }            suggestionsGrid.innerHTML += `
                <div class="meal-card" onclick="viewMeal('${recipe.id}')" style="cursor: pointer;">
                    <div class="meal-image" style="background-image: url(${image})">
                        <span class="meal-badge">${type}</span>
                    </div>
                    <div class="meal-content">
                        <h3 class="meal-title">${title}</h3>
                        <p class="meal-description">${description}</p>
                        <div class="meal-meta">
                            <span><i class="fas fa-globe-americas"></i> ${cuisine}</span>
                            <span><i class="fas fa-clock"></i> ${time} mins</span>
                            <span><i class="fas fa-fire"></i> ${calories} kcal</span>
                        </div>
                        ${message ? `<div class='suggestion-message' style='color:#388E3C;font-size:15px;margin:8px 0;'>${message}</div>` : ''}
                        ${missing}
                        ${substitutions}
                        <div class="meal-actions" onclick="event.stopPropagation();">
                            <button class="btn-save" data-id="${recipe.id}"><i class="fas fa-plus"></i> Save</button>
                            <button class="btn-view" data-id="${recipe.id}"><i class="fas fa-eye"></i> View</button>
                        </div>
                    </div>
                </div>
            `;
        });
    } else if (!Array.isArray(mealsOrSuggestions) || mealsOrSuggestions.length === 0) {
        suggestionsGrid.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-utensils" style="font-size: 50px; color: #ccc; margin-bottom: 20px;"></i>
                <h3>No meals found matching your criteria</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    } else {
        // Fallback: display as before
        mealsOrSuggestions.forEach(meal => {
            const title = meal.displayTitle || meal.title || '';
            const description = meal.displayDescription || meal.description || '';
            // Use default image if none provided
            const image = meal.image || 'assets/default-recipe.jpg';
            const type = meal.type ? (meal.type.charAt ? meal.type.charAt(0).toUpperCase() + meal.type.slice(1) : meal.type) : '';
            const cuisine = meal.cuisine ? (meal.cuisine.charAt ? meal.cuisine.charAt(0).toUpperCase() + meal.cuisine.slice(1) : meal.cuisine) : '';
            const time = meal.time || '';
            const calories = meal.calories || '';            suggestionsGrid.innerHTML += `
                <div class="meal-card" onclick="viewMeal('${meal.id}')" style="cursor: pointer;">
                    <div class="meal-image" style="background-image: url(${image})">
                        <span class="meal-badge">${type}</span>
                    </div>
                    <div class="meal-content">
                        <h3 class="meal-title">${title}</h3>
                        <p class="meal-description">${description}</p>
                        <div class="meal-meta">
                            <span><i class="fas fa-globe-americas"></i> ${cuisine}</span>
                            <span><i class="fas fa-clock"></i> ${time} mins</span>
                            <span><i class="fas fa-fire"></i> ${calories} kcal</span>
                        </div>
                        <div class="meal-actions" onclick="event.stopPropagation();">
                            <button class="btn-save" data-id="${meal.id}"><i class="fas fa-plus"></i> Save</button>
                            <button class="btn-view" data-id="${meal.id}"><i class="fas fa-eye"></i> View</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
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

// Add to your initialization code

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
    console.log('🚀 Initializing enhanced meal suggestion system...');
    
    // Set up search functionality
    initSearch();
    
    // Set up ingredient input functionality
    setupIngredientInput();
    
    // Load initial data
    console.log('📚 Loading initial meal data...');
    await loadAllRecipes();

    // --- Fetch meals from backend (enhanced version) ---
    let mealData = [];

    async function fetchMealsFromBackend() {
        console.log('📡 Fetching meals from backend...');
        
        try {
            let recipes = [];
            
            // Try enhanced API first
            if (window.enhancedRecipeAPI) {
                console.log('🚀 Using enhanced recipe API');
                recipes = await window.enhancedRecipeAPI.searchRecipes('', {
                    includeIngredients: true,
                    limit: 100
                });
            }
            
            // Fallback to regular API
            if (!recipes || recipes.length === 0) {
                console.log('📡 Using fallback API');
                const response = await fetch(MEAL_SUGGESTION_ENDPOINTS.recipes, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                recipes = data.results || data;
            }
            
            // Filter and format recipes
            const validRecipes = recipes.filter(recipe => 
                recipe && (recipe.title || recipe.name) && recipe.description
            ).map(recipe => ({
                ...recipe,
                title: recipe.title || recipe.name,
                type: recipe.meal_type || recipe.type || 'main',
                cuisine: recipe.cuisine || 'International',
                time: recipe.cooking_time || recipe.prep_time || 30,
                calories: recipe.calories || 'Unknown'
            }));
            
            console.log(`✅ Loaded ${validRecipes.length} valid recipes`);
            return validRecipes;
            
        } catch (error) {
            console.error('❌ Error fetching meals:', error);
            showToast('Failed to load meals. Please try again later.', 'error');
            return [];
        }
    }

    // DOM elements
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    const mealTypeFilter = document.getElementById('meal-type');
    const cuisineFilter = document.getElementById('cuisine');
    const cookingTimeFilter = document.getElementById('cooking-time');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const shuffleBtn = document.getElementById('shuffle');


    initSearch(); // Initialize search functionality
    // Display meals
    function displayMeals(meals) {
        // Ensure suggestionsGrid is defined
        const suggestionsGrid = document.querySelector('.suggestions-grid');
        if (!suggestionsGrid) return;
        suggestionsGrid.innerHTML = '';
        if (!Array.isArray(meals) || meals.length === 0) {
            suggestionsGrid.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-utensils" style="font-size: 50px; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>No meals found matching your filters</h3>
                    <p>Try adjusting your filter criteria</p>
                </div>
            `;
            return;
        }
        
        meals.forEach(meal => {
            // Defensive: handle missing/null fields
            const title = meal.displayTitle || meal.title || '';
            const description = meal.displayDescription || meal.description || '';
            // Use default image if none provided
            const image = meal.image || 'assets/default-recipe.jpg';
            const type = meal.type ? (meal.type.charAt ? meal.type.charAt(0).toUpperCase() + meal.type.slice(1) : meal.type) : '';
            const cuisine = meal.cuisine ? (meal.cuisine.charAt ? meal.cuisine.charAt(0).toUpperCase() + meal.cuisine.slice(1) : meal.cuisine) : '';
            const time = meal.time || '';
            const calories = meal.calories || '';            suggestionsGrid.innerHTML += `
                <div class="meal-card" onclick="viewMeal('${meal.id}')" style="cursor: pointer;">
                    <div class="meal-image" style="background-image: url(${image})">
                        <span class="meal-badge">${type}</span>
                    </div>
                    <div class="meal-content">
                        <h3 class="meal-title">${title}</h3>
                        <p class="meal-description">${description}</p>
                        <div class="meal-meta">
                            <span><i class="fas fa-globe-americas"></i> ${cuisine}</span>
                            <span><i class="fas fa-clock"></i> ${time} mins</span>
                            <span><i class="fas fa-fire"></i> ${calories} kcal</span>
                        </div>
                        <div class="meal-actions" onclick="event.stopPropagation();">
                            <button class="btn-save" data-id="${meal.id}"><i class="fas fa-plus"></i> Save</button>
                            <button class="btn-view" data-id="${meal.id}"><i class="fas fa-eye"></i> View</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // Filter meals
    function filterMeals() {
        const typeValue = mealTypeFilter.value;
        const cuisineValue = cuisineFilter.value;
        const timeValue = cookingTimeFilter.value;
        
        const filteredMeals = mealData.filter(meal => {
            return (typeValue === 'all' || meal.type === typeValue) &&
                   (cuisineValue === 'all' || meal.cuisine === cuisineValue) &&
                   (timeValue === 'all' || meal.time <= parseInt(timeValue));
        });
        
        displayMeals(filteredMeals);
    }

    // Shuffle meals
    function shuffleMeals() {
        const shuffled = [...mealData].sort(() => 0.5 - Math.random());
        displayMeals(shuffled.slice(0, 6));
    }

    // Save meal to plan
    function saveMeal(mealId) {
        const meal = mealData.find(m => m.id === parseInt(mealId));
        alert(`Added "${meal.title}" to your meal plan!`);
        // In a real app, you would save this to the user's meal plan
    }    // View meal details
    function viewMeal(mealId) {
        console.log('viewMeal called with ID:', mealId);
        
        // Navigate to recipe detail page with the meal/recipe ID
        if (mealId) {
            // Add some debugging info to the URL to help with troubleshooting
            const debugParam = new URLSearchParams(window.location.search).get('debug') === 'true' ? '&debug=true' : '';
            const targetUrl = `recipe-detail.html?id=${mealId}${debugParam}`;
            
            console.log('Navigating to:', targetUrl);
            window.location.href = targetUrl;
        } else {
            console.error('No meal ID provided for viewing');
            alert('Error: No meal ID provided for viewing');
        }
    }

    // Make viewMeal function globally available for onclick handlers
    window.viewMeal = viewMeal;

    // Event listeners
    applyFiltersBtn.addEventListener('click', filterMeals);
    shuffleBtn.addEventListener('click', shuffleMeals);

    // --- Ingredient Selection UI ---
    // Add a simple UI for entering/selecting ingredients as tags
    const ingredientInput = document.getElementById('ingredientInput');
    const ingredientTagsContainer = document.getElementById('ingredientTags');
    const suggestMealsBtn = document.getElementById('suggestMealsBtn');
    const suggestByBudgetBtn = document.getElementById('suggestByBudgetBtn');
    
    if (suggestMealsBtn) {
        suggestMealsBtn.addEventListener('click', handleIngredientSuggestion);
    }
    
    if (suggestByBudgetBtn) {
        suggestByBudgetBtn.addEventListener('click', handleBudgetSuggestion);
    }

    function addIngredientTag(name) {
        if (!name) return;
        // Prevent duplicates
        if ([...ingredientTagsContainer.children].some(tag => tag.dataset.name === name.toLowerCase())) return;
        const tag = document.createElement('span');
        tag.className = 'ingredient-tag';
        tag.dataset.name = name.toLowerCase();
        tag.textContent = name;
        tag.style = 'display:inline-block;background:#e0e0e0;color:#333;padding:6px 14px;border-radius:16px;margin:4px 6px 4px 0;font-size:15px;position:relative;';
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.style = 'background:none;border:none;color:#c00;font-size:16px;margin-left:8px;cursor:pointer;position:relative;top:-1px;';
        removeBtn.onclick = () => tag.remove();
        tag.appendChild(removeBtn);
        ingredientTagsContainer.appendChild(tag);
    }

    // Add ingredient on Enter or comma
    ingredientInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const value = ingredientInput.value.trim();
            if (value) addIngredientTag(value);
            ingredientInput.value = '';
        }
    });
    // Add ingredient on blur
    ingredientInput.addEventListener('blur', function() {
        const value = ingredientInput.value.trim();
        if (value) addIngredientTag(value);
        ingredientInput.value = '';
    });

    // --- Style for ingredient tags ---
    const tagStyle = document.createElement('style');
    tagStyle.innerHTML = `.ingredient-tag { transition: background 0.2s; } .ingredient-tag:hover { background: #d0ffd0; }`;
    document.head.appendChild(tagStyle);

    // --- Ingredient Validation and Autocomplete ---
    var validIngredientNames = [];

    async function loadValidIngredients() {
        try {
            const response = await fetch(MEAL_SUGGESTION_ENDPOINTS.ingredients, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                validIngredientNames = data.map(ing => ing.name.toLowerCase());
            }
        } catch (e) {
            validIngredientNames = [];
        }
    }

    // --- Ingredient Autocomplete ---
    function setupIngredientAutocomplete(input) {
        let datalist = document.getElementById('ingredientDatalist');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'ingredientDatalist';
            document.body.appendChild(datalist);
        }
        input.setAttribute('list', 'ingredientDatalist');
        function updateDatalist() {
            datalist.innerHTML = validIngredientNames.map(name => `<option value="${name}"></option>`).join('');
        }
        updateDatalist();
        input.addEventListener('input', updateDatalist);
    }

    await loadValidIngredients();
    if (ingredientInput) setupIngredientAutocomplete(ingredientInput);

    // Initialize
    setTimeout(async () => {
        mealData = await fetchMealsFromBackend();
        displayMeals(mealData);
    }, 1000); // Simulate loading delay

    // Utility function to load all recipes (for fallback scenarios)
    async function loadAllRecipes() {
        console.log('📚 Loading all recipes...');
        
        const suggestionsGrid = document.querySelector('.suggestions-grid');
        if (suggestionsGrid) {
            suggestionsGrid.innerHTML = '<div class="loading-all-recipes" style="grid-column: 1 / -1; text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 50px; color: #ff6b35; margin-bottom: 20px;"></i><h3>Loading all recipes...</h3></div>';
        }
        
        try {
            let recipes = [];
            
            // Try enhanced API first
            if (window.enhancedRecipeAPI) {
                recipes = await window.enhancedRecipeAPI.searchRecipes('', {
                    includeIngredients: true,
                    limit: 100
                });
            }
            
            // Fallback to regular API call
            if (!recipes || recipes.length === 0) {
                const response = await fetch(MEAL_SUGGESTION_ENDPOINTS.recipes, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('authToken') ? 
                                       `Token ${localStorage.getItem('authToken')}` : ''
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    recipes = data.results || data;
                }
            }
            
            if (recipes && recipes.length > 0) {
                console.log(`✅ Loaded ${recipes.length} recipes`);
                mealData = recipes;
                displayMeals(recipes);
            } else {
                displayNoRecipesAvailable();
            }
            
        } catch (error) {
            console.error('❌ Error loading all recipes:', error);
            displayLoadError(error.message);
        }
    }

    function displayNoRecipesAvailable() {
        const suggestionsGrid = document.querySelector('.suggestions-grid');
        if (!suggestionsGrid) return;
        
        suggestionsGrid.innerHTML = `
            <div class="no-recipes" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-utensils" style="font-size: 50px; color: #ccc; margin-bottom: 20px;"></i>
                <h3>No recipes available</h3>
                <p>It seems there are no recipes in the database yet.</p>
                <a href="Recipes.html" style="margin-top: 15px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Go to Recipes Page
                </a>
            </div>
        `;
    }

    function displayLoadError(errorMessage) {
        const suggestionsGrid = document.querySelector('.suggestions-grid');
        if (!suggestionsGrid) return;
        
        suggestionsGrid.innerHTML = `
            <div class="load-error" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-circle" style="font-size: 50px; color: #dc3545; margin-bottom: 20px;"></i>
                <h3>Unable to load recipes</h3>
                <p>Error: ${errorMessage}</p>
                <button onclick="loadAllRecipes()" style="margin-top: 15px; padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Try Again
                </button>
            </div>
        `;
    }

    // Enhanced ingredient input functionality
    function setupIngredientInput() {
        const ingredientInput = document.getElementById('ingredientInput');
        const addIngredientBtn = document.getElementById('addIngredientBtn');
        const suggestButton = document.getElementById('suggestButton');
        
        if (ingredientInput) {
            // Add ingredient on Enter key
            ingredientInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addIngredientFromInput();
                }
            });
            
            // Auto-suggest as user types
            let suggestTimeout;
            ingredientInput.addEventListener('input', function() {
                clearTimeout(suggestTimeout);
                const value = this.value.trim();
                if (value.length > 2) {
                    suggestTimeout = setTimeout(() => {
                        showIngredientSuggestions(value);
                    }, 300);
                }
            });
        }
        
        if (addIngredientBtn) {
            addIngredientBtn.addEventListener('click', addIngredientFromInput);
        }
        
        if (suggestButton) {
            suggestButton.addEventListener('click', handleIngredientSuggestion);
        }
    }

    function addIngredientFromInput() {
        const ingredientInput = document.getElementById('ingredientInput');
        if (!ingredientInput) return;
        
        const ingredient = ingredientInput.value.trim();
        if (!ingredient) return;
        
        // Add ingredient tag
        addIngredientTag(ingredient);
        
        // Clear input
        ingredientInput.value = '';
    }

    function addIngredientTag(ingredient) {
        const tagsContainer = document.getElementById('ingredientTags') || 
                             document.querySelector('.ingredient-tags') ||
                             createIngredientTagsContainer();
        
        if (!tagsContainer) return;
        
        // Check if ingredient already exists
        const existingTags = tagsContainer.querySelectorAll('.ingredient-tag');
        for (const tag of existingTags) {
            if (tag.dataset.name === ingredient || tag.textContent.includes(ingredient)) {
                console.log('Ingredient already added:', ingredient);
                return;
            }
        }
        
        // Create new tag
        const tag = document.createElement('span');
        tag.className = 'ingredient-tag';
        tag.dataset.name = ingredient;
        tag.innerHTML = `
            ${ingredient}
            <button type="button" class="remove-tag" onclick="removeIngredientTag(this)">×</button>
        `;
        
        tagsContainer.appendChild(tag);
        console.log('Added ingredient tag:', ingredient);
    }

    function removeIngredientTag(button) {
        const tag = button.parentElement;
        tag.remove();
    }

    function createIngredientTagsContainer() {
        const container = document.createElement('div');
        container.id = 'ingredientTags';
        container.className = 'ingredient-tags';
        container.style.cssText = `
            margin: 10px 0;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            min-height: 50px;
            background: #f9f9f9;
        `;
        
        // Insert after ingredient input
        const ingredientInput = document.getElementById('ingredientInput');
        if (ingredientInput && ingredientInput.parentNode) {
            ingredientInput.parentNode.insertBefore(container, ingredientInput.nextSibling);
        }
        
        return container;
    }

    function showIngredientSuggestions(partialIngredient) {
        // This could be enhanced with a database of common ingredients
        const commonIngredients = [
            'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna',
            'rice', 'pasta', 'noodles', 'bread', 'flour',
            'tomato', 'onion', 'garlic', 'potato', 'carrot', 'lettuce',
            'cheese', 'milk', 'butter', 'egg', 'oil', 'salt', 'pepper',
            'basil', 'oregano', 'thyme', 'parsley', 'cilantro'
        ];
        
        const suggestions = commonIngredients.filter(ingredient => 
            ingredient.toLowerCase().includes(partialIngredient.toLowerCase())
        );
        
        if (suggestions.length > 0) {
            console.log('Ingredient suggestions:', suggestions);
            // You could display these in a dropdown if needed
        }
    }

    // Simple toast notification system
function showToast(message, type = 'info') {
    console.log(`Toast: ${message} (${type})`);
    
    // Remove existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    
    const colors = {
        success: '#28a745',
        error: '#dc3545', 
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 350px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Make globally available
window.showToast = showToast;

// --- Budget-Based Meal Suggestions ---
async function handleBudgetSuggestion() {
    console.log('💰 Starting budget-based suggestion process...');
    
    const budgetInput = document.getElementById('budgetInput');
    const currencySelect = document.getElementById('currencySelect');
    
    if (!budgetInput || !currencySelect) {
        console.error('Budget input elements not found');
        return;
    }
    
    const budget = parseFloat(budgetInput.value);
    const currency = currencySelect.value;
    
    if (!budget || budget <= 0) {
        alert('Please enter a valid budget amount greater than 0.');
        return;
    }
    
    console.log(`💰 Budget: ${budget} ${currency}`);
    
    // Show loading state
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (suggestionsGrid) {
        suggestionsGrid.innerHTML = `
            <div class="loading-budget" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div class="spinner" style="margin-bottom: 20px;">💰</div>
                <h3>Finding budget-friendly meals...</h3>
                <p>Budget: ${budget} ${currency}</p>
            </div>
        `;
    }
    
    try {
        let budgetSuggestions;
        
        // Use enhanced API if available
        if (window.enhancedRecipeAPI) {
            console.log('🚀 Using enhanced recipe API for budget suggestions');
            budgetSuggestions = await window.enhancedRecipeAPI.suggestRecipesByBudget(budget, currency);
            
            if (budgetSuggestions && budgetSuggestions.suggestions && budgetSuggestions.suggestions.length > 0) {
                console.log('✅ Budget suggestions received:', budgetSuggestions);
                displayBudgetSuggestions(budgetSuggestions, budget, currency);
            } else {
                console.log('⚠️ No budget suggestions found');
                displayNoBudgetMatches(budget, currency);
            }
        } else {
            // Fallback to regular API
            console.log('📡 Using fallback budget API');
            displayNoBudgetMatches(budget, currency);
        }
        
    } catch (error) {
        console.error('❌ Error getting budget suggestions:', error);
        displayBudgetError(error.message, budget, currency);
    }
}

function displayBudgetSuggestions(budgetData, userBudget, currency) {
    console.log('💰 Displaying budget-based suggestions:', budgetData);
    
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (!suggestionsGrid) return;
    
    // Clear loading state
    suggestionsGrid.innerHTML = '';
    
    // Add header for budget-based results
    suggestionsGrid.innerHTML = `
        <div class="budget-header" style="grid-column: 1 / -1; margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #e8f5e8 0%, #f0fdf4 100%); border-radius: 12px; border: 2px solid #4CAF50;">
            <h3 style="margin: 0 0 10px 0; color: #2E7D32; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-coins"></i> Budget-Friendly Recipe Suggestions
            </h3>
            <p style="margin: 0; color: #388E3C; font-weight: 600;">
                <strong>Your budget:</strong> ${userBudget} ${currency} | 
                <strong>Found:</strong> ${budgetData.total_found || budgetData.suggestions.length} recipes
            </p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                ${budgetData.message}
            </p>
        </div>
    `;
    
    // Process and display suggestions
    budgetData.suggestions.forEach((recipe, index) => {
        const title = recipe.title || recipe.name || 'Untitled Recipe';
        const description = recipe.description || 'No description available';
        const image = recipe.image_url || recipe.image || 'assets/default-recipe.jpg';
        const cuisine = recipe.cuisine || 'International';
        const cookingTime = recipe.cook_time || recipe.cooking_time || recipe.time || 'Unknown';
        const difficulty = recipe.difficulty || 'Medium';
        const cost = recipe.estimated_cost || 0;
        const recipeCurrency = recipe.currency || currency;
        const savings = recipe.cost_savings || 0;
        const costPercentage = recipe.cost_percentage || 0;
        
        // Format cost display
        const costDisplay = `${cost} ${recipeCurrency}`;
        const savingsDisplay = savings > 0 ? `Save ${savings} ${currency}` : '';
        const percentageDisplay = costPercentage > 0 ? `${costPercentage}% of budget` : '';
        
        suggestionsGrid.innerHTML += `
            <div class="meal-card budget-card" style="position: relative; cursor: pointer; border: 2px solid #4CAF50; background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 255, 248, 0.9) 100%);" onclick="viewMeal('${recipe.id}')">
                <div class="budget-badge" style="position: absolute; top: 10px; right: 10px; background: #4CAF50; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; z-index: 2;">
                    💰 ${costDisplay}
                </div>
                <div class="meal-image" style="background-image: url('${image}'); height: 200px; background-size: cover; background-position: center; border-radius: 8px 8px 0 0;">
                    <span class="meal-badge" style="background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; position: absolute; bottom: 10px; left: 10px;">
                        ${cuisine}
                    </span>
                </div>
                <div class="meal-content" style="padding: 15px;">
                    <h3 class="meal-title" style="margin: 0 0 8px 0; font-size: 18px; line-height: 1.3; color: #2E7D32;">${title}</h3>
                    <p class="meal-description" style="margin: 0 0 10px 0; color: #666; font-size: 14px; line-height: 1.4;">${description}</p>
                    
                    <div class="meal-meta" style="display: flex; gap: 15px; margin-bottom: 15px; font-size: 13px; color: #888;">
                        <span><i class="fas fa-clock"></i> ${cookingTime} mins</span>
                        <span><i class="fas fa-chart-bar"></i> ${difficulty}</span>
                    </div>
                    
                    <div class="budget-info" style="background: rgba(76, 175, 80, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 15px; border: 1px solid rgba(76, 175, 80, 0.3);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <span style="font-weight: 600; color: #2E7D32;">Cost: ${costDisplay}</span>
                            ${savingsDisplay ? `<span style="color: #4CAF50; font-size: 12px;">💾 ${savingsDisplay}</span>` : ''}
                        </div>
                        ${percentageDisplay ? `<div style="font-size: 12px; color: #666;">${percentageDisplay}</div>` : ''}
                    </div>
                    
                    <div class="meal-actions" style="display: flex; gap: 10px;" onclick="event.stopPropagation();">
                        <button class="btn-view" data-id="${recipe.id}" style="flex: 1; padding: 8px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-eye"></i> View Recipe
                        </button>
                        <button class="btn-save" data-id="${recipe.id}" style="padding: 8px 12px; background: #2E7D32; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-bookmark"></i> Save
                        </button>
                    </div>
                </div>
            </div>
        `;
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
    
    console.log('✅ Budget suggestions displayed successfully');
}

function displayNoBudgetMatches(budget, currency) {
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (!suggestionsGrid) return;
    
    suggestionsGrid.innerHTML = `
        <div class="no-budget-matches" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <i class="fas fa-piggy-bank" style="font-size: 50px; color: #6c757d; margin-bottom: 20px;"></i>
            <h3>No recipes found within your budget</h3>
            <p><strong>Your budget:</strong> ${budget} ${currency}</p>
            <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 8px; border: 1px solid #ffeaa7;">
                <strong>💡 Tips to find budget-friendly meals:</strong>
                <ul style="text-align: left; display: inline-block; margin-top: 10px;">
                    <li>Try increasing your budget amount</li>
                    <li>Look for recipes with basic ingredients</li>
                    <li>Consider vegetarian options (often more affordable)</li>
                    <li>Check for seasonal ingredient recipes</li>
                </ul>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button onclick="increaseBudgetSuggestion()" style="padding: 10px 20px; background: #ffc107; color: #000; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                    💰 Try Higher Budget
                </button>
                <button onclick="loadAllRecipes()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    📋 Browse All Recipes
                </button>
            </div>
        </div>
    `;
}

function displayBudgetError(errorMessage, budget, currency) {
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    if (!suggestionsGrid) return;
    
    suggestionsGrid.innerHTML = `
        <div class="budget-error" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 50px; color: #f44336; margin-bottom: 20px;"></i>
            <h3>Error finding budget suggestions</h3>
            <p><strong>Your budget:</strong> ${budget} ${currency}</p>
            <div style="margin: 20px 0; padding: 15px; background: #ffebee; border-radius: 8px;">
                <strong>Error:</strong> ${errorMessage}
            </div>
            <button onclick="loadAllRecipes()" style="margin-top: 15px; padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Browse All Recipes Instead
            </button>
        </div>
    `;
}

function increaseBudgetSuggestion() {
    const budgetInput = document.getElementById('budgetInput');
    const currencySelect = document.getElementById('currencySelect');
    
    if (budgetInput && currencySelect) {
        const currentBudget = parseFloat(budgetInput.value) || 0;
        const currency = currencySelect.value;
        
        // Suggest a higher budget based on currency
        const newBudget = currency === 'USD' ? 
            Math.ceil((currentBudget + 5) / 5) * 5 : // Round to nearest $5
            Math.ceil((currentBudget + 1000) / 1000) * 1000; // Round to nearest 1000 XAF
        
        budgetInput.value = newBudget;
        
        // Show suggestion message
        alert(`💡 Try increasing your budget to ${newBudget} ${currency} for more options!`);
    }
}

// Make budget functions globally available
window.handleBudgetSuggestion = handleBudgetSuggestion;
window.increaseBudgetSuggestion = increaseBudgetSuggestion;

}); // End of DOMContentLoaded