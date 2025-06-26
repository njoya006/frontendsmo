document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let recipeData = [];
    let allRecipes = []; // Keep original data for reset
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
    const response = await fetch('https://njoya.pythonanywhere.com/api/recipes/', {
        method: 'GET',
        headers: token ? { 'Authorization': `Token ${token}` } : {},
    });
            const data = await response.json();
            if (!response.ok) {
                showToast('Failed to load recipes.', '#f44336');
                return [];
            }
            // Only use recipes that have a contributor (created by users)
            return data.filter(recipe => recipe.contributor);
        } catch (error) {
            showToast('Network error. Please try again later.', '#f44336');
            return [];
        }
    }    // Display recipes (updated to show contributor info and profile photo)
    function displayRecipes(recipes) {
        if (!recipesGrid) {
            console.error('Recipes grid element not found');
            return;
        }
        
        recipesGrid.innerHTML = '';
        
        if (!recipes || recipes.length === 0) {
            recipesGrid.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-utensils" style="font-size: 50px; color: #ccc; margin-bottom: 20px;"></i>
                    <h3 style="color: var(--gray-color); margin-bottom: 10px;">No recipes found</h3>
                    <p style="color: var(--gray-color);">Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }
        recipes.forEach(recipe => {
            let contributorHtml = '';
            if (recipe.contributor) {
                let photoUrl = recipe.profile_photo || (recipe.contributor.profile_photo || '');
                if (photoUrl && !photoUrl.startsWith('http')) {
                    photoUrl = `https://njoya.pythonanywhere.com${photoUrl.startsWith('/media/') ? photoUrl : '/media/' + photoUrl}`;
                }
                contributorHtml = `
                    <div class="contributor-info" style="display:flex;align-items:center;margin-bottom:8px;">
                        ${photoUrl ? `<img src="${photoUrl}" alt="Profile" style="width:32px;height:32px;border-radius:50%;object-fit:cover;margin-right:8px;">` : ''}
                        <div>
                            <div style="font-weight:600;font-size:14px;">${recipe.contributor.username || ''}</div>
                            <div style="font-size:12px;color:#888;">${recipe.contributor.basic_ingredients || ''}</div>
                        </div>
                    </div>
                `;
            }            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            recipeCard.style.cursor = 'pointer';
            recipeCard.onclick = () => window.location.href = `recipe-detail.html?id=${recipe.id}`;
            recipeCard.innerHTML = `
                <div class="recipe-image" style="background-image: url(${recipe.image || ''})">
                    <span class="favorite-btn ${recipe.favorited ? 'favorited' : ''}" onclick="event.stopPropagation();">
                        <i class="${recipe.favorited ? 'fas' : 'far'} fa-heart"></i>
                    </span>
                    ${recipe.tags && recipe.tags.includes('vegetarian') ? '<span class="recipe-badge">Vegetarian</span>' : ''}
                </div>
                <div class="recipe-content">
                    ${contributorHtml}
                    <h3><a href="recipe-detail.html?id=${recipe.id}" style="color:inherit;text-decoration:none;">${recipe.title || recipe.name || ''}</a></h3>
                    <div class="recipe-meta">
                        <span><i class="fas fa-clock"></i> ${recipe.time || ''} mins</span>
                        <span><i class="fas fa-fire"></i> ${recipe.calories || ''} kcal</span>
                        <span><i class="fas fa-utensils"></i> ${recipe.servings || ''} servings</span>
                    </div>
                    <p class="recipe-description">${recipe.description || ''}</p>                    <div class="recipe-actions" onclick="event.stopPropagation();">
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

    // Modal logic for recipe creation
    const openCreateRecipeModalBtn = document.getElementById('openCreateRecipeModal');
    const createRecipeModal = document.getElementById('createRecipeModal');
    const closeCreateRecipeModalBtn = document.getElementById('closeCreateRecipeModal');
    const createRecipeForm = document.getElementById('createRecipeForm');

    // Helper: Check if user is a verified contributor (assume backend exposes this in profile)
    async function isVerifiedContributor() {
        const token = localStorage.getItem('authToken');
        if (!token) return false;
        try {
            const response = await fetch('https://njoya.pythonanywhere.com/api/users/profile/', {
                method: 'GET',
                headers: { 'Authorization': `Token ${token}` }
            });
            const data = await response.json();
            // Assume backend returns is_verified_contributor: true/false
            return !!data.is_verified_contributor;
        } catch {
            return false;
        }
    }

    // Professional modal for not verified contributors
    function showNotVerifiedModal() {
        let modal = document.getElementById('notVerifiedModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'notVerifiedModal';
            modal.style = 'display:flex;position:fixed;z-index:2000;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;';
            modal.innerHTML = `
                <div style="background:#fff;padding:40px 30px;border-radius:16px;max-width:420px;width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.18);position:relative;">
                    <span id="closeNotVerifiedModal" style="position:absolute;top:16px;right:24px;font-size:28px;cursor:pointer;">&times;</span>
                    <img src='images/Bright.jpg' alt='Verification' style='width:80px;height:80px;border-radius:50%;margin-bottom:18px;border:3px solid #4CAF50;'>
                    <h2 style='color:#4CAF50;margin-bottom:10px;'>Contributor Verification Required</h2>
                    <p style='color:#555;font-size:16px;margin-bottom:18px;'>Only verified contributors can add new recipes.<br>To become verified, please contact our team or complete your profile and request verification.</p>
                    <a href='Profile.html' class='btn btn-primary' style='margin:10px 0 0 0;display:inline-block;'>Go to Profile</a>
                </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('closeNotVerifiedModal').onclick = () => { modal.style.display = 'none'; };
            window.addEventListener('click', function(e) {
                if (e.target === modal) modal.style.display = 'none';
            });
        } else {
            modal.style.display = 'flex';
        }
    }

    if (openCreateRecipeModalBtn && createRecipeModal && closeCreateRecipeModalBtn) {
        openCreateRecipeModalBtn.addEventListener('click', async function() {
            if (await isVerifiedContributor()) {
                createRecipeModal.style.display = 'flex';
            } else {
                showNotVerifiedModal();
            }
        });
        closeCreateRecipeModalBtn.addEventListener('click', function() {
            createRecipeModal.style.display = 'none';
        });
        window.addEventListener('click', function(e) {
            if (e.target === createRecipeModal) createRecipeModal.style.display = 'none';
        });
    }

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
            
            // Add image if present
            if (imageInput && imageInput.files[0]) {
                formData.append('image', imageInput.files[0]);
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
                });let data;
                try {
                    data = await response.json();
                } catch (jsonError) {
                    console.error('❌ Failed to parse response as JSON:', jsonError);
                    const textResponse = await response.text();
                    console.error('❌ Raw response:', textResponse.substring(0, 500));
                    showToast('Server returned invalid response format', '#f44336');
                    return;
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
                // Remove all ingredient rows and add one default row
                document.getElementById('ingredientsList').innerHTML = '';
                addIngredientRow();
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
    });
});