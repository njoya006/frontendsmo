/**
 * ChopSmo Mobile Navigation System
 * Only activates on mobile devices, doesn't interfere with desktop
 */

class MobileNavigation {
    constructor() {
        this.mobileMenuBtn = null;
        this.mobileMenu = null;
        this.mobileMenuOverlay = null;
        this.isMenuOpen = false;
        this.isMobile = false;
        this.init();
    }

    init() {
        // Only initialize on mobile devices
        this.checkIfMobile();
        
        console.log('Mobile Navigation Init - Screen width:', window.innerWidth, 'Is Mobile:', this.isMobile);
        
        if (!this.isMobile) {
            console.log('Desktop detected - mobile navigation disabled');
            return; // Don't initialize on desktop
        }

        console.log('Mobile detected - initializing mobile navigation');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    checkIfMobile() {
        // Primary check: screen size
        const isMobileScreen = window.innerWidth <= 768;
        
        // Secondary check: user agent for mobile devices
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Enhanced mobile detection including touch capability
        const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Use screen size as primary determinant
        this.isMobile = isMobileScreen;
        
        // Throttled resize handler for better performance
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const wasMobile = this.isMobile;
                this.isMobile = window.innerWidth <= 768;
                
                // If switching from mobile to desktop, clean up
                if (wasMobile && !this.isMobile) {
                    this.cleanupMobileMenu();
                }
                // If switching from desktop to mobile, initialize
                else if (!wasMobile && this.isMobile) {
                    this.setup();
                }
            }, 100); // Throttle resize events
        }, { passive: true });
    }

    setup() {
        if (!this.isMobile) return;
        
        console.log('Setting up mobile navigation...');
        this.findExistingElements();
        this.createMobileMenuIfNeeded();
        this.bindEvents();
        this.updateAuthState();
        this.setActiveNavItem();
        console.log('Mobile navigation setup complete');
    }

    findExistingElements() {
        this.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        
        console.log('Mobile menu button found:', !!this.mobileMenuBtn);
        
        // If there's no mobile menu button, we're probably on a page without proper header
        if (!this.mobileMenuBtn) {
            console.log('No mobile menu button found - page may not have header navigation');
            return;
        }
    }

    createMobileMenuIfNeeded() {
        // Only create if we have a mobile menu button and we're on mobile
        if (!this.mobileMenuBtn || !this.isMobile) return;

        // Check if mobile menu already exists
        if (document.querySelector('.mobile-menu')) {
            this.mobileMenu = document.querySelector('.mobile-menu');
            this.mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
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
                    <li><a href="verification.html"><i class="fas fa-badge-check"></i> Verification</a></li>
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
    }

    bindEvents() {
        if (!this.isMobile || !this.mobileMenuBtn) {
            console.log('bindEvents failed - isMobile:', this.isMobile, 'mobileMenuBtn:', !!this.mobileMenuBtn);
            return;
        }

        console.log('Binding mobile menu events...');

        // Mobile menu button click - Enhanced for touch
        const handleMenuToggle = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mobile menu button clicked!');
            this.toggleMenu();
        };

        this.mobileMenuBtn.addEventListener('click', handleMenuToggle);
        this.mobileMenuBtn.addEventListener('touchend', handleMenuToggle, { passive: false });

        console.log('Mobile menu button event listeners added (click + touch)');

        // Close menu overlay click
        if (this.mobileMenuOverlay) {
            this.mobileMenuOverlay.addEventListener('click', () => this.closeMenu());
        }

        // Close button click
        const closeBtn = this.mobileMenu?.querySelector('.mobile-menu-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeMenu());
        }

        // Handle mobile logout
        const mobileLogoutBtn = this.mobileMenu?.querySelector('#mobileLogoutBtn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Close menu when clicking nav links
        const mobileNavLinks = this.mobileMenu?.querySelectorAll('.mobile-nav-links a');
        if (mobileNavLinks) {
            mobileNavLinks.forEach(link => {
                link.addEventListener('click', () => {
                    setTimeout(() => this.closeMenu(), 150);
                });
            });
        }

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen && this.isMobile) {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        if (!this.isMobile) return;
        
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        if (!this.isMobile || !this.mobileMenu) return;
        
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
    }

    closeMenu() {
        if (!this.isMobile) return;
        
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

    cleanupMobileMenu() {
        // Remove mobile menu elements when switching to desktop
        if (this.mobileMenu) {
            this.mobileMenu.remove();
            this.mobileMenu = null;
        }
        if (this.mobileMenuOverlay) {
            this.mobileMenuOverlay.remove();
            this.mobileMenuOverlay = null;
        }
        
        // Reset body overflow
        document.body.style.overflow = '';
        this.isMenuOpen = false;
        
        // Remove active class from button
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.classList.remove('active');
        }
    }

    checkLoginState() {
    const token = window.getAuthToken && window.getAuthToken();
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
            
            return {
                name: localStorage.getItem('userName') || 'User',
                email: localStorage.getItem('userEmail') || ''
            };
        } catch (error) {
            return { name: 'User', email: '' };
        }
    }

    updateAuthState() {
        if (!this.isMobile || !this.mobileMenu) return;
        
        const authSection = this.mobileMenu.querySelector('.mobile-auth-section');
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
        if (!this.isMobile || !this.mobileMenu) return;
        
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = this.mobileMenu.querySelectorAll('.mobile-nav-links a');
        
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
        
        this.closeMenu();
        
        // Show logout message if function exists
        if (typeof showNotification === 'function') {
            showNotification('You have been logged out successfully', 'success');
        }
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }
}

// Initialize mobile navigation - let the class handle device detection
const mobileNav = new MobileNavigation();
window.mobileNav = mobileNav;
