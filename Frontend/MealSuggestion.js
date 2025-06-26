// --- Ingredient Validation and Autocomplete ---
var validIngredientNames = [];

// --- Filter DOM elements (fix ReferenceError) ---
const mealTypeFilter = document.getElementById('meal-type');
const cuisineFilter = document.getElementById('cuisine');
const cookingTimeFilter = document.getElementById('cooking-time');

// Add these new functions to your existing JavaScript
function initSearch() {
    const searchInput = document.getElementById('mealSearch');
    const searchButton = document.getElementById('searchButton');
    const searchTags = document.querySelectorAll('.remove-tag');
    
    // Search when button is clicked
    searchButton.addEventListener('click', performSearch);
    
    // Search when Enter is pressed
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Remove tag functionality
    searchTags.forEach(tag => {
        tag.addEventListener('click', function() {
            this.parentElement.remove();
            performSearch(); // Update results when tags are removed
        });
    });
}

function performSearch() {
    const searchTerm = document.getElementById('mealSearch').value.toLowerCase();
    const currentMeals = getFilteredMeals(); // Get currently filtered meals
    
    if (!searchTerm) {
        // If search is empty, just show filtered results
        displayMeals(currentMeals);
        return;
    }
    
    const results = currentMeals.filter(meal => {
        // Search in multiple fields
        return (
            meal.title.toLowerCase().includes(searchTerm) ||
            meal.description.toLowerCase().includes(searchTerm) ||
            meal.cuisine.toLowerCase().includes(searchTerm) ||
            meal.type.toLowerCase().includes(searchTerm)
        );
    });
    
    // Highlight matching text and mark search results
    const highlightedResults = results.map(meal => {
        // Create a highlighted version for display
        const highlightedTitle = highlightText(meal.title, searchTerm);
        const highlightedDesc = highlightText(meal.description, searchTerm);
        
        return {
            ...meal,
            displayTitle: highlightedTitle,
            displayDescription: highlightedDesc,
            isSearchResult: true
        };
    });
    
    displayMeals(highlightedResults);
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
        const response = await fetch('http://127.0.0.1:8000/api/recipes/suggest-by-ingredients/', {
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

// --- Use user-selected ingredients for meal suggestions ---
async function handleIngredientSuggestion() {
    // Collect ingredient names from the UI (e.g., tags or input fields)
    const ingredientTags = document.querySelectorAll('.ingredient-tag');
    let ingredientNames = Array.from(ingredientTags).map(tag => tag.dataset.name);
    if (ingredientNames.length === 0) {
        const input = document.getElementById('ingredientInput');
        if (input && input.value) {
            ingredientNames = input.value.split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    // Only check for minimum count, not strict validity (let backend handle fuzzy matching)
    if (ingredientNames.length < 4) {
        alert('Please provide at least 4 ingredients for better suggestions.');
        return;
    }
    const suggestions = await fetchMealSuggestionsByIngredients(ingredientNames);
    mealData = suggestions;
    displayMeals(mealData);
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
    
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        authButtons.classList.toggle('active');
        this.querySelector('i').classList.toggle('fa-times');
    });

    // Logout Functionality
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // --- Fetch meals from backend instead of using sample data ---
    let mealData = [];

    async function fetchMealsFromBackend() {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/recipes/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (!response.ok) {
                alert('Failed to load meals from backend.');
                return [];
            }
            // Optionally filter for only valid recipes (e.g., with title, description)
            return data.filter(recipe => recipe.title && recipe.description);
        } catch (error) {
            alert('Network error. Please try again later.');
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
            const calories = meal.calories || '';
            const mealCard = document.createElement('div');
            mealCard.className = 'meal-card';
            mealCard.innerHTML = `
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
                    <div class="meal-actions">
                        <button class="btn-save" data-id="${meal.id}">
                            <i class="fas fa-plus"></i> Save
                        </button>
                        <button class="btn-view" data-id="${meal.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </div>
            `;
            suggestionsGrid.appendChild(mealCard);
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
    if (suggestMealsBtn) {
        suggestMealsBtn.addEventListener('click', handleIngredientSuggestion);
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
            const response = await fetch('http://127.0.0.1:8000/api/ingredients/', {
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
});