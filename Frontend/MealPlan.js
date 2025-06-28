const API_BASE_URL = 'https://njoya.pythonanywhere.com';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize verification badge
    if (typeof initializeVerificationBadge === 'function') {
        initializeVerificationBadge();
    }

    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const weekRangeDisplay = document.getElementById('weekRange');
    const currentWeekHeaderDisplay = document.getElementById('current-week');
    const totalMealsPlannedEl = document.getElementById('totalMealsPlanned');
    const avgCaloriesDayEl = document.getElementById('avgCaloriesDay');
    const avgProteinDayEl = document.getElementById('avgProteinDay');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const toastMessage = document.getElementById('toastMessage');

    // Meal Selector Modal Elements
    const mealSelectorModal = document.getElementById('mealSelectorModal');
    const closeMealSelectorModalBtn = document.getElementById('closeMealSelectorModal');
    const modalRecipeList = document.getElementById('modalRecipeList');
    const modalRecipeSearch = document.getElementById('modalRecipeSearch');

    // New enhanced elements
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const generateGroceryListBtn = document.getElementById('generateGroceryList');
    const copyToNextWeekBtn = document.getElementById('copyToNextWeek');
    const sharePlanBtn = document.getElementById('sharePlan');
    const clearWeekBtn = document.getElementById('clearWeek');

    // Check if critical DOM elements are found
    if (!prevWeekBtn) console.error("MealPlan.js: prevWeekBtn element NOT FOUND!");
    if (!nextWeekBtn) console.error("MealPlan.js: nextWeekBtn element NOT FOUND!");
    if (!weekRangeDisplay) console.error("MealPlan.js: weekRangeDisplay element NOT FOUND!");
    if (!loadingSpinner) console.error("MealPlan.js: loadingSpinner element NOT FOUND in DOMContentLoaded!");
    if (!toastMessage) console.error("MealPlan.js: toastMessage element NOT FOUND in DOMContentLoaded!");
    if (!mealSelectorModal) console.error("MealPlan.js: mealSelectorModal element NOT FOUND!");
    if (!closeMealSelectorModalBtn) console.error("MealPlan.js: closeMealSelectorModalBtn element NOT FOUND!");
    if (!modalRecipeList) console.error("MealPlan.js: modalRecipeList element NOT FOUND!");
    if (!modalRecipeSearch) console.error("MealPlan.js: modalRecipeSearch element NOT FOUND!");

    let currentDate = new Date();
    let currentDragElement = null;
    let currentFilter = 'all';
    let currentMealPlans = [];

    function showSpinner() {
        if (loadingSpinner) {
            loadingSpinner.style.display = 'flex';
        } else {
            console.error("MealPlan.js: loadingSpinner element is null in showSpinner().");
        }
    }
    function hideSpinner() {
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        } else {
            console.error("MealPlan.js: loadingSpinner element is null in hideSpinner().");
        }
    }
    function showToast(message, isError = false) {
        if (!toastMessage) {
            console.error("MealPlan.js: toastMessage element is null in showToast().");
            return;
        }
        toastMessage.textContent = message;
        toastMessage.style.backgroundColor = isError ? 'var(--danger-color, #dc3545)' : 'var(--primary-color, #4CAF50)';
        toastMessage.style.display = 'block';
        setTimeout(() => {
            if (toastMessage) toastMessage.style.display = 'none';
        }, 3000);
    }

    function formatDateForAPI(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getWeekInfo(date) {
        const d = new Date(date);
        const dayOfWeek = d.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const startDate = new Date(d);
        startDate.setDate(d.getDate() + diffToMonday);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        return { start: startDate, end: endDate, startFormatted: formatDateForAPI(startDate), endFormatted: formatDateForAPI(endDate) };
    }
    
    function getDayStringFromDate(date) {
        const dayMap = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        let jsDay = date.getDay();
        return dayMap[jsDay === 0 ? 6 : jsDay - 1];
    }

    async function fetchMealPlansForWeekRange(startDateStr, endDateStr) {
        const token = localStorage.getItem('authToken');

        if (!token) {
            showToast("Authentication token not found. Please log in.", true);
            return [];
        }
        showSpinner();
        let plansToReturn = []; 

        try {
            const fetchUrl = `${API_BASE_URL}/api/planner/meal-plan/`;

            const response = await fetch(fetchUrl, {
                headers: { 'Authorization': `Token ${token}` }
            });

            if (!response.ok) {
                let errorData = { detail: `API request failed with status ${response.status}` };
                try {
                    errorData = await response.json();
                    console.error("MealPlan.js: API error response JSON:", errorData); // Log 14
                } catch (e) {
                    console.error("MealPlan.js: Could not parse error response as JSON. Status text:", response.statusText, "Error:", e); // Log 15
                    errorData.detail += `. ${response.statusText}`;
                }
                showToast(errorData.detail || `Error: ${response.status}`, true);
            } else {
                const allMealPlansData = await response.json();
                if (!Array.isArray(allMealPlansData)) {
                    console.error("MealPlan.js: API response for meal plans is not an array.", allMealPlansData); // Log for unexpected format
                    showToast("Received unexpected data format for meal plans.", true);
                } else {
                    const allMealPlans = allMealPlansData;
                    const startDate = new Date(startDateStr + 'T00:00:00');
                    const endDate = new Date(endDateStr + 'T23:59:59');
                    plansToReturn = allMealPlans.filter(plan => {
                        if (!plan || typeof plan.date !== 'string') {
                            // console.warn("MealPlan.js: Invalid plan object encountered during filtering (missing or invalid date):", plan);
                            return false;
                        }
                        const planDate = new Date(plan.date + 'T00:00:00');
                        return planDate >= startDate && planDate <= endDate;
                    });
                    console.log("MealPlan.js: Filtered plans for the week. Count:", plansToReturn.length); // Log 17
                }
            }
        } catch (error) {
            console.error("MealPlan.js: CATCH block in fetchMealPlansForWeekRange. Error:", error); // Log 18
            showToast("Network error or issue fetching meal plans.", true);
        } finally {
            hideSpinner();
        }
        return plansToReturn;
    }

    // --- Meal Selector Modal Logic ---
    let currentModalDate = null;  // To store date context for the modal
    let currentModalMealType = null; // To store meal type context for the modal
    let allFetchedRecipesForModal = []; // To store recipes fetched for the modal

    async function fetchRecipesForModal() {
        console.log("MealPlan.js: fetchRecipesForModal CALLED."); // MODAL_LOG_1
        const token = localStorage.getItem('authToken');
        try {
            const fetchUrl = `${API_BASE_URL}/api/recipes/`;
            console.log("MealPlan.js: Fetching recipes from URL:", fetchUrl);
            console.log("MealPlan.js: Using auth token:", token ? "Present" : "Missing");
            
            const response = await fetch(fetchUrl, { // Assuming general recipe endpoint
                method: 'GET',
                headers: token ? { 'Authorization': `Token ${token}` } : {},
            });
            
            console.log("MealPlan.js: Response status:", response.status);
            console.log("MealPlan.js: Response ok:", response.ok);
            
            const data = await response.json();
            console.log("MealPlan.js: fetchRecipesForModal - API response status:", response.status); // MODAL_LOG_2
            console.log("MealPlan.js: fetchRecipesForModal - Raw data received:", data);
            if (!response.ok) {
                showToast('Failed to load recipes for selection.', true);
                return [];
            }
            // Show all recipes, not just those with contributors
            allFetchedRecipesForModal = Array.isArray(data) ? data : [];
            console.log("MealPlan.js: fetchRecipesForModal - Filtered recipes:", allFetchedRecipesForModal);
            return allFetchedRecipesForModal;
        } catch (error) {
            console.error("MealPlan.js: CATCH in fetchRecipesForModal:", error); // MODAL_LOG_3
            showToast('Network error fetching recipes for modal.', true);
            allFetchedRecipesForModal = []; // Ensure it's empty on error
            return [];
        }
    }    function populateRecipeSelector(recipesToDisplay) {
        if (!modalRecipeList) return;
        modalRecipeList.innerHTML = ''; // Clear previous list
        console.log("MealPlan.js: populateRecipeSelector - Displaying recipes count:", recipesToDisplay.length);
        
        if (recipesToDisplay.length === 0) {
            modalRecipeList.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No recipes found matching your criteria.</p>';
            return;
        }

        recipesToDisplay.forEach((recipe, index) => {
            const item = document.createElement('div');
            item.className = 'modal-recipe-item';
            item.dataset.recipeId = recipe.id;
            
            // Enhanced recipe item with more details
            const rating = recipe.rating || (Math.random() * 2 + 3).toFixed(1); // Mock rating if not available
            const prepTime = recipe.prep_time || Math.floor(Math.random() * 30 + 15); // Mock prep time
            const difficulty = recipe.difficulty || ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)];
            const tags = recipe.tags || [];
            
            item.innerHTML = `
                <div class="recipe-item-header">
                    <h4>${recipe.title || recipe.name}</h4>
                    <div class="recipe-rating">
                        <i class="fas fa-star"></i>
                        <span>${rating}</span>
                    </div>
                </div>
                <p>${(recipe.description || 'Delicious recipe to try').substring(0, 120)}...</p>
                <div class="recipe-meta">
                    <span><i class="fas fa-clock"></i> ${prepTime} min</span>
                    <span><i class="fas fa-chart-bar"></i> ${difficulty}</span>
                    <span><i class="fas fa-utensils"></i> ${recipe.servings || 4} servings</span>
                </div>
                ${tags.length > 0 ? `
                    <div class="recipe-tags">
                        ${tags.slice(0, 3).map(tag => `<span class="recipe-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            `;
            
            // Add click handler with enhanced animation
            item.addEventListener('click', async () => {
                // Visual feedback
                item.classList.add('selected');
                document.querySelectorAll('.modal-recipe-item').forEach(otherItem => {
                    if (otherItem !== item) otherItem.style.opacity = '0.5';
                });
                
                if (currentModalDate && currentModalMealType && recipe.id) {
                    const authToken = localStorage.getItem('authToken');
                    await createMealPlanEntry({
                        recipe_title: recipe.title || recipe.name,
                        date: currentModalDate,
                        meal_type: currentModalMealType
                    }, authToken);
                    
                    if (mealSelectorModal) mealSelectorModal.style.display = 'none';
                    
                    // Reset modal state
                    document.querySelectorAll('.modal-recipe-item').forEach(resetItem => {
                        resetItem.classList.remove('selected');
                        resetItem.style.opacity = '1';
                    });
                }
            });
            
            // Add hover effects
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateX(5px) translateY(-2px)';
            });
            
            item.addEventListener('mouseleave', () => {
                if (!item.classList.contains('selected')) {
                    item.style.transform = 'translateX(0) translateY(0)';
                }
            });
            
            modalRecipeList.appendChild(item);
            
            // Stagger animation for smooth appearance
            setTimeout(() => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                item.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 50);
            }, 10);
        });
    }    function renderMealPlans(mealPlans) {
        // Store current meal plans for other functions
        currentMealPlans = mealPlans;
        
        // Clear existing meal cards and reset add buttons
        document.querySelectorAll('.day-cell .meal-card').forEach(card => card.remove());
        document.querySelectorAll('.day-cell .btn-add-meal').forEach(btn => btn.style.display = 'flex');
        
        // Reset day cell states
        document.querySelectorAll('.day-cell').forEach(cell => {
            cell.classList.remove('has-meals');
            cell.classList.add('empty-slot');
        });

        mealPlans.forEach(plan => {
            const planDate = new Date(plan.date + 'T00:00:00Z');
            const dayStr = getDayStringFromDate(planDate);
            const mealType = plan.meal_type.toLowerCase();

            const cell = document.querySelector(`.day-cell[data-day="${dayStr}"][data-meal="${mealType}"]`);
            if (cell) {
                const addBtn = cell.querySelector('.btn-add-meal');
                if (addBtn) addBtn.style.display = 'none';
                
                // Update cell state
                cell.classList.remove('empty-slot');
                cell.classList.add('has-meals');

                const mealCard = document.createElement('div');
                mealCard.className = 'meal-card';
                mealCard.dataset.mealPlanId = plan.id;
                mealCard.draggable = true;
                
                // Debug logging for image data
                console.log("MealPlan.js: Meal plan data:", plan);
                console.log("MealPlan.js: Recipe data:", plan.recipe);
                console.log("MealPlan.js: Recipe image:", plan.recipe ? plan.recipe.image : 'No recipe');
                console.log("MealPlan.js: Plan image:", plan.image);

                // Construct proper image URL
                let recipeImage = 'assets/default-recipe.jpg'; // Use default from assets folder
                if (plan.recipe && plan.recipe.image) {
                    console.log("MealPlan.js: Raw recipe image value:", plan.recipe.image);
                    if (plan.recipe.image.startsWith('http')) {
                        recipeImage = plan.recipe.image;
                    } else if (plan.recipe.image.startsWith('/')) {
                        recipeImage = `${API_BASE_URL}${plan.recipe.image}`;
                    } else {
                        recipeImage = `${API_BASE_URL}/${plan.recipe.image}`;
                    }
                    console.log("MealPlan.js: Constructed recipe image URL:", recipeImage);
                } else if (plan.image) {
                    console.log("MealPlan.js: Raw plan image value:", plan.image);
                    if (plan.image.startsWith('http')) {
                        recipeImage = plan.image;
                    } else if (plan.image.startsWith('/')) {
                        recipeImage = `${API_BASE_URL}${plan.image}`;
                    } else {
                        recipeImage = `${API_BASE_URL}/${plan.image}`;
                    }
                    console.log("MealPlan.js: Constructed plan image URL:", recipeImage);
                } else {
                    console.log("MealPlan.js: No image found in recipe or plan, using default");
                }
                
                console.log("MealPlan.js: Final image URL:", recipeImage);
                const recipeTitle = plan.recipe && plan.recipe.title ? plan.recipe.title : 'Unnamed Recipe';
                  // Enhanced meal card with better styling
                mealCard.innerHTML = `
                    <div class="meal-image" style="background-image: url('${recipeImage}'); cursor: pointer;" onclick="viewRecipeDetail(${plan.recipe ? plan.recipe.id : plan.id})">
                        <div class="meal-overlay">
                            <i class="fas fa-grip-vertical drag-handle"></i>
                        </div>
                    </div>
                    <div class="meal-content">
                        <h4 style="cursor: pointer;" onclick="viewRecipeDetail(${plan.recipe ? plan.recipe.id : plan.id})">${recipeTitle}</h4>
                        <div class="meal-actions">
                            <button class="btn-view-recipe" data-recipe-id="${plan.recipe ? plan.recipe.id : plan.id}" title="View recipe details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-edit-meal" data-meal-plan-id="${plan.id}" title="Edit meal">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete-meal" data-meal-plan-id="${plan.id}" title="Delete meal">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                
                // Add event listeners
                mealCard.addEventListener('dragstart', handleDragStart);
                mealCard.addEventListener('dragend', handleDragEnd);                
                const editBtn = mealCard.querySelector('.btn-edit-meal');
                const deleteBtn = mealCard.querySelector('.btn-delete-meal');
                const viewBtn = mealCard.querySelector('.btn-view-recipe');
                
                if (editBtn) editBtn.addEventListener('click', handleEditMeal);
                if (deleteBtn) deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteMealPlanEntry(e.currentTarget.dataset.mealPlanId);
                });
                if (viewBtn) viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    viewRecipeDetail(e.currentTarget.dataset.recipeId);
                });
                
                cell.appendChild(mealCard);
                
                // Add entrance animation
                setTimeout(() => {
                    mealCard.style.opacity = '0';
                    mealCard.style.transform = 'scale(0.8) translateY(20px)';
                    mealCard.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    
                    setTimeout(() => {
                        mealCard.style.opacity = '1';
                        mealCard.style.transform = 'scale(1) translateY(0)';
                    }, 100);
                }, 50);
            } else {
                console.warn(`MealPlan.js: Cell not found for ${dayStr}, ${mealType}. Plan ID: ${plan.id}`);
            }
        });
        
        // Enable drag and drop after rendering
        enableDragAndDrop();
        
        // Update summary and insights
        updateEnhancedSummary(mealPlans);
    }
      function updateSummary(mealPlans) {
        updateEnhancedSummary(mealPlans);
    }
    
    function updateEnhancedSummary(mealPlans) {
        if (totalMealsPlannedEl) totalMealsPlannedEl.textContent = mealPlans.length;
        
        let totalCalories = 0;
        let totalProtein = 0;
        let totalPrepTime = 0;
        const uniqueDays = new Set(mealPlans.map(p => p.date)).size || 1;
        const mealTypeCount = {};
        const recipeVariety = new Set();

        mealPlans.forEach(plan => {
            // Nutrition calculations
            if (plan.recipe && plan.recipe.nutrition_info) {
                totalCalories += parseFloat(plan.recipe.nutrition_info.calories || 0);
                totalProtein += parseFloat(plan.recipe.nutrition_info.protein || 0);
            } else if (plan.nutrition_info) {
                totalCalories += parseFloat(plan.nutrition_info.calories || 0);
                totalProtein += parseFloat(plan.nutrition_info.protein || 0);
            }
            
            // Prep time calculation
            if (plan.recipe && plan.recipe.prep_time) {
                totalPrepTime += parseInt(plan.recipe.prep_time);
            } else {
                totalPrepTime += 20; // Default prep time
            }
            
            // Meal type tracking
            const mealType = plan.meal_type.toLowerCase();
            mealTypeCount[mealType] = (mealTypeCount[mealType] || 0) + 1;
            
            // Recipe variety tracking
            if (plan.recipe && plan.recipe.title) {
                recipeVariety.add(plan.recipe.title);
            }
        });

        // Update basic stats
        const avgCalories = Math.round(totalCalories / uniqueDays) || 0;
        const avgProtein = Math.round(totalProtein / uniqueDays) || 0;
        const avgPrepTimePerDay = Math.round(totalPrepTime / uniqueDays) || 0;
        
        if (avgCaloriesDayEl) avgCaloriesDayEl.textContent = avgCalories;
        if (avgProteinDayEl) avgProteinDayEl.textContent = `${avgProtein}g`;
        
        // Update progress bars
        const caloriesProgress = document.getElementById('caloriesProgress');
        const proteinProgress = document.getElementById('proteinProgress');
        const completionProgress = document.getElementById('completionProgress');
        
        if (caloriesProgress) {
            const caloriesPercentage = Math.min((avgCalories / 2000) * 100, 100);
            caloriesProgress.style.width = `${caloriesPercentage}%`;
        }
        
        if (proteinProgress) {
            const proteinPercentage = Math.min((avgProtein / 100) * 100, 100);
            proteinProgress.style.width = `${proteinPercentage}%`;
        }
        
        // Plan completion (out of 28 possible slots: 7 days × 4 meals)
        const totalPossibleMeals = 28;
        const completionPercentage = (mealPlans.length / totalPossibleMeals) * 100;
        const planCompletionEl = document.getElementById('planCompletion');
        if (planCompletionEl) planCompletionEl.textContent = `${Math.round(completionPercentage)}%`;
        if (completionProgress) {
            completionProgress.style.width = `${completionPercentage}%`;
        }
        
        // Update insights
        const mostPlannedMealEl = document.getElementById('mostPlannedMeal');
        const varietyScoreEl = document.getElementById('varietyScore');
        const avgPrepTimeEl = document.getElementById('avgPrepTime');
        const healthProgressEl = document.getElementById('healthProgress');
        
        if (mostPlannedMealEl) {
            const mostPlannedMeal = Object.entries(mealTypeCount).reduce((a, b) => a[1] > b[1] ? a : b, ['None', 0]);
            mostPlannedMealEl.textContent = mostPlannedMeal[0].charAt(0).toUpperCase() + mostPlannedMeal[0].slice(1);
        }
        
        if (varietyScoreEl) {
            const varietyScore = mealPlans.length > 0 ? Math.min((recipeVariety.size / mealPlans.length) * 100, 100) : 0;
            varietyScoreEl.textContent = `${Math.round(varietyScore)}%`;
        }
        
        if (avgPrepTimeEl) {
            avgPrepTimeEl.textContent = `${avgPrepTimePerDay} min`;
        }
        
        // Health balance calculation (simplified)
        if (healthProgressEl) {
            const healthScore = Math.min(((avgProtein / 100) + (Math.min(avgCalories, 2000) / 2000)) / 2 * 100, 100);
            healthProgressEl.style.width = `${healthScore}%`;
        }
        
        // Update estimated grocery cost (mock calculation)
        const estGroceryCostEl = document.getElementById('estGroceryCost');
        if (estGroceryCostEl) {
            const estimatedCost = mealPlans.length * 3.50; // $3.50 per meal estimate
            estGroceryCostEl.textContent = `$${estimatedCost.toFixed(2)}`;
        }
    }

    // Add update meal plan entry function for drag and drop
    async function updateMealPlanEntry(mealPlanId, updateData) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showToast("Authentication token not found. Please log in.", true);
            return null;
        }

        showSpinner();
        try {
            const response = await fetch(`${API_BASE_URL}/api/planner/meal-plan/${mealPlanId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`Failed to update meal plan: ${response.status}`);
            }

            const updatedPlan = await response.json();
            showToast("Meal moved successfully!");
            loadAndDisplayWeek(currentDate);
            return updatedPlan;
        } catch (error) {
            console.error("Error updating meal plan:", error);
            showToast("Error moving meal.", true);
            return null;
        } finally {
            hideSpinner();
        }
    }    async function openMealSelectorModal(dateForAPI, mealType) {
        console.log(`MealPlan.js: openMealSelectorModal CALLED for Date: ${dateForAPI}, Meal Type: ${mealType}`);
        currentModalDate = dateForAPI;
        currentModalMealType = mealType;
        
        if (modalRecipeSearch) modalRecipeSearch.value = '';

        if (!mealSelectorModal) {
            console.error("MealPlan.js: openMealSelectorModal - mealSelectorModal element is NULL!");
            showToast("Error: Meal selector UI not available.", true);
            return;
        }

        showSpinner();
        try {
            if (allFetchedRecipesForModal.length === 0) { 
                await fetchRecipesForModal();
            }
            
            // Update modal title to show context
            const modalTitle = mealSelectorModal.querySelector('.modal-header h2');
            if (modalTitle) {
                const formattedDate = new Date(dateForAPI).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                });
                modalTitle.textContent = `Select ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} for ${formattedDate}`;
            }
            
            // Setup suggestion chips with smart suggestions
            setupSmartSuggestions(mealType);
            
            // Setup modal filters
            setupModalFilters();
            
            // Show all recipes initially
            populateRecipeSelector(allFetchedRecipesForModal);
            
            console.log("MealPlan.js: openMealSelectorModal - Attempting to display modal.");
            mealSelectorModal.style.display = 'flex';
            
            // Add modal open animation
            setTimeout(() => {
                mealSelectorModal.style.opacity = '1';
            }, 10);
            
            console.log("MealPlan.js: openMealSelectorModal - mealSelectorModal.style.display set to 'flex'. Actual:", mealSelectorModal.style.display);
        } catch (error) {
            console.error("MealPlan.js: Error within openMealSelectorModal:", error);
            showToast("Error opening recipe selector.", true);
        } finally {
            hideSpinner();
        }
    }

    function setupSmartSuggestions(mealType) {
        const suggestions = getSmartSuggestions(mealType, new Date().getDay());
        const suggestionChipsContainer = document.getElementById('suggestionChips');
        
        if (suggestionChipsContainer) {
            suggestionChipsContainer.innerHTML = '';
            
            Object.keys(suggestions).forEach(suggestionType => {
                const chip = document.createElement('div');
                chip.className = 'suggestion-chip';
                chip.dataset.filter = suggestionType;
                
                const icons = {
                    quick: 'fas fa-bolt',
                    healthy: 'fas fa-leaf',
                    popular: 'fas fa-heart',
                    seasonal: 'fas fa-calendar-alt'
                };
                
                chip.innerHTML = `
                    <i class="${icons[suggestionType] || 'fas fa-utensils'}"></i>
                    <span>${suggestionType.charAt(0).toUpperCase() + suggestionType.slice(1)} ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}s</span>
                `;
                
                chip.addEventListener('click', () => {
                    applySmartFilter(suggestionType);
                    document.querySelectorAll('.suggestion-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                });
                
                suggestionChipsContainer.appendChild(chip);
            });
        }
    }

    async function loadAndDisplayWeek(date) {
        const week = getWeekInfo(date);
        const displayFormat = { month: 'short', day: 'numeric' };
        const yearFormat = { year: 'numeric' };
        const rangeText = `${week.start.toLocaleDateString('en-US', displayFormat)} - ${week.end.toLocaleDateString('en-US', displayFormat)}, ${week.start.toLocaleDateString('en-US', yearFormat)}`;
        if (weekRangeDisplay) weekRangeDisplay.textContent = rangeText;
        if (currentWeekHeaderDisplay) currentWeekHeaderDisplay.textContent = rangeText;
        const mealPlans = await fetchMealPlansForWeekRange(week.startFormatted, week.endFormatted);
        
        renderMealPlans(mealPlans);
        updateSummary(mealPlans);
    }

    function handlePrevWeek() {
        currentDate.setDate(currentDate.getDate() - 7);
        loadAndDisplayWeek(currentDate);
    }
    function handleNextWeek() {
        currentDate.setDate(currentDate.getDate() + 7);
        loadAndDisplayWeek(currentDate);
    }

    function handleAddMealClick(event) {
        const cell = event.target.closest('.day-cell');
        if (!cell) { // Guard clause if the click target is not within a day-cell
            console.error("MealPlan.js: handleAddMealClick - could not find parent .day-cell");
            return;
        }
        const dayStr = cell.dataset.day; 
        const mealType = cell.dataset.meal; 

        const week = getWeekInfo(currentDate);
        const dayMap = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
        
        const mealDate = new Date(week.start);
        // Ensure dayStr is valid before using it in dayMap
        if (dayMap[dayStr] === undefined) {
            console.error(`MealPlan.js: Invalid dayStr '${dayStr}' in handleAddMealClick.`);
            showToast("Error identifying the day for the meal.", true);
            return;
        }
        // Check for valid mealType (breakfast, lunch, dinner, snack) - consider using an enum if applicable
        if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
            console.error(`MealPlan.js: Invalid mealType '${mealType}' in handleAddMealClick.`);
            showToast("Error identifying the meal type.", true);
        }
        mealDate.setDate(week.start.getDate() + dayMap[dayStr]);
        const dateForAPI = formatDateForAPI(mealDate);

        openMealSelectorModal(dateForAPI, mealType); // Call the function to open the modal
    }
    async function createMealPlanEntry(planData) {
        // Token is now expected as a parameter
        const authToken = arguments.length > 1 ? arguments[1] : null; 

        if (!authToken) {
            showToast("Authentication token missing. Please log in.", true);
            return null; // Return null or throw an error
        }
        showSpinner();
        let createdPlan = null;
        try {
            const fetchUrl = `${API_BASE_URL}/api/planner/meal-plan/`;

            // Add detailed logging of the request data for debugging
            console.log("MealPlan.js: Sending POST request to:", fetchUrl);
            console.log("MealPlan.js: Request headers:", {
                'Content-Type': 'application/json',
                'Authorization': `Token ${authToken}`
            });
            console.log("MealPlan.js: Request body (planData):", JSON.stringify(planData, null, 2));

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${authToken}`
                },
                body: JSON.stringify(planData)
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                let errorDetailMessage = `Error: ${response.status} - ${response.statusText}`; // Default message

                if (contentType && contentType.includes("application/json")) {
                    try {
                        const errorData = await response.json();
                        console.error("MealPlan.js: API error response JSON (createMealPlanEntry):", errorData);
                        // Use specific error messages from JSON if available
                        if (errorData.detail) {
                            errorDetailMessage = errorData.detail;
                        } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
                            errorDetailMessage = errorData.non_field_errors.join(', ');
                        } else if (typeof errorData === 'object') {
                            // Try to find a message in a common structure from backend
                            const messages = Object.values(errorData).flat().join(' ');
                            if (messages) errorDetailMessage = messages;
                        }
                    } catch (e) {
                        console.error("MealPlan.js: Could not parse JSON error response even though Content-Type was application/json. Status text:", response.statusText, "Error:", e);
                    }                } else {
                    console.error(`MealPlan.js: Received non-JSON error response (Content-Type: ${contentType}). Status: ${response.status}`);
                    if (response.status === 500) {
                        errorDetailMessage = "A server error occurred. Please try again later or contact support.";
                    } else if (response.status === 400) {
                        errorDetailMessage = "Bad request - please check the meal plan data format.";
                    }
                }
                showToast(errorDetailMessage, true);
            } else {
                createdPlan = await response.json();
                showToast("Meal added successfully!");
                loadAndDisplayWeek(currentDate); // Refresh the view
            }
        } catch (error) {
            console.error("MealPlan.js: CATCH block in createMealPlanEntry. Error:", error); // Log
            showToast("Network error or issue adding meal.", true);
        } finally {
            hideSpinner();
        }
        return createdPlan;
    }

    function handleEditMeal(event) {
        const mealPlanId = event.currentTarget.dataset.mealPlanId; // Get mealPlanId from the button
        showToast(`Placeholder: Edit meal ID ${mealPlanId}.`);
        // TODO: Implement modal for editing (change recipe or delete)
        // Example: openEditMealPlanModal(mealPlanId);
        // Modal could offer to change recipe (PUT/PATCH) or delete (DELETE)
    }
    async function deleteMealPlanEntry(mealPlanId) {
        const token = localStorage.getItem('authToken');

        if (!token) {
            showToast("Authentication token not found. Please log in.", true);
            return false; // Indicate failure
        }

        if (!confirm("Are you sure you want to remove this meal?")) {
            return false; // Indicate cancellation
        }
        showSpinner();
        let success = false;

        try {
            const fetchUrl = `${API_BASE_URL}/api/planner/meal-plan/${mealPlanId}/`;

            const response = await fetch(fetchUrl, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${token}` }
            });

            if (!response.ok && response.status !== 204) { // 204 No Content is success for DELETE
                let errorData = { detail: `API request failed with status ${response.status} during delete` };
                try {
                    errorData = await response.json();
                    console.error("MealPlan.js: API error response JSON (deleteMealPlanEntry):", errorData); // Log
                } catch (e) {
                    console.error("MealPlan.js: Could not parse error response as JSON (deleteMealPlanEntry). Status text:", response.statusText, "Error:", e); // Log
                    errorData.detail += `. ${response.statusText}`;
                }
                showToast(errorData.detail || `Error: ${response.status}`, true);
            } else {
                showToast("Meal removed successfully!");
                loadAndDisplayWeek(currentDate); // Refresh
                success = true;
            }
        } catch (error) {
            console.error("MealPlan.js: CATCH block in deleteMealPlanEntry. Error:", error); // Log
            showToast("Network error or issue removing meal.", true);
        } finally {
            hideSpinner();
        }
        return success;
    }

    // Drag and Drop Functionality
    function enableDragAndDrop() {
        document.querySelectorAll('.meal-card').forEach(card => {
            card.draggable = true;
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
        });

        document.querySelectorAll('.day-cell').forEach(cell => {
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('drop', handleDrop);
            cell.addEventListener('dragenter', handleDragEnter);
            cell.addEventListener('dragleave', handleDragLeave);
        });
    }

    function handleDragStart(e) {
        currentDragElement = e.target.closest('.meal-card');
        currentDragElement.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', currentDragElement.outerHTML);
        e.dataTransfer.setData('meal-plan-id', currentDragElement.dataset.mealPlanId);
    }

    function handleDragEnd(e) {
        if (currentDragElement) {
            currentDragElement.classList.remove('dragging');
        }
        document.querySelectorAll('.day-cell').forEach(cell => {
            cell.classList.remove('drag-over', 'drag-invalid');
        });
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDragEnter(e) {
        e.preventDefault();
        const cell = e.target.closest('.day-cell');
        if (cell && !cell.querySelector('.meal-card')) {
            cell.classList.add('drag-over');
        } else if (cell) {
            cell.classList.add('drag-invalid');
        }
    }

    function handleDragLeave(e) {
        const cell = e.target.closest('.day-cell');
        if (cell && !cell.contains(e.relatedTarget)) {
            cell.classList.remove('drag-over', 'drag-invalid');
        }
    }

    async function handleDrop(e) {
        e.preventDefault();
        const cell = e.target.closest('.day-cell');
        const mealPlanId = e.dataTransfer.getData('meal-plan-id');
        
        if (cell && !cell.querySelector('.meal-card') && mealPlanId) {
            const newDay = cell.dataset.day;
            const newMealType = cell.dataset.meal;
            
            // Calculate new date
            const week = getWeekInfo(currentDate);
            const dayMap = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
            const newDate = new Date(week.start);
            newDate.setDate(week.start.getDate() + dayMap[newDay]);
            const dateForAPI = formatDateForAPI(newDate);

            await updateMealPlanEntry(mealPlanId, {
                date: dateForAPI,
                meal_type: newMealType
            });
        }
        
        cell.classList.remove('drag-over', 'drag-invalid');
    }

    // Smart Suggestions System
    function getSmartSuggestions(mealType, dayOfWeek) {
        const suggestions = {
            breakfast: {
                quick: ['Overnight Oats', 'Smoothie Bowl', 'Avocado Toast'],
                healthy: ['Greek Yogurt Parfait', 'Veggie Scramble', 'Chia Pudding'],
                popular: ['Pancakes', 'French Toast', 'Breakfast Burrito'],
                seasonal: getSeasonalSuggestions('breakfast')
            },
            lunch: {
                quick: ['Caesar Salad', 'Sandwich Wrap', 'Quinoa Bowl'],
                healthy: ['Buddha Bowl', 'Grilled Chicken Salad', 'Lentil Soup'],
                popular: ['Pasta Salad', 'Tacos', 'Stir Fry'],
                seasonal: getSeasonalSuggestions('lunch')
            },
            dinner: {
                quick: ['One-Pan Chicken', 'Pasta Primavera', 'Stir-Fried Rice'],
                healthy: ['Grilled Salmon', 'Roasted Vegetables', 'Lean Protein Bowl'],
                popular: ['Spaghetti Bolognese', 'Chicken Curry', 'Beef Stew'],
                seasonal: getSeasonalSuggestions('dinner')
            },
            snack: {
                quick: ['Trail Mix', 'Fruit & Nuts', 'Yogurt'],
                healthy: ['Vegetable Sticks', 'Hummus & Carrots', 'Apple Slices'],
                popular: ['Popcorn', 'Granola Bar', 'Cheese & Crackers'],
                seasonal: getSeasonalSuggestions('snack')
            }
        };

        return suggestions[mealType] || suggestions.breakfast;
    }

    function getSeasonalSuggestions(mealType) {
        const month = new Date().getMonth();
        const seasons = {
            spring: [2, 3, 4], // Mar, Apr, May
            summer: [5, 6, 7], // Jun, Jul, Aug
            fall: [8, 9, 10],  // Sep, Oct, Nov
            winter: [11, 0, 1] // Dec, Jan, Feb
        };

        let currentSeason = 'spring';
        for (const [season, months] of Object.entries(seasons)) {
            if (months.includes(month)) {
                currentSeason = season;
                break;
            }
        }

        const seasonalRecipes = {
            spring: {
                breakfast: ['Spring Vegetable Frittata', 'Asparagus Toast'],
                lunch: ['Fresh Garden Salad', 'Spring Pea Soup'],
                dinner: ['Herb-Crusted Lamb', 'Spring Risotto'],
                snack: ['Fresh Berries', 'Green Smoothie']
            },
            summer: {
                breakfast: ['Berry Parfait', 'Cold Brew Overnight Oats'],
                lunch: ['Gazpacho', 'Grilled Vegetable Salad'],
                dinner: ['BBQ Grilled Fish', 'Summer Pasta Salad'],
                snack: ['Watermelon Slices', 'Frozen Fruit Pops']
            },
            fall: {
                breakfast: ['Pumpkin Pancakes', 'Apple Cinnamon Oatmeal'],
                lunch: ['Butternut Squash Soup', 'Harvest Salad'],
                dinner: ['Roasted Root Vegetables', 'Hearty Stew'],
                snack: ['Spiced Nuts', 'Apple Slices with Cinnamon']
            },
            winter: {
                breakfast: ['Warm Porridge', 'Hot Chocolate Oats'],
                lunch: ['Hearty Lentil Soup', 'Comfort Food Bowl'],
                dinner: ['Slow-Cooked Chili', 'Roasted Winter Vegetables'],
                snack: ['Hot Tea with Cookies', 'Warm Spiced Milk']
            }
        };

        return seasonalRecipes[currentSeason][mealType] || [];
    }

    // Enhanced Modal Functions
    function setupModalFilters() {
        // Suggestion chips
        suggestionChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const filter = chip.dataset.filter;
                applySmartFilter(filter);
                // Update chip styles
                suggestionChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
            });
        });

        // Filter tabs
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.filter;
                currentFilter = filter;
                applyMealTypeFilter(filter);
                // Update tab styles
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }

    function applySmartFilter(filterType) {
        if (!currentModalMealType) return;
        
        const suggestions = getSmartSuggestions(currentModalMealType, new Date().getDay());
        const suggestedTitles = suggestions[filterType] || [];
        
        const filteredRecipes = allFetchedRecipesForModal.filter(recipe => {
            const title = recipe.title || recipe.name || '';
            return suggestedTitles.some(suggestion => 
                title.toLowerCase().includes(suggestion.toLowerCase()) ||
                suggestion.toLowerCase().includes(title.toLowerCase())
            );
        });

        populateRecipeSelector(filteredRecipes.length > 0 ? filteredRecipes : allFetchedRecipesForModal);
        showToast(`Showing ${filterType} suggestions for ${currentModalMealType}`);
    }

    function applyMealTypeFilter(mealType) {
        if (mealType === 'all') {
            populateRecipeSelector(allFetchedRecipesForModal);
            return;
        }

        const filtered = allFetchedRecipesForModal.filter(recipe => {
            const tags = recipe.tags || [];
            const category = recipe.category || '';
            return tags.includes(mealType) || 
                   category.toLowerCase().includes(mealType) ||
                   (recipe.meal_type && recipe.meal_type.toLowerCase() === mealType);
        });

        populateRecipeSelector(filtered.length > 0 ? filtered : allFetchedRecipesForModal);
    }

    // Enhanced Action Functions
    async function generateGroceryList() {
        if (currentMealPlans.length === 0) {
            showToast("No meals planned for grocery list generation.", true);
            return;
        }

        showSpinner();
        try {
            const ingredients = extractIngredientsFromMealPlans(currentMealPlans);
            const groceryList = consolidateIngredients(ingredients);
            displayGroceryListModal(groceryList);
            showToast("Grocery list generated successfully!");
        } catch (error) {
            console.error("Error generating grocery list:", error);
            showToast("Error generating grocery list.", true);
        } finally {
            hideSpinner();
        }
    }

    function extractIngredientsFromMealPlans(mealPlans) {
        const ingredients = [];
        mealPlans.forEach(plan => {
            if (plan.recipe && plan.recipe.ingredients) {
                ingredients.push(...plan.recipe.ingredients);
            }
        });
        return ingredients;
    }

    function consolidateIngredients(ingredients) {
        const consolidated = {};
        ingredients.forEach(ingredient => {
            const name = ingredient.name || ingredient;
            const amount = ingredient.amount || 1;
            const unit = ingredient.unit || 'item';
            
            const key = `${name}_${unit}`;
            if (consolidated[key]) {
                consolidated[key].amount += amount;
            } else {
                consolidated[key] = { name, amount, unit };
            }
        });
        return Object.values(consolidated);
    }

    async function copyToNextWeek() {
        if (currentMealPlans.length === 0) {
            showToast("No meals to copy.", true);
            return;
        }

        if (!confirm("Copy all meals from this week to next week?")) return;

        showSpinner();
        try {
            const nextWeekDate = new Date(currentDate);
            nextWeekDate.setDate(currentDate.getDate() + 7);
            
            for (const plan of currentMealPlans) {
                const planDate = new Date(plan.date);
                planDate.setDate(planDate.getDate() + 7);
                
                await createMealPlanEntry({
                    recipe_title: plan.recipe ? plan.recipe.title : plan.recipe_title,
                    date: formatDateForAPI(planDate),
                    meal_type: plan.meal_type
                }, localStorage.getItem('authToken'));
            }
            
            showToast(`Successfully copied ${currentMealPlans.length} meals to next week!`);
        } catch (error) {
            console.error("Error copying to next week:", error);
            showToast("Error copying meals to next week.", true);
        } finally {
            hideSpinner();
        }
    }

    async function clearWeek() {
        if (currentMealPlans.length === 0) {
            showToast("No meals to clear.", true);
            return;
        }

        if (!confirm(`Are you sure you want to clear all ${currentMealPlans.length} meals from this week?`)) return;

        showSpinner();
        try {
            for (const plan of currentMealPlans) {
                await deleteMealPlanEntry(plan.id);
            }
            loadAndDisplayWeek(currentDate);
            showToast("Week cleared successfully!");
        } catch (error) {
            console.error("Error clearing week:", error);
            showToast("Error clearing week.", true);
        } finally {
            hideSpinner();
        }
    }

    if (prevWeekBtn) prevWeekBtn.addEventListener('click', handlePrevWeek);
    else console.error("MealPlan.js: prevWeekBtn event listener NOT attached - element not found.");
    
    if (nextWeekBtn) nextWeekBtn.addEventListener('click', handleNextWeek);
    else console.error("MealPlan.js: nextWeekBtn event listener NOT attached - element not found.");

    // Modal Close Button Event Listener
    if (closeMealSelectorModalBtn) {
        closeMealSelectorModalBtn.addEventListener('click', () => {
            if (mealSelectorModal) mealSelectorModal.style.display = 'none';
        });
    } else {
        console.error("MealPlan.js: closeMealSelectorModalBtn element NOT FOUND!");
    }

    // Close modal if clicked outside of modal-content
    if (mealSelectorModal) {
        mealSelectorModal.addEventListener('click', (event) => {
            if (event.target === mealSelectorModal) { // Check if the click is on the modal backdrop itself
                mealSelectorModal.style.display = 'none';
            }
        });
    }

    // Modal Recipe Search Event Listener
    if (modalRecipeSearch) {
        modalRecipeSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = allFetchedRecipesForModal.filter(recipe =>
                (recipe.title || recipe.name || '').toLowerCase().includes(searchTerm) ||
                (recipe.description || '').toLowerCase().includes(searchTerm)
            );
            populateRecipeSelector(filtered);
        });
    } else {
        console.error("MealPlan.js: modalRecipeSearch element NOT FOUND!");
    }    // Add meal button event listeners
    document.querySelectorAll('.btn-add-meal').forEach(button => {
        button.addEventListener('click', handleAddMealClick);
    });
    
    // Initialize the page
    loadAndDisplayWeek(currentDate);

    // Enhanced button event listeners
    const newPlanBtn = document.getElementById('newPlanBtn');
    if (newPlanBtn) {
        newPlanBtn.addEventListener('click', () => {
            showToast("Starting fresh meal plan for current week...");
            currentDate = new Date(); 
            loadAndDisplayWeek(currentDate);
        });
    }

    const printPlanBtn = document.getElementById('printPlanBtn');
    if (printPlanBtn) {
        printPlanBtn.addEventListener('click', () => {
            // Create print-friendly version
            const printWindow = window.open('', '_blank');
            const printContent = generatePrintContent(currentMealPlans);
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
            showToast("Opening print preview...");
        });
    }

    // Enhanced Action Button Event Listeners
    if (generateGroceryListBtn) {
        generateGroceryListBtn.addEventListener('click', generateGroceryList);
    }

    if (copyToNextWeekBtn) {
        copyToNextWeekBtn.addEventListener('click', copyToNextWeek);
    }

    if (sharePlanBtn) {
        sharePlanBtn.addEventListener('click', () => {
            if (navigator.share && currentMealPlans.length > 0) {
                navigator.share({
                    title: 'My ChopSmo Meal Plan',
                    text: `Check out my meal plan for this week! I have ${currentMealPlans.length} meals planned.`,
                    url: window.location.href
                });
            } else {
                // Fallback: copy to clipboard
                const shareText = `My ChopSmo Meal Plan - ${currentMealPlans.length} meals planned for this week!`;
                navigator.clipboard.writeText(shareText).then(() => {
                    showToast("Meal plan copied to clipboard!");
                }).catch(() => {
                    showToast("Unable to share meal plan.", true);
                });
            }
        });
    }

    if (clearWeekBtn) {
        clearWeekBtn.addEventListener('click', clearWeek);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape key to close modal
        if (e.key === 'Escape' && mealSelectorModal && mealSelectorModal.style.display === 'flex') {
            mealSelectorModal.style.opacity = '0';
            setTimeout(() => {
                mealSelectorModal.style.display = 'none';
            }, 300);
        }
        
        // Arrow keys for week navigation
        if (e.key === 'ArrowLeft' && e.ctrlKey) {
            e.preventDefault();
            handlePrevWeek();
        }
        if (e.key === 'ArrowRight' && e.ctrlKey) {
            e.preventDefault();
            handleNextWeek();
        }
    });

    // Enable drag and drop
    enableDragAndDrop();

    // Print content generator
    function generatePrintContent(mealPlans) {
        const week = getWeekInfo(currentDate);
        const weekRange = `${week.start.toLocaleDateString()} - ${week.end.toLocaleDateString()}`;
        
        let printHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>ChopSmo Meal Plan - ${weekRange}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #2E7D32; text-align: center; }
                    .week-header { text-align: center; margin-bottom: 30px; }
                    .meal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
                    .day-column { border: 1px solid #ddd; padding: 10px; }
                    .day-header { font-weight: bold; background: #f5f5f5; padding: 5px; margin: -10px -10px 10px -10px; }
                    .meal-item { margin-bottom: 10px; padding: 5px; background: #f9f9f9; border-radius: 4px; }
                    .meal-type { font-weight: bold; color: #2E7D32; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <h1>ChopSmo Meal Plan</h1>
                <div class="week-header">
                    <h2>${weekRange}</h2>
                    <p>Total Meals: ${mealPlans.length}</p>
                </div>
                <div class="meal-grid">
        `;

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        
        days.forEach((day, index) => {
            printHTML += `<div class="day-column"><div class="day-header">${day}</div>`;
            
            const dayMeals = mealPlans.filter(plan => {
                const planDate = new Date(plan.date);
                const dayStr = getDayStringFromDate(planDate);
                return dayStr === dayKeys[index];
            });
            
            ['breakfast', 'lunch', 'dinner', 'snack'].forEach(mealType => {
                const meal = dayMeals.find(m => m.meal_type.toLowerCase() === mealType);
                if (meal) {
                    printHTML += `
                        <div class="meal-item">
                            <div class="meal-type">${mealType.charAt(0).toUpperCase() + mealType.slice(1)}</div>
                            <div>${meal.recipe ? meal.recipe.title : 'Unnamed Recipe'}</div>
                        </div>
                    `;
                }
            });
            
            printHTML += '</div>';
        });
        
        printHTML += '</div></body></html>';
        return printHTML;
    }

    // Function to view recipe details
    function viewRecipeDetail(recipeId) {
        if (recipeId) {
            window.location.href = `recipe-detail.html?id=${recipeId}`;
        } else {
            console.error('No recipe ID provided for viewing');
            showToast('Unable to view recipe details', true);
        }
    }

    // Make viewRecipeDetail globally available for onclick handlers
    window.viewRecipeDetail = viewRecipeDetail;
});
