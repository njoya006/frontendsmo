/**
 * ChopSmo Mobile Navigation System
 * Provides responsive mobile menu functionality across all pages
 */

class MobileNavigation {
    constructor() {
        this.mobileMenuBtn = null;
        this.mobileMenu = null;
        this.mobileMenuOverlay = null;
        this.isMenuOpen = false;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.createMobileMenu();
        this.bindEvents();
        this.updateAuthState();
        this.setActiveNavItem();
    }

    createMobileMenu() {
        // Check if mobile menu already exists
        if (document.querySelector('.mobile-menu')) {
            this.bindExistingElements();
            return;
        }

        // Create mobile menu overlay
        this.mobileMenuOverlay = document.createElement('div');
        this.mobileMenuOverlay.className = 'mobile-menu-overlay';
        document.body.appendChild(this.mobileMenuOverlay);

        // Create mobile menu
        this.mobileMenu = document.createElement('div');
        this.mobileMenu.className = 'mobile-menu';
        
        // Get current page info for user state
        const isLoggedIn = this.checkLoginState();
        const currentUser = this.getCurrentUser();
        
        this.mobileMenu.innerHTML = `
            <button class="mobile-menu-close">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="mobile-menu-header">
                <div class="logo">
                    <a href="index.html">
                        <i class="fas fa-utensils"></i>
                        <span>ChopSmo</span>
                    </a>
                </div>
            </div>

            <ul class="mobile-nav-links">
                <li><a href="index.html"><i class="fas fa-home"></i> Home</a></li>
                ${isLoggedIn ? `
                    <li><a href="DashBoard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a></li>
                    <li><a href="Recipes.html"><i class="fas fa-book-open"></i> Recipes</a></li>
                    <li><a href="MealPlans.html"><i class="fas fa-calendar-alt"></i> Meal Plans</a></li>
                    <li><a href="MealSuggestion.html"><i class="fas fa-lightbulb"></i> Suggestions</a></li>
                    <li><a href="Profile.html"><i class="fas fa-user"></i> Profile</a></li>
                ` : `
                    <li><a href="Recipes.html"><i class="fas fa-book-open"></i> Recipes</a></li>
                    <li><a href="About.html"><i class="fas fa-info-circle"></i> About</a></li>
                    <li><a href="Contact.html"><i class="fas fa-envelope"></i> Contact</a></li>
                    <li><a href="FAQ.html"><i class="fas fa-question-circle"></i> FAQ</a></li>
                `}
            </ul>

            <div class="mobile-auth-section">
                ${isLoggedIn ? `
                    <div class="mobile-user-info">
                        <div class="mobile-user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="mobile-user-details">
                            <h4>${currentUser.name || 'User'}</h4>
                            <p>${currentUser.email || 'Welcome back!'}</p>
                        </div>
                    </div>
                    <div class="mobile-auth-buttons">
                        <button id="mobileLogoutBtn" class="btn btn-outline">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                ` : `
                    <div class="mobile-auth-buttons">
                        <a href="Login.html" class="btn btn-outline">
                            <i class="fas fa-sign-in-alt"></i> Login
                        </a>
                        <a href="SignUp.html" class="btn btn-primary">
                            <i class="fas fa-user-plus"></i> Sign Up
                        </a>
                    </div>
                `}
            </div>
        `;

        document.body.appendChild(this.mobileMenu);
        this.bindExistingElements();
    }

    bindExistingElements() {
        this.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        this.mobileMenu = document.querySelector('.mobile-menu');
        this.mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    }

    bindEvents() {
        // Mobile menu button click
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleMenu());
        }

        // Close menu overlay click
        if (this.mobileMenuOverlay) {
            this.mobileMenuOverlay.addEventListener('click', () => this.closeMenu());
        }

        // Close button click
        const closeBtn = document.querySelector('.mobile-menu-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeMenu());
        }

        // Handle mobile logout
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Close menu when clicking nav links
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                setTimeout(() => this.closeMenu(), 150);
            });
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMenu();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isMenuOpen) {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.isMenuOpen = true;
        document.body.style.overflow = 'hidden';
        
        if (this.mobileMenuOverlay) {
            this.mobileMenuOverlay.classList.add('active');
        }
        
        if (this.mobileMenu) {
            this.mobileMenu.classList.add('active');
        }
        
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.classList.add('active');
        }

        // Animate menu items
        const menuItems = document.querySelectorAll('.mobile-nav-links li');
        menuItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(20px)';
            setTimeout(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 50);
        });
    }

    closeMenu() {
        this.isMenuOpen = false;
        document.body.style.overflow = '';
        
        if (this.mobileMenuOverlay) {
            this.mobileMenuOverlay.classList.remove('active');
        }
        
        if (this.mobileMenu) {
            this.mobileMenu.classList.remove('active');
        }
        
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.classList.remove('active');
        }
    }

    checkLoginState() {
        // Check multiple sources for login state
        const token = localStorage.getItem('token') || sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
        
        return !!(token || userData || isLoggedIn);
    }

    getCurrentUser() {
        try {
            const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
            if (userData) {
                return JSON.parse(userData);
            }
            
            // Fallback user info
            return {
                name: localStorage.getItem('userName') || 'User',
                email: localStorage.getItem('userEmail') || ''
            };
        } catch (error) {
            console.log('Error parsing user data:', error);
            return { name: 'User', email: '' };
        }
    }

    updateAuthState() {
        // This method can be called to refresh the menu when auth state changes
        const authSection = document.querySelector('.mobile-auth-section');
        if (authSection) {
            const isLoggedIn = this.checkLoginState();
            const currentUser = this.getCurrentUser();
            
            if (isLoggedIn) {
                authSection.innerHTML = `
                    <div class="mobile-user-info">
                        <div class="mobile-user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="mobile-user-details">
                            <h4>${currentUser.name || 'User'}</h4>
                            <p>${currentUser.email || 'Welcome back!'}</p>
                        </div>
                    </div>
                    <div class="mobile-auth-buttons">
                        <button id="mobileLogoutBtn" class="btn btn-outline">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                `;
                
                // Re-bind logout event
                const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
                if (mobileLogoutBtn) {
                    mobileLogoutBtn.addEventListener('click', () => this.handleLogout());
                }
            } else {
                authSection.innerHTML = `
                    <div class="mobile-auth-buttons">
                        <a href="Login.html" class="btn btn-outline">
                            <i class="fas fa-sign-in-alt"></i> Login
                        </a>
                        <a href="SignUp.html" class="btn btn-primary">
                            <i class="fas fa-user-plus"></i> Sign Up
                        </a>
                    </div>
                `;
            }
        }
    }

    setActiveNavItem() {
        // Highlight current page in mobile nav
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.mobile-nav-links a');
        
        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href');
            if (linkPage === currentPage || 
                (currentPage === '' && linkPage === 'index.html') ||
                (currentPage === 'index.html' && linkPage === 'index.html')) {
                link.classList.add('active');
            }
        });
    }

    handleLogout() {
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('isLoggedIn');
        
        // Close menu and redirect
        this.closeMenu();
        
        // Show logout message
        if (typeof showNotification === 'function') {
            showNotification('You have been logged out successfully', 'success');
        }
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }
}

// Initialize mobile navigation when script loads
const mobileNav = new MobileNavigation();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileNavigation;
}

// Global access
window.MobileNavigation = MobileNavigation;
window.mobileNav = mobileNav;
