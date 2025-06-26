document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile page loaded, checking for elements...');
    
    // Debug: Check if critical elements exist
    const criticalElements = [
        'userName', 'userEmail', 'avatarImg', 'firstName', 'lastName', 
        'profileEmail', 'dob', 'phoneNumber', 'personalInfoForm'
    ];
    
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Critical element not found: ${id}`);
        } else {
            console.log(`Found element: ${id}`);
        }
    });

    // Mobile Menu Toggle (same as index.js)
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
        // In a real app, you would:
        // 1. Send a logout request to your server
        // 2. Clear any client-side authentication tokens
        // 3. Redirect to home page
        
        // For this demo, we'll just clear localStorage and redirect
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // --- Global Loading Spinner & Toasts ---
    const spinner = document.createElement('div');
    spinner.id = 'loadingSpinner';
    spinner.style.display = 'none';
    spinner.style.position = 'fixed';
    spinner.style.top = '0';
    spinner.style.left = '0';
    spinner.style.width = '100vw';
    spinner.style.height = '100vh';
    spinner.style.background = 'rgba(255,255,255,0.6)';
    spinner.style.zIndex = '9999';
    spinner.innerHTML = '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><i class="fas fa-spinner fa-spin" style="font-size:48px;color:var(--primary)"></i></div>';
    document.body.appendChild(spinner);

    const toast = document.createElement('div');
    toast.id = 'toastMessage';
    toast.style.display = 'none';
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'var(--primary)';
    toast.style.color = 'white';
    toast.style.padding = '14px 28px';
    toast.style.borderRadius = '6px';
    toast.style.fontSize = '15px';
    toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    toast.style.zIndex = '10000';
    document.body.appendChild(toast);

    function showSpinner() { spinner.style.display = 'block'; }
    function hideSpinner() { spinner.style.display = 'none'; }
    function showToast(msg, color = null) {
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
    }    // Load User Data from backend
    async function loadUserDataFromBackend() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showToast('You are not logged in. Redirecting...', '#f44336');
            setTimeout(() => window.location.href = 'Login.html', 2000);
            return;
        }
        
        try {
            const data = await fetchWithSpinnerToast(
                'https://frontendsmo.vercel.app/api/users/profile/',
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                },
                null, // No success message for loading
                'Failed to load profile data'
            );
            
            console.log('Profile API response:', data); // DEBUG: log the full response
            
            // Display user data with fallbacks
            const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username || 'User';
            
            // Update display elements
            if (document.getElementById('userName')) {
                document.getElementById('userName').textContent = fullName;
            }
            if (document.getElementById('userEmail')) {
                document.getElementById('userEmail').textContent = data.email || 'No email provided';
            }
            
            // Update form fields
            const formFields = [
                { id: 'firstName', value: data.first_name || '' },
                { id: 'lastName', value: data.last_name || '' },
                { id: 'profileEmail', value: data.email || '' },
                { id: 'dob', value: data.date_of_birth || '' },
                { id: 'phoneNumber', value: data.phone_number || '' },
                { id: 'location', value: data.location || '' },
                { id: 'timezone', value: data.timezone || '' },
                { id: 'dietaryPreferences', value: data.dietary_preferences || '' },
                { id: 'basicIngredients', value: data.basic_ingredients || '' }
            ];
            
            formFields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    element.value = field.value;
                }
            });
            
            // Update stats if available
            if (document.getElementById('recipesCount')) {
                document.getElementById('recipesCount').textContent = data.saved_recipes_count || '0';
            }
            if (document.getElementById('mealsPlanned')) {
                document.getElementById('mealsPlanned').textContent = data.meal_plans_count || '0';
            }
            
            // Handle profile photo with improved error handling
            const avatarImg = document.getElementById('avatarImg');
            if (avatarImg) {
                if (data.profile_photo) {
                    let photoUrl = data.profile_photo;
                    // Handle different backend URL formats
                    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
                        // Full URL - use as is
                    } else if (photoUrl.startsWith('/media/')) {
                        photoUrl = `https://frontendsmo.vercel.app${photoUrl}`;
                    } else if (photoUrl) {
                        // Relative path or filename
                        photoUrl = `https://frontendsmo.vercel.app/media/${photoUrl.replace(/^media\/?/, '')}`;
                    }
                    
                    // Set the image with error handling
                    avatarImg.onload = function() {
                        console.log('Profile image loaded successfully');
                    };
                    avatarImg.onerror = function() {
                        console.warn('Profile image failed to load, using placeholder');
                        const initial = data.first_name ? data.first_name.charAt(0).toUpperCase() : 'U';
                        this.src = `https://via.placeholder.com/140x140/4CAF50/white?text=${initial}`;
                    };
                    avatarImg.src = photoUrl;
                } else {
                    // Set placeholder with user's initial
                    const initial = data.first_name ? data.first_name.charAt(0).toUpperCase() : 'U';
                    avatarImg.src = `https://via.placeholder.com/140x140/4CAF50/white?text=${initial}`;
                }            }
            
            console.log('Profile data loaded successfully');
            
            // Store original form data for reset functionality
            if (window.storeOriginalFormData) {
                setTimeout(() => window.storeOriginalFormData(), 100);
            }
            
        } catch (error) {
            console.error('Profile loading error:', error);
            if (error && error.status === 401) {
                localStorage.removeItem('authToken');
                showToast('Session expired. Please login again.', '#f44336');
                setTimeout(() => window.location.href = 'Login.html', 2000);
            }
        }
    }    // Only fetch user data after DOM is ready and token is present
    function waitForTokenAndLoadUserData(retries = 10) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            if (retries > 0) {
                setTimeout(() => waitForTokenAndLoadUserData(retries - 1), 100);
            } else {
                showToast('You are not logged in. Redirecting...', '#f44336');
                setTimeout(() => window.location.href = 'Login.html', 2000);
            }
            return;
        }
        loadUserDataFromBackend();
    }
    waitForTokenAndLoadUserData();

    // Profile Tab Navigation
    const tabButtons = document.querySelectorAll('[data-tab]');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.parentElement.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button
            this.parentElement.classList.add('active');
            
            // Show corresponding tab pane
            const targetPane = document.getElementById(targetTab);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });    // Avatar Upload - Enhanced with validation and preview
    let avatarFile = null;
    const avatarInput = document.getElementById('avatarInput');
    const avatarImg = document.getElementById('avatarImg');
    const avatarPreview = document.querySelector('.avatar-preview');
    
    if (avatarInput && avatarImg) {
        // Make avatar preview clickable
        if (avatarPreview) {
            avatarPreview.addEventListener('click', function() {
                avatarInput.click();
            });
        }
        
        avatarInput.addEventListener('change', function() {
            const file = this.files[0];
            
            if (!file) {
                avatarFile = null;
                return;
            }
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                showToast('Please select a valid image file (JPG, PNG, or GIF)', '#f44336');
                this.value = '';
                return;
            }
            
            // Validate file size (5MB max)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                showToast('Image size must be less than 5MB', '#f44336');
                this.value = '';
                return;
            }
            
            // Store file and show preview
            avatarFile = file;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                avatarImg.src = e.target.result;
                
                // Add visual feedback for change
                avatarPreview.style.borderColor = '#4CAF50';
                avatarPreview.style.boxShadow = '0 0 0 4px rgba(76, 175, 80, 0.3)';
                
                // Trigger change detection
                checkForChanges();
                
                showToast('Profile photo updated! Remember to save changes.', '#4CAF50');
            };
            
            reader.onerror = function() {
                showToast('Error reading image file. Please try again.', '#f44336');
                avatarFile = null;
                this.value = '';
            };
            
            reader.readAsDataURL(file);
        });
        
        // Reset avatar preview styling when form is reset
        window.resetAvatarPreview = function() {
            if (avatarPreview) {
                avatarPreview.style.borderColor = '';
                avatarPreview.style.boxShadow = '';
            }
        };
    }

    // Password Strength Indicator (same as signup.js)
    const passwordInput = document.getElementById('newPassword');
    if (passwordInput) {
        const strengthBars = document.querySelectorAll('#change-password .strength-bar');
        const strengthText = document.querySelector('#change-password .strength-text');
        
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            
            strengthBars.forEach((bar, index) => {
                bar.style.backgroundColor = index < strength ? getStrengthColor(strength) : '#eee';
            });
            
            const strengthMessages = ['Very Weak', 'Weak', 'Medium', 'Strong'];
            strengthText.textContent = strengthMessages[strength - 1] || '';
            strengthText.style.color = getStrengthColor(strength);
        });
    }
    
    function calculatePasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return Math.min(4, Math.floor(strength / 1.5));
    }
    
    function getStrengthColor(strength) {
        const colors = ['#ff4d4d', '#ffa64d', '#66b3ff', '#4CAF50'];
        return colors[strength - 1] || '#eee';
    }    // Form Submissions
    const personalInfoForm = document.getElementById('personalInfoForm');
    let originalFormData = {}; // Store original data for reset functionality
    
    if (personalInfoForm) {
        // Store original form data when page loads
        function storeOriginalFormData() {
            originalFormData = {
                firstName: document.getElementById('firstName')?.value || '',
                lastName: document.getElementById('lastName')?.value || '',
                email: document.getElementById('profileEmail')?.value || '',
                dob: document.getElementById('dob')?.value || '',
                phoneNumber: document.getElementById('phoneNumber')?.value || '',
                location: document.getElementById('location')?.value || '',
                timezone: document.getElementById('timezone')?.value || '',
                dietaryPreferences: document.getElementById('dietaryPreferences')?.value || '',
                basicIngredients: document.getElementById('basicIngredients')?.value || ''
            };
        }
        
        // Call this after loading user data
        window.storeOriginalFormData = storeOriginalFormData;
        
        personalInfoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const token = localStorage.getItem('authToken');
            if (!token) {
                showToast('You are not logged in. Please login again.', '#f44336');
                setTimeout(() => window.location.href = 'Login.html', 2000);
                return;
            }
            
            // Add loading state to form
            const submitBtn = personalInfoForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;
            personalInfoForm.classList.add('form-loading');
            
            try {
                // Get and validate form values
                const firstName = document.getElementById('firstName')?.value?.trim() || '';
                const lastName = document.getElementById('lastName')?.value?.trim() || '';
                const email = document.getElementById('profileEmail')?.value?.trim() || '';
                const dob = document.getElementById('dob')?.value || '';
                const phoneNumber = document.getElementById('phoneNumber')?.value?.trim() || '';
                const location = document.getElementById('location')?.value?.trim() || '';
                const timezone = document.getElementById('timezone')?.value || '';
                const dietaryPreferences = document.getElementById('dietaryPreferences')?.value?.trim() || '';
                const basicIngredients = document.getElementById('basicIngredients')?.value?.trim() || '';
                
                // Validate required fields
                if (!firstName || !lastName || !email) {
                    showToast('Please fill in all required fields (First Name, Last Name, Email)', '#f44336');
                    return;
                }
                
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    showToast('Please enter a valid email address', '#f44336');
                    return;
                }
                
                // Validate phone number if provided
                if (phoneNumber && phoneNumber.length < 10) {
                    showToast('Please enter a valid phone number', '#f44336');
                    return;
                }
                
                // Validate date of birth if provided
                if (dob) {
                    const dobDate = new Date(dob);
                    const today = new Date();
                    const age = today.getFullYear() - dobDate.getFullYear();
                    if (age < 13 || age > 120) {
                        showToast('Please enter a valid date of birth', '#f44336');
                        return;
                    }
                }
                
                // Prepare form data
                const formData = new FormData();
                formData.append('first_name', firstName);
                formData.append('last_name', lastName);
                formData.append('email', email);
                if (dob) formData.append('date_of_birth', dob);
                if (phoneNumber) formData.append('phone_number', phoneNumber);
                if (location) formData.append('location', location);
                if (timezone) formData.append('timezone', timezone);
                if (dietaryPreferences) formData.append('dietary_preferences', dietaryPreferences);
                if (basicIngredients) formData.append('basic_ingredients', basicIngredients);
                if (avatarFile) {
                    formData.append('profile_photo', avatarFile);
                }
                
                // Submit form data
                const data = await fetchWithSpinnerToast(
                    'https://frontendsmo.vercel.app/api/users/profile/',
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Token ${token}`
                        },
                        body: formData
                    },
                    'Profile updated successfully! 🎉',
                    'Failed to update profile. Please try again.'
                );
                
                // Refresh the user data to reflect changes
                await loadUserDataFromBackend();
                storeOriginalFormData(); // Update original data after successful save
                avatarFile = null; // Reset avatar file after successful upload
                
                // Add success visual feedback
                personalInfoForm.style.background = 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.02) 100%)';
                setTimeout(() => {
                    personalInfoForm.style.background = '';
                }, 3000);
                
            } catch (error) {
                console.error('Profile update error:', error);
                // Show specific error messages if available
                if (error && error.email) {
                    showToast('Email: ' + error.email[0], '#f44336');
                } else if (error && error.phone_number) {
                    showToast('Phone: ' + error.phone_number[0], '#f44336');
                } else {
                    showToast('Failed to update profile. Please check your connection and try again.', '#f44336');
                }
            } finally {
                // Reset button state
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                personalInfoForm.classList.remove('form-loading');
            }
        });
        
        // Handle Cancel/Reset button
        const cancelBtn = personalInfoForm.querySelector('.btn-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
                    // Reset form to original values
                    Object.keys(originalFormData).forEach(key => {
                        const fieldMap = {
                            firstName: 'firstName',
                            lastName: 'lastName',
                            email: 'profileEmail',
                            dob: 'dob',
                            phoneNumber: 'phoneNumber',
                            location: 'location',
                            timezone: 'timezone',
                            dietaryPreferences: 'dietaryPreferences',
                            basicIngredients: 'basicIngredients'
                        };
                        
                        const element = document.getElementById(fieldMap[key]);
                        if (element) {
                            element.value = originalFormData[key];
                        }
                    });
                      // Reset avatar if it was changed
                    if (avatarFile) {
                        avatarFile = null;
                        avatarInput.value = '';
                        loadUserDataFromBackend(); // Reload original avatar
                        if (window.resetAvatarPreview) {
                            window.resetAvatarPreview();
                        }
                    }
                    
                    showToast('Changes cancelled', '#666');
                }
            });
        }
    }

    // Delete Account
    const deleteAccountForm = document.getElementById('deleteAccountForm');
    if (deleteAccountForm) {
        deleteAccountForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (confirm('Are you absolutely sure you want to delete your account? This cannot be undone.')) {
                // In a real app, you would send a request to your backend
                localStorage.removeItem('currentUser');
                alert('Account deleted successfully. Redirecting to home page...');
                window.location.href = 'index.html';
            }
        });
    }

    // Dietary Preferences Form Submission
    const dietaryForm = document.getElementById('dietaryForm');
    if (dietaryForm) {
        dietaryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('You are not logged in.');
                window.location.href = 'login.html';
                return;
            }
            // Get form values
            const dietType = dietaryForm.querySelector('input[name="dietType"]:checked')?.value || '';
            const allergies = Array.from(dietaryForm.querySelectorAll('input[name="allergies"]:checked')).map(cb => cb.value).join(',');
            const dislikes = document.getElementById('dislikes').value;
            try {
                const response = await fetch('https://frontendsmo.vercel.app/api/users/preferences/', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`
                    },
                    body: JSON.stringify({
                        diet_type: dietType,
                        allergies: allergies, // now a comma-separated string
                        dislikes: dislikes
                    })
                });
                const data = await response.json();
                if (!response.ok) {
                    let errorMsg = 'Failed to update dietary preferences.';
                    if (data.detail) {
                        errorMsg = data.detail;
                    } else if (data.message) {
                        errorMsg = data.message;
                    } else if (typeof data === 'object') {
                        errorMsg = JSON.stringify(data);
                    }
                    alert(errorMsg);
                    return;
                }
                alert('Dietary preferences updated successfully!');
            } catch (error) {
                alert('Network error. Please try again later.');
                console.error(error);
            }
        });
    }

    // Keyboard shortcuts for profile management
    document.addEventListener('keydown', function(e) {
        // Ctrl+S to save (prevent browser save dialog)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            const saveBtn = document.querySelector('.btn-save');
            if (saveBtn && !saveBtn.disabled) {
                saveBtn.click();
            }
        }
        
        // Escape to cancel
        if (e.key === 'Escape') {
            const cancelBtn = document.querySelector('.btn-cancel');
            if (cancelBtn && cancelBtn.style.opacity !== '0.7') {
                cancelBtn.click();
            }
        }
    });
    
    // Auto-save reminder (show tooltip after user makes changes)
    let changeTimeout;
    function showAutoSaveReminder() {
        clearTimeout(changeTimeout);
        changeTimeout = setTimeout(() => {
            if (checkForChanges()) {
                showToast('💡 Tip: Press Ctrl+S to save your changes quickly', '#2196F3');
            }
        }, 10000); // Show reminder after 10 seconds of changes
    }
    
    // Add change listeners to all form fields for auto-save reminder
    const allFormFields = document.querySelectorAll('#personalInfoForm input, #personalInfoForm select, #personalInfoForm textarea');
    allFormFields.forEach(field => {
        field.addEventListener('input', showAutoSaveReminder);
    });

    // Real-time form validation and change detection
    function setupFormValidation() {
        const formFields = [
            { id: 'firstName', type: 'required' },
            { id: 'lastName', type: 'required' },
            { id: 'profileEmail', type: 'email' },
            { id: 'phoneNumber', type: 'phone' },
            { id: 'dob', type: 'date' }
        ];
        
        formFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element) return;
            
            // Add real-time validation
            element.addEventListener('blur', function() {
                validateField(this, field.type);
            });
            
            // Add change detection
            element.addEventListener('input', function() {
                checkForChanges();
                clearFieldError(this);
            });
        });
    }
    
    function validateField(element, type) {
        const value = element.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        switch (type) {
            case 'required':
                isValid = value.length > 0;
                errorMessage = 'This field is required';
                break;
            case 'email':
                if (value) {
                    isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                    errorMessage = 'Please enter a valid email address';
                }
                break;
            case 'phone':
                if (value) {
                    isValid = value.length >= 10;
                    errorMessage = 'Please enter a valid phone number';
                }
                break;
            case 'date':
                if (value) {
                    const date = new Date(value);
                    const today = new Date();
                    const age = today.getFullYear() - date.getFullYear();
                    isValid = age >= 13 && age <= 120;
                    errorMessage = 'Please enter a valid date of birth';
                }
                break;
        }
        
        showFieldValidation(element, isValid, errorMessage);
        return isValid;
    }
    
    function showFieldValidation(element, isValid, errorMessage) {
        const formGroup = element.closest('.form-group');
        if (!formGroup) return;
        
        // Remove existing error
        const existingError = formGroup.querySelector('.field-error');
        if (existingError) existingError.remove();
        
        if (!isValid && errorMessage) {
            // Add error styling
            element.style.borderColor = '#e74c3c';
            element.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
            
            // Add error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.style.color = '#e74c3c';
            errorDiv.style.fontSize = '12px';
            errorDiv.style.marginTop = '5px';
            errorDiv.style.display = 'flex';
            errorDiv.style.alignItems = 'center';
            errorDiv.style.gap = '5px';
            errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${errorMessage}`;
            formGroup.appendChild(errorDiv);
        } else {
            // Add success styling
            if (element.value.trim()) {
                element.style.borderColor = 'rgba(76, 175, 80, 0.5)';
                element.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
            }
        }
    }
    
    function clearFieldError(element) {
        element.style.borderColor = '';
        element.style.boxShadow = '';
        const formGroup = element.closest('.form-group');
        if (formGroup) {
            const error = formGroup.querySelector('.field-error');
            if (error) error.remove();
        }
    }
    
    function checkForChanges() {
        if (!originalFormData || !Object.keys(originalFormData).length) return;
        
        let hasChanges = false;
        const fieldMap = {
            firstName: 'firstName',
            lastName: 'lastName',
            email: 'profileEmail',
            dob: 'dob',
            phoneNumber: 'phoneNumber',
            location: 'location',
            timezone: 'timezone',
            dietaryPreferences: 'dietaryPreferences',
            basicIngredients: 'basicIngredients'
        };
        
        Object.keys(originalFormData).forEach(key => {
            const element = document.getElementById(fieldMap[key]);
            if (element && element.value !== originalFormData[key]) {
                hasChanges = true;
            }
        });
        
        // Add avatar change detection
        if (avatarFile) {
            hasChanges = true;
        }
        
        // Update UI based on changes
        const saveBtn = document.querySelector('.btn-save');
        const cancelBtn = document.querySelector('.btn-cancel');
        
        if (hasChanges) {
            if (saveBtn) {
                saveBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                saveBtn.style.transform = 'scale(1.02)';
            }
            if (cancelBtn) {
                cancelBtn.style.opacity = '1';
                cancelBtn.style.pointerEvents = 'auto';
            }
        } else {
            if (saveBtn) {
                saveBtn.style.background = '';
                saveBtn.style.transform = '';
            }
            if (cancelBtn) {
                cancelBtn.style.opacity = '0.7';
                cancelBtn.style.pointerEvents = 'none';
            }
        }
    }
    
    // Initialize form validation after DOM is loaded
    setTimeout(setupFormValidation, 500);

    // Initialize the page
    loadUserDataFromBackend();
});