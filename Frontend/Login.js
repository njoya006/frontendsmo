document.addEventListener('DOMContentLoaded', function () {
    console.log('ChopSmo Login Page Loaded');
    
    const resolveLoginApiBaseUrl = () => {
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
    return 'https://api.chopsmo.site';
    };

    const LOGIN_API_BASE_URL = resolveLoginApiBaseUrl();
    const NORMALIZED_LOGIN_API_BASE = LOGIN_API_BASE_URL.replace(/\/$/, '');
    const LOGIN_ENDPOINT = (typeof window !== 'undefined' && typeof window.buildChopsmoApiUrl === 'function')
        ? window.buildChopsmoApiUrl('/api/users/login/')
        : `${NORMALIZED_LOGIN_API_BASE}/api/users/login/`;

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const toast = document.getElementById('toast');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const passwordToggle = document.getElementById('passwordToggle');

    // Input validation patterns
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const minPasswordLength = 6;

    // Add input event listeners for real-time validation
    emailInput.addEventListener('input', function() {
        validateEmail(this.value, false);
    });

    passwordInput.addEventListener('input', function() {
        validatePassword(this.value, false);
    });

    // Email validation
    function validateEmail(email, showError = true) {
        if (!email) {
            if (showError) {
                emailError.textContent = 'Email is required.';
                emailError.style.display = 'block';
            }
            return false;
        }
        if (!emailRegex.test(email)) {
            if (showError) {
                emailError.textContent = 'Please enter a valid email address.';
                emailError.style.display = 'block';
            }
            return false;
        }
        emailError.style.display = 'none';
        return true;
    }

    // Password validation
    function validatePassword(password, showError = true) {
        if (!password) {
            if (showError) {
                passwordError.textContent = 'Password is required.';
                passwordError.style.display = 'block';
            }
            return false;
        }
        if (password.length < minPasswordLength) {
            if (showError) {
                passwordError.textContent = `Password must be at least ${minPasswordLength} characters long.`;
                passwordError.style.display = 'block';
            }
            return false;
        }
        passwordError.style.display = 'none';
        return true;
    }

    // Enhanced show/hide password with smooth transition
    passwordToggle.addEventListener('click', function () {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        passwordToggle.innerHTML = `<i class="fas fa-${type === 'password' ? 'eye' : 'eye-slash'}"></i>`;
        passwordToggle.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
        
        // Add visual feedback
        passwordToggle.style.transform = 'scale(0.9)';
        setTimeout(() => {
            passwordToggle.style.transform = 'scale(1)';
        }, 150);
    });

    // Enhanced toast notification with auto-dismiss and better styling
    function showToast(message, type = '') {
        toast.textContent = message;
        toast.className = 'toast ' + type;
        toast.style.display = 'block';
        
        // Add entrance animation
        toast.style.transform = 'translateX(100px)';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);
        
        // Auto-dismiss
        setTimeout(() => { 
            toast.style.transform = 'translateX(100px)';
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 300);
        }, 3500);
    }

    // Enhanced loading state with button text change
    function setLoading(isLoading) {
        loadingSpinner.style.display = isLoading ? 'flex' : 'none';
        loginButton.disabled = isLoading;
        
        if (isLoading) {
            loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            loginButton.style.cursor = 'not-allowed';
        } else {
            loginButton.innerHTML = 'Log In';
            loginButton.style.cursor = 'pointer';
        }
    }

    // Clear error messages with animation
    function clearErrors() {
        [emailError, passwordError].forEach(error => {
            if (error.style.display === 'block') {
                error.style.opacity = '0';
                setTimeout(() => {
                    error.style.display = 'none';
                    error.textContent = '';
                    error.style.opacity = '1';
                }, 200);
            }
        });
    }

    // Add form shake animation on validation error
    function shakeForm() {
        loginForm.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            loginForm.style.animation = '';
        }, 500);
    }

    // Enhanced form submission with multiple fallback strategies
    // Helper to read cookies by name
    function getCookie(name) {
        if (typeof document === 'undefined' || !document.cookie) return null;
        const match = document.cookie.match(new RegExp('(^|; )' + name.replace(/([.$?*|{}()\[\]\\/+^])/g,'\\$1') + '=([^;]*)'));
        return match ? decodeURIComponent(match[2]) : null;
    }

    // Create a small debug pane to show server responses (visible on mobile when failures occur)
    const debugPane = document.createElement('pre');
    debugPane.id = 'loginDebugPane';
    debugPane.style.display = 'none';
    debugPane.style.position = 'fixed';
    debugPane.style.bottom = '10px';
    debugPane.style.left = '10px';
    debugPane.style.right = '10px';
    debugPane.style.maxHeight = '40vh';
    debugPane.style.overflow = 'auto';
    debugPane.style.background = 'rgba(0,0,0,0.8)';
    debugPane.style.color = '#fff';
    debugPane.style.padding = '12px';
    debugPane.style.zIndex = 99999;
    debugPane.style.fontSize = '12px';
    document.body.appendChild(debugPane);

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        clearErrors();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validate inputs
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        
        if (!isEmailValid || !isPasswordValid) {
            shakeForm();
            return;
        }

        setLoading(true);

            try {
            console.log('Attempting login...');
            
            // First try with standard headers and credentials
            let response;
            try {
                    // Build headers and include CSRF token when using credentials
                    const headersWithCsrf = {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    };
                    const csrfToken = getCookie('csrftoken') || getCookie('CSRF-TOKEN') || null;
                    if (csrfToken) headersWithCsrf['X-CSRFToken'] = csrfToken;

                    response = await fetch(LOGIN_ENDPOINT, {
                        method: 'POST',
                        credentials: 'include',  // Important for cookies/sessions
                        headers: headersWithCsrf,
                        body: JSON.stringify({ email, password })
                    });
            } catch (corsError) {
                console.log('CORS error detected, trying fallback approach...');
                // Fallback: try without credentials for CORS-restricted environments
                    response = await fetch(LOGIN_ENDPOINT, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ email, password })
                    });
            }
            
            console.log('Response status:', response.status);
            
            const data = await response.json();
            if (response.ok) {
                // Store the authentication token (accept multiple possible fields)
                const rawToken = data.token || data.key || data.auth_token || data.access || null;
                if (rawToken) {
                    const normalized = rawToken.startsWith('Token ') ? rawToken : `Token ${rawToken}`;
                    localStorage.setItem('authToken', normalized);
                    console.log('Authentication token stored successfully');
                } else {
                    console.warn('No token-like field received in login response:', data);
                }
                
                showToast('Login successful! Redirecting...', 'success');
                
                // Enhanced success animation
                const container = document.querySelector('.container');
                const body = document.body;
                
                // Add success visual feedback
                loginButton.innerHTML = '<i class="fas fa-check"></i> Success!';
                loginButton.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                
                setTimeout(() => {
                    container.style.transition = 'all 0.7s cubic-bezier(0.23, 1, 0.32, 1)';
                    body.style.transition = 'all 0.7s cubic-bezier(0.23, 1, 0.32, 1)';
                    container.style.opacity = '0';
                    container.style.transform = 'scale(0.95)';
                    body.style.opacity = '0';
                }, 800);
                
                setTimeout(() => {
                    window.location.href = 'DashBoard.html';
                }, 1600);
                
            } else {
                // Handle specific error cases
                let errorMessage = 'Login failed. Please check your credentials.';
                
                if (response.status === 401) {
                    errorMessage = 'Invalid email or password. Please try again.';
                } else if (response.status === 429) {
                    errorMessage = 'Too many login attempts. Please try again later.';
                } else if (data.detail) {
                    errorMessage = data.detail;
                } else if (data.message) {
                    errorMessage = data.message;
                }
                
                showToast(errorMessage, 'error');
                shakeForm();
            }
            } catch (err) {
            console.error('Login error:', err);
            
            let errorMessage = 'Connection failed.';
            
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                if (err.message.includes('CORS') || window.location.hostname.includes('vercel.app')) {
                    errorMessage = '🔧 Backend Configuration Issue: The server needs to be updated to allow login from this website. Please contact support or try again later.';
                } else {
                    errorMessage = 'Network connection failed. Please check your internet connection.';
                }
            }
            
            showToast(errorMessage, 'error');
            shakeForm();
                // Show debug pane when there's an error
                try {
                    debugPane.style.display = 'block';
                    debugPane.textContent = 'Error: ' + (err && err.message ? err.message : JSON.stringify(err));
                } catch (dE) {
                    console.warn('Failed to show debug pane', dE);
                }
            } finally {
            setLoading(false);
        }
    });

    // Add keyboard shortcut (Enter) for better UX
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !loginButton.disabled) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });

    // Add focus management for better accessibility
    emailInput.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });

    emailInput.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });

    passwordInput.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });

    passwordInput.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });
});