// ChopSmo Verification Badge Integration Utility
// This utility adds verification badges and status to profiles across the app

class VerificationBadgeUtil {
    constructor(baseUrl = 'https://njoya.pythonanywhere.com') {
        this.baseUrl = baseUrl;
        this.authToken = this.getAuthToken();
        this.verificationCache = new Map();
        this.cacheExpiration = 5 * 60 * 1000; // 5 minutes
    }

    // Get auth token from storage
    getAuthToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    // Get authorization headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.authToken) {
            headers['Authorization'] = this.authToken.startsWith('Token ') 
                ? this.authToken 
                : `Token ${this.authToken}`;
        }

        return headers;
    }

    // Check if cache is valid
    isCacheValid(cacheEntry) {
        if (!cacheEntry) return false;
        return Date.now() - cacheEntry.timestamp < this.cacheExpiration;
    }

    // Get verification status with caching
    async getVerificationStatus(userId = null) {
        const cacheKey = userId || 'current-user';
        const cached = this.verificationCache.get(cacheKey);

        if (this.isCacheValid(cached)) {
            return cached.data;
        }

        try {
            // First check user profile for existing verification flags
            let profileData = null;
            if (!userId) {
                // For current user, check their profile first
                try {
                    const profileResponse = await fetch(`${this.baseUrl}/api/users/profile/`, {
                        headers: this.getHeaders()
                    });
                    if (profileResponse.ok) {
                        profileData = await profileResponse.json();
                        
                        // Check if user is already verified through existing flags
                        if (profileData.is_verified || profileData.verified || profileData.is_staff || profileData.is_superuser) {
                            const verificationData = { 
                                status: 'approved', 
                                is_verified: true,
                                application: {
                                    business_name: profileData.business_name || 'Verified User',
                                    business_license: 'Legacy Verification',
                                    created_at: profileData.date_joined || new Date().toISOString()
                                }
                            };
                            
                            // Cache the result
                            this.verificationCache.set(cacheKey, {
                                data: verificationData,
                                timestamp: Date.now()
                            });
                            
                            return verificationData;
                        }
                    }
                } catch (profileError) {
                    console.warn('⚠️ Could not fetch profile data:', profileError);
                }
            }

            // Then check verification endpoint
            let url = `${this.baseUrl}/api/verification/status/`;
            if (userId) {
                url += `?user_id=${userId}`;
            }

            const response = await fetch(url, {
                headers: this.getHeaders()
            });

            let verificationData = { status: 'not_applied', is_verified: false };

            if (response.ok) {
                verificationData = await response.json();
            } else if (response.status === 404) {
                // No verification application found, but user might still be verified in profile
                if (profileData && (profileData.is_verified || profileData.verified)) {
                    verificationData = { 
                        status: 'approved', 
                        is_verified: true,
                        application: {
                            business_name: 'Verified User',
                            business_license: 'Legacy Verification'
                        }
                    };
                } else {
                    verificationData = { status: 'not_applied', is_verified: false };
                }
            }

            // Cache the result
            this.verificationCache.set(cacheKey, {
                data: verificationData,
                timestamp: Date.now()
            });

            return verificationData;

        } catch (error) {
            console.warn('⚠️ Could not fetch verification status:', error);
            return { status: 'error', is_verified: false };
        }
    }

    // Create verification badge HTML
    createVerificationBadge(verificationData, size = 'default') {
        if (!verificationData.is_verified && verificationData.status !== 'approved') {
            return '';
        }

        const sizeClasses = {
            small: 'verification-badge-small',
            default: 'verification-badge',
            large: 'verification-badge-large'
        };

        return `
            <span class="${sizeClasses[size]} verified" title="Verified Contributor">
                <i class="fas fa-certificate"></i>
            </span>
        `;
    }

    // Create verification status text
    createVerificationStatus(verificationData) {
        const statusConfig = {
            'not_applied': {
                text: 'Not Verified',
                class: 'status-not-applied',
                icon: 'fas fa-user-circle'
            },
            'pending': {
                text: 'Verification Pending',
                class: 'status-pending',
                icon: 'fas fa-clock'
            },
            'approved': {
                text: 'Verified Contributor',
                class: 'status-verified',
                icon: 'fas fa-certificate'
            },
            'rejected': {
                text: 'Verification Rejected',
                class: 'status-rejected',
                icon: 'fas fa-times-circle'
            },
            'error': {
                text: 'Status Unknown',
                class: 'status-error',
                icon: 'fas fa-question-circle'
            }
        };

        const config = statusConfig[verificationData.status] || statusConfig.error;

        return `
            <span class="verification-status ${config.class}">
                <i class="${config.icon}"></i>
                ${config.text}
            </span>
        `;
    }

    // Add verification badge to profile header
    async addBadgeToProfileHeader() {
        try {
            const userNameElement = document.getElementById('userName');
            if (!userNameElement) return;

            const verificationData = await this.getVerificationStatus();
            
            // Remove any existing badges
            const existingBadge = userNameElement.querySelector('.verification-badge');
            if (existingBadge) {
                existingBadge.remove();
            }

            if (verificationData.is_verified || verificationData.status === 'approved') {
                const badge = this.createVerificationBadge(verificationData, 'default');
                userNameElement.insertAdjacentHTML('beforeend', ' ' + badge);
            }

        } catch (error) {
            console.warn('⚠️ Could not add verification badge to profile header:', error);
        }
    }

    // Add verification status to profile sidebar
    async addStatusToProfileSidebar() {
        try {
            const userInfoElement = document.querySelector('.user-info');
            if (!userInfoElement) return;

            const verificationData = await this.getVerificationStatus();
            
            // Remove any existing status
            const existingStatus = userInfoElement.querySelector('.verification-section');
            if (existingStatus) {
                existingStatus.remove();
            }

            // Add verification section
            const statusHTML = `
                <div class="verification-section">
                    ${this.createVerificationStatus(verificationData)}
                    ${verificationData.status === 'not_applied' ? `
                        <a href="verification.html" class="verification-action-link">
                            <i class="fas fa-arrow-right"></i>
                            Apply for Verification
                        </a>
                    ` : verificationData.status === 'pending' ? `
                        <a href="verification.html" class="verification-action-link">
                            <i class="fas fa-eye"></i>
                            View Application
                        </a>
                    ` : ''}
                </div>
            `;

            userInfoElement.insertAdjacentHTML('beforeend', statusHTML);

        } catch (error) {
            console.warn('⚠️ Could not add verification status to profile sidebar:', error);
        }
    }

    // Add verification badge to recipe cards (for recipe authors)
    async addBadgeToRecipeCard(recipeElement, authorUserId) {
        try {
            const authorElement = recipeElement.querySelector('.recipe-author, .author-name');
            if (!authorElement || !authorUserId) return;

            const verificationData = await this.getVerificationStatus(authorUserId);
            
            // Remove any existing badges
            const existingBadge = authorElement.querySelector('.verification-badge');
            if (existingBadge) {
                existingBadge.remove();
            }

            if (verificationData.is_verified || verificationData.status === 'approved') {
                const badge = this.createVerificationBadge(verificationData, 'small');
                authorElement.insertAdjacentHTML('beforeend', ' ' + badge);
            }

        } catch (error) {
            console.warn('⚠️ Could not add verification badge to recipe card:', error);
        }
    }

    // Add verification link to navigation menu
    addVerificationLinkToNavigation() {
        try {
            // Check if user is logged in
            if (!this.authToken) return;

            // Add to desktop navigation
            const desktopNavLinks = document.querySelector('header .nav-links');
            if (desktopNavLinks && !desktopNavLinks.querySelector('a[href="verification.html"]')) {
                const verificationLink = document.createElement('li');
                verificationLink.innerHTML = '<a href="verification.html">Verification</a>';
                desktopNavLinks.appendChild(verificationLink);
            }

            // Add to mobile navigation if it exists
            const mobileNavLinks = document.querySelector('.mobile-nav-links');
            if (mobileNavLinks && !mobileNavLinks.querySelector('a[href="verification.html"]')) {
                const verificationLink = document.createElement('li');
                verificationLink.innerHTML = '<a href="verification.html"><i class="fas fa-certificate"></i> Verification</a>';
                mobileNavLinks.appendChild(verificationLink);
            }

        } catch (error) {
            console.warn('⚠️ Could not add verification link to navigation:', error);
        }
    }

    // Initialize verification integration on current page
    async initializeOnCurrentPage() {
        try {
            const currentPage = window.location.pathname.split('/').pop();

            switch (currentPage) {
                case 'Profile.html':
                case 'Profile_new.html':
                    await this.addBadgeToProfileHeader();
                    await this.addStatusToProfileSidebar();
                    break;

                case 'Recipes.html':
                    // Will be called individually for each recipe card
                    this.observeRecipeCards();
                    break;

                case 'DashBoard.html':
                    await this.addBadgeToProfileHeader();
                    await this.addDashboardVerificationCard();
                    break;
            }

            // Add navigation link on all pages (if logged in)
            this.addVerificationLinkToNavigation();

        } catch (error) {
            console.warn('⚠️ Error initializing verification integration:', error);
        }
    }

    // Observe recipe cards for dynamic loading
    observeRecipeCards() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const recipeCards = node.querySelectorAll?.('.recipe-card') || 
                                           (node.classList?.contains('recipe-card') ? [node] : []);
                        
                        recipeCards.forEach(card => {
                            const authorUserId = card.dataset.authorId;
                            if (authorUserId) {
                                this.addBadgeToRecipeCard(card, authorUserId);
                            }
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Also check existing recipe cards
        document.querySelectorAll('.recipe-card').forEach(card => {
            const authorUserId = card.dataset.authorId;
            if (authorUserId) {
                this.addBadgeToRecipeCard(card, authorUserId);
            }
        });
    }

    // Add verification card to dashboard
    async addDashboardVerificationCard() {
        try {
            const verificationData = await this.getVerificationStatus();
            const dashboardGrid = document.querySelector('.dashboard-grid, .action-cards');
            
            if (!dashboardGrid) return;

            // Remove existing verification card
            const existingCard = dashboardGrid.querySelector('.verification-dashboard-card');
            if (existingCard) {
                existingCard.remove();
            }

            let cardHTML = '';

            if (verificationData.status === 'not_applied') {
                cardHTML = `
                    <div class="verification-dashboard-card action-card">
                        <a href="verification.html">
                            <div class="card-icon">
                                <i class="fas fa-certificate"></i>
                            </div>
                            <h3>Get Verified</h3>
                            <p>Become a verified contributor and boost your recipe visibility</p>
                        </a>
                    </div>
                `;
            } else if (verificationData.status === 'pending') {
                cardHTML = `
                    <div class="verification-dashboard-card action-card">
                        <a href="verification.html">
                            <div class="card-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <h3>Verification Pending</h3>
                            <p>Your verification application is under review</p>
                        </a>
                    </div>
                `;
            } else if (verificationData.status === 'approved') {
                cardHTML = `
                    <div class="verification-dashboard-card action-card verified-status">
                        <a href="verification.html">
                            <div class="card-icon">
                                <i class="fas fa-certificate"></i>
                            </div>
                            <h3>Verified Contributor</h3>
                            <p>You are a verified contributor! View your verification status</p>
                        </a>
                    </div>
                `;
            }

            if (cardHTML) {
                dashboardGrid.insertAdjacentHTML('beforeend', cardHTML);
            }

        } catch (error) {
            console.warn('⚠️ Could not add verification card to dashboard:', error);
        }
    }

    // Clear verification cache
    clearCache() {
        this.verificationCache.clear();
    }

    // Refresh verification status (clear cache and reload)
    async refreshVerificationStatus() {
        this.clearCache();
        await this.initializeOnCurrentPage();
    }
}

// Global verification badge utility instance
let verificationBadgeUtil;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit longer to ensure other scripts have loaded
    setTimeout(() => {
        if (!window.verificationBadgeUtil) {
            verificationBadgeUtil = new VerificationBadgeUtil();
            window.verificationBadgeUtil = verificationBadgeUtil;
            
            console.log('🔧 Verification badge utility initialized');
            
            // Initialize on current page after a delay to ensure DOM is ready
            setTimeout(() => {
                verificationBadgeUtil.initializeOnCurrentPage();
            }, 1000);
        }
    }, 500);
});

// Also try to initialize on window load as backup
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.verificationBadgeUtil) {
            window.verificationBadgeUtil.initializeOnCurrentPage();
        }
    }, 1000);
});

// Expose utility globally for other scripts
window.verificationBadgeUtil = verificationBadgeUtil;
