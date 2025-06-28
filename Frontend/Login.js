document.addEventListener('DOMContentLoaded', function () {
    // Debug information
    console.log('ChopSmo Login Page Loaded');
    console.log('Current URL:', window.location.href);
    console.log('User Agent:', navigator.userAgent);
    console.log('Online status:', navigator.onLine);
    
    // Create inline debug console for production debugging
    if (window.location.hostname.includes('vercel.app')) {
        const debugConsole = document.createElement('div');
        debugConsole.id = 'debug-console';
        debugConsole.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 300px;
            max-height: 200px;
            background: rgba(0,0,0,0.9);
            color: #00ff00;
            font-family: monospace;
            font-size: 11px;
            padding: 10px;
            border-radius: 5px;
            overflow-y: auto;
            z-index: 10000;
            display: none;
        `;
        document.body.appendChild(debugConsole);
        
        // Debug toggle button
        const debugToggle = document.createElement('button');
        debugToggle.textContent = '🐛';
        debugToggle.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 320px;
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            z-index: 10001;
        `;
        debugToggle.onclick = () => {
            debugConsole.style.display = debugConsole.style.display === 'none' ? 'block' : 'none';
        };
        document.body.appendChild(debugToggle);
        
        // Custom console log function
        window.debugLog = function(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.style.color = type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#00ff00';
            logEntry.textContent = `[${timestamp}] ${message}`;
            debugConsole.appendChild(logEntry);
            debugConsole.scrollTop = debugConsole.scrollHeight;
            console.log(message);
        };
        
        debugLog('Debug console initialized');
        debugLog(`Domain: ${window.location.hostname}`);
        debugLog(`Online: ${navigator.onLine}`);
    }
    
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

        // Try multiple request strategies with specific focus on Vercel hosting
        const strategies = [
            {
                name: 'Standard Fetch',
                request: () => fetch('https://njoya.pythonanywhere.com/api/users/login/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                })
            },
            {
                name: 'CORS with Credentials',
                request: () => fetch('https://njoya.pythonanywhere.com/api/users/login/', {
                    method: 'POST',
                    mode: 'cors',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                })
            },
            {
                name: 'No-CORS Mode',
                request: async () => {
                    // For no-cors mode, we can't read the response, so we use XMLHttpRequest
                    return new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', 'https://njoya.pythonanywhere.com/api/users/login/', true);
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        
                        xhr.onload = function() {
                            try {
                                const response = {
                                    ok: xhr.status >= 200 && xhr.status < 300,
                                    status: xhr.status,
                                    headers: {
                                        get: (name) => xhr.getResponseHeader(name)
                                    },
                                    text: () => Promise.resolve(xhr.responseText)
                                };
                                resolve(response);
                            } catch (e) {
                                reject(new Error('Response error: ' + e.message));
                            }
                        };
                        
                        xhr.onerror = () => reject(new Error('Network error'));
                        xhr.ontimeout = () => reject(new Error('Timeout'));
                        xhr.timeout = 15000;
                        
                        xhr.send(JSON.stringify({ email, password }));
                    });
                }
            }
        ];

        let lastError = null;
        let response = null;
        let data = null;

        // Try each strategy until one works
        for (const strategy of strategies) {
            try {
                const logMsg = `Attempting ${strategy.name}...`;
                console.log(logMsg);
                if (window.debugLog) window.debugLog(logMsg);
                
                console.log('Request payload:', { email, password: '***' });
                
                response = await strategy.request();
                
                const statusMsg = `${strategy.name} - Status: ${response.status}`;
                console.log(statusMsg);
                if (window.debugLog) window.debugLog(statusMsg, response.status < 400 ? 'success' : 'error');
                
                if (response.headers && response.headers.entries) {
                    console.log(`${strategy.name} - Response headers:`, [...response.headers.entries()]);
                }
                
                // Check content type before parsing JSON
                const contentType = response.headers ? response.headers.get('content-type') : 'unknown';
                console.log(`${strategy.name} - Content-Type: ${contentType}`);
                if (window.debugLog) window.debugLog(`Content-Type: ${contentType}`);
                
                // Get response text first to see what we're dealing with
                const responseText = await response.text();
                console.log(`${strategy.name} - Raw response:`, responseText.substring(0, 200) + '...');
                if (window.debugLog) window.debugLog(`Raw response: ${responseText.substring(0, 100)}...`);
                
                // Try to parse as JSON only if it looks like JSON
                if (contentType && contentType.includes('application/json') && responseText.trim().startsWith('{')) {
                    data = JSON.parse(responseText);
                } else if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
                    // Might be JSON without proper content-type
                    try {
                        data = JSON.parse(responseText);
                    } catch (parseError) {
                        throw new Error(`Server returned HTML instead of JSON. Response: ${responseText.substring(0, 100)}...`);
                    }
                } else {
                    throw new Error(`Server error - received HTML instead of JSON. Status: ${response.status}`);
                }
                
                console.log(`${strategy.name} - Success!`);
                if (window.debugLog) window.debugLog(`${strategy.name} - Success!`, 'success');
                break; // Success, exit the loop
                
            } catch (err) {
                const errorMsg = `${strategy.name} failed: ${err.message}`;
                console.error(errorMsg);
                if (window.debugLog) window.debugLog(errorMsg, 'error');
                lastError = err;
                continue; // Try next strategy
            }
        }

        // If all strategies failed
        if (!response || !data) {
            const errorMsg = 'All login strategies failed';
            console.error(errorMsg, lastError);
            if (window.debugLog) window.debugLog(`${errorMsg}: ${lastError?.message}`, 'error');
            
            let errorMessage;
            if (lastError?.message.includes('HTML instead of JSON') || lastError?.message.includes('Server error')) {
                errorMessage = 'The server is experiencing issues. Please try again in a few minutes or contact support.';
            } else if (lastError?.name === 'TypeError' && lastError.message.includes('fetch')) {
                errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
            } else if (lastError?.name === 'AbortError') {
                errorMessage = 'Request timeout. Please try again.';
            } else if (lastError?.message.includes('CORS')) {
                errorMessage = 'Connection blocked by browser security. Please try refreshing the page.';
            } else {
                errorMessage = `Network error: ${lastError?.message || 'Unknown error'}. Please try again.`;
            }
            
            showToast(errorMessage, 'error');
            shakeForm();
            setLoading(false);
            return;
        }

        // Process the response
        try {
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
        } catch (dataError) {
            console.error('Error processing response data:', dataError);
            showToast('Invalid response from server. Please try again.', 'error');
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