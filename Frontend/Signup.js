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
                const response = await fetch(`${API_BASE_URL}api/users/register/`, {
                    method: 'POST',
                    credentials: 'include',  // Important for cookies/sessions
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: name, // changed from 'name' to 'username'
                        email: email,
                        password: password
                    })
                });

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
                let errorMessage = 'Network error. Please try again later.';
                
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    if (error.message.includes('CORS') || window.location.hostname.includes('vercel.app')) {
                        errorMessage = 'CORS Error: Backend server needs to allow requests from this domain. Please contact the administrator to add "' + window.location.origin + '" to the CORS allowed origins.';
                    } else {
                        errorMessage = 'Network connection failed. Please check your internet connection.';
                    }
                }
                
                alert(errorMessage);
                console.error(error);
            }
        })();
    });

    // Social Login Buttons (placeholder functionality)
    document.querySelector('.btn-google').addEventListener('click', function(e) {
        e.preventDefault();
        alert('Google login would be implemented here');
    });
});