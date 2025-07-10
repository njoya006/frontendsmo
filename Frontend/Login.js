document.addEventListener('DOMContentLoaded', function () {
    console.log('ChopSmo Login Page Loaded');
    
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
            
            const response = await fetch('https://njoya.pythonanywhere.com/api/users/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            console.log('Response status:', response.status);
            
            const data = await response.json();
            if (response.ok) {
                // Store the authentication token
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    console.log('Authentication token stored successfully');
                } else {
                    console.warn('No token received in login response:', data);
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
            
            let errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
            
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                errorMessage = 'Network connection failed. Please check your internet connection.';
            }
            
            showToast(errorMessage, 'error');
            shakeForm();
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