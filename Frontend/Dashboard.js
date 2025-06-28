document.addEventListener('DOMContentLoaded', function() {
    // Initialize verification badge
    if (typeof initializeVerificationBadge === 'function') {
        initializeVerificationBadge();
    }

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
        // Clear authentication data
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        sessionStorage.removeItem('userData');
        localStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        
        // Redirect to home page
        window.location.href = 'index.html';
    });

    // Load User Data from backend
    async function loadUserDataFromBackend() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('You are not logged in.');
            window.location.href = 'Login.html';
            return;
        }
        try {
            const response = await fetch('https://njoya.pythonanywhere.com/api/users/profile/', {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin' // Always send cookies for session auth if present
            });
            const data = await response.json();
            if (!response.ok) {
                let errorMsg = 'Failed to load profile.';
                if (data.detail) {
                    errorMsg = data.detail;
                } else if (data.message) {
                    errorMsg = data.message;
                } else if (typeof data === 'object') {
                    errorMsg = JSON.stringify(data);
                }
                alert(errorMsg);
                if (response.status === 401) {
                    localStorage.removeItem('authToken');
                    window.location.href = 'Login.html';
                }
                return;
            }
            // Display user data
            if (document.getElementById('userName')) document.getElementById('userName').textContent = data.username || '';
            if (document.getElementById('userEmail')) document.getElementById('userEmail').textContent = data.email || '';
            if (document.getElementById('firstName')) document.getElementById('firstName').value = data.first_name || '';
            if (document.getElementById('lastName')) document.getElementById('lastName').value = data.last_name || '';
            if (document.getElementById('profileEmail')) document.getElementById('profileEmail').value = data.email || '';
        } catch (error) {
            alert('Network error. Please try again later.');
            console.error(error);
        }
    }

    // Only fetch user data after DOM is ready and token is present
    function waitForTokenAndLoadUserData(retries = 10) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            if (retries > 0) {
                setTimeout(() => waitForTokenAndLoadUserData(retries - 1), 100);
            } else {
                alert('You are not logged in.');
                window.location.href = 'Login.html';
            }
            return;
        }
        loadUserDataFromBackend();
    }
    waitForTokenAndLoadUserData();
});