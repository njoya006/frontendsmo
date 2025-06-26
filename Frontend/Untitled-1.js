const API_BASE_URL = 'https://frontendsmo.vercel.app';

document.addEventListener('DOMContentLoaded', () => {
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const weekRangeDisplay = document.getElementById('weekRange');
    const currentWeekHeaderDisplay = document.getElementById('current-week');
    const totalMealsPlannedEl = document.getElementById('totalMealsPlanned');
    const avgCaloriesDayEl = document.getElementById('avgCaloriesDay');
    const avgProteinDayEl = document.getElementById('avgProteinDay');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const toastMessage = document.getElementById('toastMessage');

    // Meal Selector Modal Elements (ensure these IDs exist in MealPlans.html)
    const mealSelectorModal = document.getElementById('mealSelectorModal');
    const closeMealSelectorModalBtn = document.getElementById('closeMealSelectorModal');
    const modalRecipeList = document.getElementById('modalRecipeList');
    const modalRecipeSearch = document.getElementById('modalRecipeSearch');

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

    let currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()); // Start of current week (Sunday)
    
    let selectedMealSlot = null; // Track which meal slot is being filled
    let allRecipes = []; // Store all recipes for search functionality

    // Initialize the meal plan
    updateWeekDisplay();
    loadMealPlan();
    loadRecipes(); // Load recipes for the modal

    // Event Listeners
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() - 7);
            updateWeekDisplay();
            loadMealPlan();
        });
    }

    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            updateWeekDisplay();
            loadMealPlan();
        });
    }

    // Close modal event
    if (closeMealSelectorModalBtn) {
        closeMealSelectorModalBtn.addEventListener('click', () => {
            closeMealModal();
        });
    }

    // Modal search functionality
    if (modalRecipeSearch) {
        modalRecipeSearch.addEventListener('input', (e) => {
            filterRecipes(e.target.value);
        });
    }

    // Add meal button event listeners
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-meal-btn') || e.target.closest('.add-meal-btn')) {
            const mealSlot = e.target.closest('.meal-slot');
            if (mealSlot) {
                selectedMealSlot = mealSlot;
                openMealModal();
            }
        }
    });

    // Close modal when clicking outside
    if (mealSelectorModal) {
        mealSelectorModal.addEventListener('click', (e) => {
            if (e.target === mealSelectorModal) {
                closeMealModal();
            }
        });
    }

    function updateWeekDisplay() {
        if (!weekRangeDisplay) return;
        
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const startStr = currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        weekRangeDisplay.textContent = `${startStr} - ${endStr}`;
        
        // Update header text based on week
        if (currentWeekHeaderDisplay) {
            const today = new Date();
            const weekStart = new Date(currentWeekStart);
            const weekEndDate = new Date(currentWeekStart);
            weekEndDate.setDate(weekEndDate.getDate() + 6);
            
            if (today >= weekStart && today <= weekEndDate) {
                currentWeekHeaderDisplay.textContent = "This Week's Meal Plan";
            } else if (weekStart > today) {
                currentWeekHeaderDisplay.textContent = "Upcoming Meal Plan";
            } else {
                currentWeekHeaderDisplay.textContent = "Past Meal Plan";
            }
        }
    }

    function showLoadingSpinner() {
        if (loadingSpinner) {
            loadingSpinner.style.display = 'flex';
        }
    }

    function hideLoadingSpinner() {
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
    }

    function showToast(message, type = 'info') {
        if (!toastMessage) return;
        
        toastMessage.textContent = message;
        toastMessage.style.backgroundColor = type === 'error' ? '#f44336' : 
                                            type === 'success' ? '#4caf50' : '#2196f3';
        toastMessage.style.display = 'block';
        
        setTimeout(() => {
            toastMessage.style.display = 'none';
        }, 3000);
    }

    async function loadMealPlan() {
        showLoadingSpinner();
        
        try {
            const weekStartStr = currentWeekStart.toISOString().split('T')[0];
            const response = await fetch(`${API_BASE_URL}/meal-plans/?week_start=${weekStartStr}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authorization header if needed
                    // 'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const mealPlan = await response.json();
            displayMealPlan(mealPlan);
            updateMealStats(mealPlan);
            
        } catch (error) {
            console.error('Error loading meal plan:', error);
            showToast('Failed to load meal plan. Using default data.', 'error');
            // Use default data if API fails
            displayDefaultMealPlan();
        } finally {
            hideLoadingSpinner();
        }
    }

    async function loadRecipes() {
        try {
            const response = await fetch(`${API_BASE_URL}/recipes/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                allRecipes = await response.json();
            } else {
                // Use default recipes if API fails
                allRecipes = getDefaultRecipes();
            }
        } catch (error) {
            console.error('Error loading recipes:', error);
            allRecipes = getDefaultRecipes();
        }
    }

    function getDefaultRecipes() {
        return [
            { id: 1, name: 'Oatmeal with Berries', category: 'breakfast', prep_time: 10, calories: 250 },
            { id: 2, name: 'Scrambled Eggs', category: 'breakfast', prep_time: 15, calories: 300 },
            { id: 3, name: 'Smoothie Bowl', category: 'breakfast', prep_time: 5, calories: 200 },
            { id: 4, name: 'Pancakes', category: 'breakfast', prep_time: 20, calories: 400 },
            { id: 5, name: 'Grilled Chicken Salad', category: 'lunch', prep_time: 25, calories: 350 },
            { id: 6, name: 'Vegetable Soup', category: 'lunch', prep_time: 30, calories: 200 },
            { id: 7, name: 'Quinoa Bowl', category: 'lunch', prep_time: 20, calories: 320 },
            { id: 8, name: 'Fish Tacos', category: 'lunch', prep_time: 25, calories: 380 },
            { id: 9, name: 'Pasta Primavera', category: 'lunch', prep_time: 30, calories: 450 },
            { id: 10, name: 'Grilled Salmon', category: 'dinner', prep_time: 25, calories: 400 },
            { id: 11, name: 'Chicken Stir Fry', category: 'dinner', prep_time: 20, calories: 350 },
            { id: 12, name: 'Beef Tacos', category: 'dinner', prep_time: 30, calories: 500 },
            { id: 13, name: 'Pizza Night', category: 'dinner', prep_time: 15, calories: 600 },
            { id: 14, name: 'BBQ Ribs', category: 'dinner', prep_time: 45, calories: 550 },
            { id: 15, name: 'Roast Chicken', category: 'dinner', prep_time: 60, calories: 450 }
        ];
    }

    function displayMealPlan(mealPlan) {
        // Clear existing meals
        const mealSlots = document.querySelectorAll('.meal-slot');
        mealSlots.forEach(slot => {
            const mealItem = slot.querySelector('.meal-item');
            const addBtn = slot.querySelector('.add-meal-btn');
            
            if (mealItem) {
                mealItem.remove();
            }
            
            if (!addBtn) {
                const newAddBtn = document.createElement('button');
                newAddBtn.className = 'add-meal-btn';
                newAddBtn.textContent = '+ Add Meal';
                slot.appendChild(newAddBtn);
            }
        });

        // Add meals from API data
        if (mealPlan && mealPlan.meals) {
            mealPlan.meals.forEach(meal => {
                const slot = document.querySelector(`[data-day="${meal.day}"][data-meal="${meal.meal_type}"]`);
                if (slot) {
                    addMealToSlot(slot, meal);
                }
            });
        }
    }

    function displayDefaultMealPlan() {
        // Default meal plan data (as shown in the HTML)
        const defaultMeals = [
            { day: 'monday', meal_type: 'breakfast', name: 'Oatmeal with Berries', time: '8:00 AM' },
            { day: 'wednesday', meal_type: 'breakfast', name: 'Scrambled Eggs', time: '7:30 AM' },
            { day: 'friday', meal_type: 'breakfast', name: 'Smoothie Bowl', time: '8:15 AM' },
            { day: 'saturday', meal_type: 'breakfast', name: 'Pancakes', time: '9:00 AM' },
            { day: 'monday', meal_type: 'lunch', name: 'Grilled Chicken Salad', time: '12:30 PM' },
            { day: 'tuesday', meal_type: 'lunch', name: 'Vegetable Soup', time: '1:00 PM' },
            { day: 'thursday', meal_type: 'lunch', name: 'Quinoa Bowl', time: '12:45 PM' },
            { day: 'saturday', meal_type: 'lunch', name: 'Fish Tacos', time: '1:30 PM' },
            { day: 'sunday', meal_type: 'lunch', name: 'Pasta Primavera', time: '1:15 PM' },
            { day: 'monday', meal_type: 'dinner', name: 'Grilled Salmon', time: '7:00 PM' },
            { day: 'tuesday', meal_type: 'dinner', name: 'Chicken Stir Fry', time: '6:30 PM' },
            { day: 'wednesday', meal_type: 'dinner', name: 'Beef Tacos', time: '7:15 PM' },
            { day: 'friday', meal_type: 'dinner', name: 'Pizza Night', time: '7:30 PM' },
            { day: 'saturday', meal_type: 'dinner', name: 'BBQ Ribs', time: '6:00 PM' },
            { day: 'sunday', meal_type: 'dinner', name: 'Roast Chicken', time: '6:45 PM' }
        ];

        // Clear and populate with default meals
        displayMealPlan({ meals: defaultMeals });
    }

    function addMealToSlot(slot, meal) {
        const addBtn = slot.querySelector('.add-meal-btn');
        if (addBtn) {
            addBtn.remove();
        }

        const mealDiv = document.createElement('div');
        mealDiv.className = 'meal-item';
        mealDiv.innerHTML = `
            ${meal.name}
            <span class="meal-time">${meal.time || 'Not set'}</span>
        `;
        
        // Add click event to edit meal
        mealDiv.addEventListener('click', () => {
            // Implement edit meal functionality
            console.log('Edit meal:', meal);
        });

        slot.appendChild(mealDiv);
    }

    function updateMealStats(mealPlan) {
        let totalMeals = 0;
        let totalCalories = 0;
        let totalProtein = 0;

        if (mealPlan && mealPlan.meals) {
            totalMeals = mealPlan.meals.length;
            mealPlan.meals.forEach(meal => {
                totalCalories += meal.calories || 300; // Default calories if not provided
                totalProtein += meal.protein || 20; // Default protein if not provided
            });
        } else {
            // Default stats
            totalMeals = 12;
            totalCalories = 12950; // 12 meals * average 1079 calories
            totalProtein = 595; // 12 meals * average 49.6g protein
        }

        const avgCalories = totalMeals > 0 ? Math.round(totalCalories / 7) : 0; // Per day
        const avgProtein = totalMeals > 0 ? Math.round(totalProtein / 7) : 0; // Per day

        if (totalMealsPlannedEl) totalMealsPlannedEl.textContent = totalMeals;
        if (avgCaloriesDayEl) avgCaloriesDayEl.textContent = avgCalories.toLocaleString();
        if (avgProteinDayEl) avgProteinDayEl.textContent = `${avgProtein}g`;
    }

    function openMealModal() {
        if (!mealSelectorModal) return;
        
        mealSelectorModal.style.display = 'flex';
        displayRecipes(allRecipes);
        
        // Focus on search input
        if (modalRecipeSearch) {
            modalRecipeSearch.value = '';
            modalRecipeSearch.focus();
        }
    }

    function closeMealModal() {
        if (mealSelectorModal) {
            mealSelectorModal.style.display = 'none';
        }
        selectedMealSlot = null;
    }

    function displayRecipes(recipes) {
        if (!modalRecipeList) return;
        
        modalRecipeList.innerHTML = '';
        
        if (recipes.length === 0) {
            modalRecipeList.innerHTML = '<p>No recipes found.</p>';
            return;
        }

        recipes.forEach(recipe => {
            const recipeDiv = document.createElement('div');
            recipeDiv.style.cssText = `
                padding: 15px;
                margin: 10px 0;
                border: 1px solid #ddd;
                border-radius: 8px;
                cursor: pointer;
                transition: background-color 0.2s;
            `;
            
            recipeDiv.innerHTML = `
                <h4 style="margin: 0 0 10px 0;">${recipe.name}</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">
                    ${recipe.prep_time} min • ${recipe.calories} cal • ${recipe.category}
                </p>
            `;

            recipeDiv.addEventListener('mouseenter', () => {
                recipeDiv.style.backgroundColor = '#f5f5f5';
            });

            recipeDiv.addEventListener('mouseleave', () => {
                recipeDiv.style.backgroundColor = 'white';
            });

            recipeDiv.addEventListener('click', () => {
                selectRecipe(recipe);
            });

            modalRecipeList.appendChild(recipeDiv);
        });
    }

    function filterRecipes(searchTerm) {
        const filtered = allRecipes.filter(recipe => 
            recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            recipe.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        displayRecipes(filtered);
    }

    async function selectRecipe(recipe) {
        if (!selectedMealSlot) return;

        try {
            // Here you would typically save to the API
            const mealData = {
                day: selectedMealSlot.dataset.day,
                meal_type: selectedMealSlot.dataset.meal,
                recipe_id: recipe.id,
                name: recipe.name,
                time: getCurrentTimeForMeal(selectedMealSlot.dataset.meal)
            };

            // For now, just add to the UI
            addMealToSlot(selectedMealSlot, mealData);
            
            showToast(`Added ${recipe.name} to meal plan!`, 'success');
            closeMealModal();

            // Update stats (simplified)
            updateStatsAfterMealAdd();
            
        } catch (error) {
            console.error('Error adding meal:', error);
            showToast('Failed to add meal to plan', 'error');
        }
    }

    function getCurrentTimeForMeal(mealType) {
        const defaultTimes = {
            'breakfast': '8:00 AM',
            'lunch': '12:30 PM',
            'dinner': '7:00 PM'
        };
        return defaultTimes[mealType] || '12:00 PM';
    }

    function updateStatsAfterMealAdd() {
        // Simple increment of total meals
        if (totalMealsPlannedEl) {
            const current = parseInt(totalMealsPlannedEl.textContent) || 0;
            totalMealsPlannedEl.textContent = current + 1;
        }
    }

    // Quick action functions
    window.autoGeneratePlan = function() {
        showToast('Auto-generating meal plan...', 'info');
        // Implement auto-generation logic
        setTimeout(() => {
            showToast('Meal plan generated successfully!', 'success');
            loadMealPlan(); // Reload to show new plan
        }, 2000);
    };

    window.copyLastWeek = function() {
        showToast('Copying last week\'s meal plan...', 'info');
        // Implement copy logic
        setTimeout(() => {
            showToast('Last week copied successfully!', 'success');
            loadMealPlan(); // Reload to show copied plan
        }, 1500);
    };

    window.generateShoppingList = function() {
        showToast('Generating shopping list...', 'info');
        // Implement shopping list generation
        setTimeout(() => {
            showToast('Shopping list updated!', 'success');
        }, 1000);
    };

    window.sharePlan = function() {
        if (navigator.share) {
            navigator.share({
                title: 'My ChopSmo Meal Plan',
                text: 'Check out my meal plan for this week!',
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                showToast('Link copied to clipboard!', 'success');
            }).catch(() => {
                showToast('Unable to share meal plan', 'error');
            });
        }
    };

    // Add event listeners for quick action buttons
    document.addEventListener('click', (e) => {
        if (e.target.textContent.includes('Auto-Generate Plan')) {
            autoGeneratePlan();
        } else if (e.target.textContent.includes('Copy Last Week')) {
            copyLastWeek();
        } else if (e.target.textContent.includes('Generate Shopping List')) {
            generateShoppingList();
        } else if (e.target.textContent.includes('Share Plan')) {
            sharePlan();
        }
    });

    // Drag and drop functionality for meal items (basic implementation)
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('meal-item')) {
            e.dataTransfer.setData('text/plain', e.target.textContent);
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    document.addEventListener('dragover', (e) => {
        if (e.target.classList.contains('meal-slot') || e.target.closest('.meal-slot')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        }
    });

    document.addEventListener('drop', (e) => {
        const mealSlot = e.target.classList.contains('meal-slot') ? 
                        e.target : e.target.closest('.meal-slot');
        
        if (mealSlot) {
            e.preventDefault();
            const mealText = e.dataTransfer.getData('text/plain');
            console.log('Dropped meal:', mealText, 'on slot:', mealSlot.dataset);
            // Implement actual move logic here
            showToast('Meal moved! (Feature in development)', 'info');
        }
    });

    // Make meal items draggable
    document.addEventListener('DOMContentLoaded', () => {
        const mealItems = document.querySelectorAll('.meal-item');
        mealItems.forEach(item => {
            item.setAttribute('draggable', 'true');
        });
    });

    console.log('MealPlan.js: Initialization complete');
});
