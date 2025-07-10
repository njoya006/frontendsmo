const API_BASE_URL = 'https://njoya.pythonanywhere.com/';
document.addEventListener('DOMContentLoaded', function() {    // Mobile Menu Toggle (same as index.js)
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        authButtons.classList.toggle('active');
        this.querySelector('i').classList.toggle('fa-times');
    });

    // Password Strength Indicator
    const passwordInput = document.getElementById('password');
    const strengthBars = document.querySelectorAll('.strength-bar');
    const strengthText = document.querySelector('.strength-text');

    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        
        // Update visual indicator
        strengthBars.forEach((bar, index) => {
            bar.style.backgroundColor = index < strength ? getStrengthColor(strength) : '#eee';
        });
        
        // Update text
        const strengthMessages = ['Very Weak', 'Weak', 'Medium', 'Strong'];
        strengthText.textContent = strengthMessages[strength - 1] || '';
        strengthText.style.color = getStrengthColor(strength);
    });

    function calculatePasswordStrength(password) {
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        
        // Character type checks
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        // Cap at 4 for our UI (we have 4 bars)
        return Math.min(4, Math.floor(strength / 2));
    }

    function getStrengthColor(strength) {
        const colors = ['#ff4d4d', '#ffa64d', '#66b3ff', '#4CAF50'];
        return colors[strength - 1] || '#eee';
    }

    // Form Validation
    const signupForm = document.getElementById('signupForm');
    
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const terms = document.getElementById('terms').checked;

        // Simple validation
        if (!name || !email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (!terms) {
            alert('You must agree to the terms and conditions');
            return;
        }

        // Send data to backend
        (async () => {
            try {
                // Try using enhanced API first if available
                if (window.enhancedRecipeAPI && typeof window.enhancedRecipeAPI.register === 'function') {
                    console.log('Using enhanced API for registration');
                    const result = await window.enhancedRecipeAPI.register({
                        username: name,
                        email: email,
                        password: password
                    });
                    
                    if (result.success) {
                        // Success
                        signupForm.innerHTML = `
                            <div style="text-align: center; padding: 2rem;">
                                <div style="color: #4CAF50; font-size: 4rem; margin-bottom: 1rem;">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                                <h2 style="color: #4CAF50; margin-bottom: 1rem;">Registration Successful!</h2>
                                <p style="margin-bottom: 2rem;">Your account has been created successfully. You can now log in.</p>
                                <a href="Login.html" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                    <i class="fas fa-sign-in-alt"></i> Go to Login
                                </a>
                            </div>
                        `;
                        return;
                    } else {
                        // Handle specific error types
                        let errorMessage = 'Registration failed. Please try again.';
                        if (result.error === 'CORS_ERROR') {
                            errorMessage = 'Server configuration issue. Please try again later or contact support.';
                        } else if (result.error === 'NETWORK_ERROR') {
                            errorMessage = 'Network connection failed. Please check your internet connection.';
                        } else if (result.details) {
                            try {
                                const errorData = JSON.parse(result.details);
                                if (errorData.email) {
                                    errorMessage = 'Email already exists. Please use a different email.';
                                } else if (errorData.username) {
                                    errorMessage = 'Username already exists. Please choose a different username.';
                                }
                            } catch (e) {
                                // Use default error message
                            }
                        }
                        showError(errorMessage);
                        return;
                    }
                }
                
                // Fallback to direct fetch with improved CORS handling
                console.log('Using direct fetch for registration');
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                const response = await fetch(`${API_BASE_URL}api/users/register/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    signal: controller.signal,
                    credentials: 'omit', // Don't send credentials to avoid CORS issues
                    mode: 'cors',
                    body: JSON.stringify({
                        username: name, // changed from 'name' to 'username'
                        email: email,
                        password: password
                    })
                });
                
                clearTimeout(timeoutId);
                const data = await response.json();

                if (!response.ok) {
                    // Show full backend error message for easier debugging
                    let errorMsg = 'Registration failed. Please try again.';
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

                // Save token if present in response
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                }

                alert('Account created successfully! Redirecting to dashboard...');
                window.location.href = 'DashBoard.html';
            } catch (error) {
                console.error('Registration error:', error);
                
                let errorMessage = 'Network error. Please try again later.';
                
                // Handle specific error types
                if (error.name === 'AbortError') {
                    errorMessage = 'Registration request timed out. Please try again.';
                } else if (error.message.includes('CORS') || error.message.includes('Cross-Origin')) {
                    errorMessage = 'Server configuration issue. Please contact support.';
                    console.error('CORS Error - Backend needs CORS configuration for:', window.location.origin);
                } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    errorMessage = 'Network connection failed. Please check your internet connection.';
                } else if (error.message.includes('Failed to fetch')) {
                    errorMessage = 'Cannot reach server. Please check your connection or try again later.';
                }
                
                showError(errorMessage);
            }
        })();
    });

    // Social Login Buttons (placeholder functionality)
    document.querySelector('.btn-google').addEventListener('click', function(e) {
        e.preventDefault();
        alert('Google login would be implemented here');
    });
});