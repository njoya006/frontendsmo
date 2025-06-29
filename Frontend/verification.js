// ChopSmo User Verification System - Clean Working Version
// Handles verification applications, status checking, and admin review

class VerificationSystem {
    constructor() {
        this.baseUrl = 'https://njoya.pythonanywhere.com';
        this.authToken = this.getAuthToken();
        this.currentUser = null;
        this.isAdmin = false;
        this.lastVerificationStatus = null;
        this.verificationCheckInterval = null;
        
        this.init();
    }

    // Get auth token from storage with refresh capability
    getAuthToken() {
        // Refresh token from storage each time to catch login/logout changes
        this.authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        return this.authToken;
    }

    // Get authorization headers with fresh token
    getHeaders() {
        const token = this.getAuthToken(); // Get fresh token each time
        
        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = token.startsWith('Token ') 
                ? token 
                : `Token ${token}`;
        }

        return headers;
    }

    // Initialize the verification system
    async init() {
        console.log('🔧 Initializing Verification System...');
        
        // Check if user is logged in
        if (!this.authToken) {
            console.log('❌ No auth token found, redirecting to login');
            this.redirectToLogin();
            return;
        }

        console.log('✅ Auth token found, continuing initialization');

        try {
            // Load current user data and check admin status
            console.log('👤 Loading current user data...');
            await this.loadCurrentUser();
            
            // Initialize UI based on user status
            console.log('🎨 Initializing UI...');
            await this.initializeUI();
            
            // Set up event listeners
            console.log('🎯 Setting up event listeners...');
            this.setupEventListeners();

            // Start periodic verification checks
            this.startPeriodicVerificationCheck();
            
            console.log('✅ Verification system initialized successfully!');
            
        } catch (error) {
            console.error('❌ Error initializing verification system:', error);
            this.showToast('Failed to load verification system. Please try again.', 'error');
        }
    }

    // Load current user data
    async loadCurrentUser() {
        try {
            const response = await fetch(`${this.baseUrl}/api/users/profile/`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.currentUser = await response.json();
            this.isAdmin = this.currentUser.is_staff || this.currentUser.is_superuser || false;

            // Add debug log for badge
            console.log('🔖 verified_badge:', this.currentUser.verified_badge);
            // Update username and badge in the UI
            const userNameEl = document.getElementById('userName');
            if (userNameEl) {
                // Clear previous content
                userNameEl.innerHTML = '';
                // Add username
                const nameNode = document.createTextNode(this.currentUser.username || '');
                userNameEl.appendChild(nameNode);
                // Add badge if available
                if (this.currentUser.verified_badge) {
                    const badgeSpan = document.createElement('span');
                    badgeSpan.className = 'verified-badge';
                    badgeSpan.style.marginLeft = '8px';
                    badgeSpan.style.color = this.currentUser.verified_badge.color || '#2ecc40';
                    badgeSpan.innerHTML = `${this.currentUser.verified_badge.icon || '✅'} <span style="font-size:12px;vertical-align:middle;">${this.currentUser.verified_badge.label || ''}</span>`;
                    userNameEl.appendChild(badgeSpan);
                }
            }
            // Optionally update email
            const userEmailEl = document.getElementById('userEmail');
            if (userEmailEl) {
                userEmailEl.textContent = this.currentUser.email || '';
            }
            console.log('👤 Current user loaded:', this.currentUser.username);
            console.log('🔒 Admin status:', this.isAdmin);
            
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            throw error;
        }
    }

    // Fetch verification application status from backend
    async fetchVerificationStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/api/users/verification/status/`, {
                headers: this.getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch verification status');
            return await response.json();
        } catch (error) {
            console.error('Error fetching verification status:', error);
            return { verification_status: 'error', application: null };
        }
    }

    // Initialize UI based on user status
    async initializeUI() {
        try {
            this.showSpinner();
            // Fetch both profile and verification status
            const [profile, verificationData] = await Promise.all([
                this.loadCurrentUser(),
                this.fetchVerificationStatus()
            ]);
            // Use verificationData for panel
            this.updateVerificationPanel({
                status: verificationData.verification_status,
                is_verified: this.currentUser?.is_verified_contributor || false,
                application: verificationData.application,
                verification_source: this.currentUser?.verified_badge?.label || null,
                profile_data: this.currentUser
            });
            if (this.isAdmin) {
                await this.initializeAdminPanel();
            }
            this.hideSpinner();
        } catch (error) {
            console.error('❌ Error initializing UI:', error);
            this.hideSpinner();
            this.showToast('Failed to load verification status.', 'error');
        }
    }

    // Check verification status using universal system
    async checkVerificationStatusUniversal() {
        try {
            console.log('🔍 Checking verification status with universal system...');
            
            // Check if user is still logged in
            const token = this.getAuthToken();
            if (!token) {
                console.log('❌ No auth token found during verification check');
                return { status: 'not_logged_in', is_verified: false, application: null };
            }
            
            // Use universal verification system if available
            if (window.universalVerification) {
                console.log('✅ Universal verification system available');
                
                // Update the auth token in universal system too
                window.universalVerification.authToken = token;
                
                const universalStatus = await window.universalVerification.forceRefreshVerificationStatus();
                
                console.log('🔍 Universal verification result:', universalStatus);
                console.log('🔍 Is verified:', universalStatus.is_verified);
                console.log('🔍 Verification source:', universalStatus.verification_source);
                
                // Convert to expected format
                return {
                    status: universalStatus.is_verified ? 'approved' : 'not_applied',
                    is_verified: universalStatus.is_verified,
                    application: universalStatus.application || (universalStatus.is_verified ? {
                        business_name: this.currentUser?.first_name && this.currentUser?.last_name ? 
                                     `${this.currentUser.first_name} ${this.currentUser.last_name}` : 
                                     this.currentUser?.username || 'Verified User',
                        created_at: new Date().toISOString()
                    } : null),
                    verification_source: universalStatus.verification_source,
                    profile_data: universalStatus.profile_data
                };
            }
            
            // Fallback to direct profile check
            console.log('⚠️ Universal system not available, using fallback...');
            return await this.checkVerificationFallback();
            
        } catch (error) {
            console.error('❌ Error checking verification status:', error);
            return { status: 'error', is_verified: false, application: null };
        }
    }

    // Fallback verification check
    async checkVerificationFallback() {
        try {
            const response = await fetch(`${this.baseUrl}/api/users/profile/`, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                const profileData = await response.json();
                
                const isVerified = 
                    profileData.is_verified === true || 
                    profileData.verified === true || 
                    profileData.verification_status === 'approved';
                
                return {
                    status: isVerified ? 'approved' : 'not_applied',
                    is_verified: isVerified,
                    application: isVerified ? {
                        business_name: profileData.username || 'Verified User',
                        created_at: profileData.date_joined || new Date().toISOString()
                    } : null
                };
            }

            return { status: 'not_applied', is_verified: false, application: null };
            
        } catch (error) {
            console.error('❌ Fallback verification check failed:', error);
            return { status: 'error', is_verified: false, application: null };
        }
    }

    // Update verification status panel
    updateVerificationPanel(verificationData) {
        const panel = document.getElementById('verificationPanel');
        if (!panel) return;

        const { status, is_verified, application, verification_source } = verificationData;

        let panelHTML = '';

        if (is_verified) {
            // Always show Create Recipe for verified users
            panelHTML = `
                <div class="verification-status-card verified">
                    <div class="verification-status-header">
                        <i class="fas fa-certificate verification-status-icon"></i>
                        <div>
                            <h3 class="verification-status-title">✅ Verified Contributor</h3>
                            <p class="verification-status-subtitle">You are verified!</p>
                        </div>
                    </div>
                    <div class="verification-status-content">
                        <p>🎉 Congratulations! You are a verified contributor on ChopSmo. Your recipes will be featured prominently and you have access to all premium features.</p>
                        <div class="verification-perks">
                            <h4>Your Verification Benefits:</h4>
                            <ul>
                                <li><i class="fas fa-star"></i> Verified badge on all your content</li>
                                <li><i class="fas fa-trophy"></i> Priority placement in search results</li>
                                <li><i class="fas fa-crown"></i> Access to advanced analytics</li>
                                <li><i class="fas fa-rocket"></i> Early access to new features</li>
                                <li><i class="fas fa-shield-alt"></i> Enhanced credibility and trust</li>
                            </ul>
                        </div>
                        ${verification_source ? `
                            <div class="verification-details">
                                <p><small><strong>Verified via:</strong> ${verification_source}</small></p>
                            </div>
                        ` : ''}
                        ${application ? `
                            <div class="verification-details">
                                <p><strong>Business:</strong> ${application.business_name || 'Verified User'}</p>
                                <p><strong>Verified Since:</strong> ${new Date(application.created_at || new Date()).toLocaleDateString()}</p>
                            </div>
                        ` : ''}
                    </div>
                    <div class="verification-status-actions">
                        <a href="Recipes.html" class="btn btn-primary">
                            <i class="fas fa-plus"></i>
                            Create Recipe
                        </a>
                        <a href="Profile.html" class="btn btn-secondary">
                            <i class="fas fa-user"></i>
                            View Profile
                        </a>
                        <button id="refreshVerificationBtn" class="btn btn-outline" style="font-size: 12px; padding: 6px 12px;">
                            <i class="fas fa-sync-alt"></i> Refresh Status
                        </button>
                    </div>
                    <div class="verification-note">
                        <p><small><i class="fas fa-info-circle"></i> If you believe your verification was removed in error, please contact support.</small></p>
                    </div>
                </div>
            `;
        } else if (application && (status === 'pending' || status === 'applied' || status === 'pending_review')) {
            // Show pending state if application exists and status is pending
            panelHTML = `
                <div class="verification-status-card pending">
                    <div class="verification-status-header">
                        <i class="fas fa-hourglass-half verification-status-icon"></i>
                        <div>
                            <h3 class="verification-status-title">Verification Pending</h3>
                            <p class="verification-status-subtitle">Your application is under review</p>
                        </div>
                    </div>
                    <div class="verification-status-content">
                        <p>Thank you for applying to become a verified contributor! Your application is currently <strong>pending</strong> and will be reviewed within 48 hours.</p>
                        <div class="verification-details">
                            <p><strong>Full Name:</strong> ${application.full_name || 'N/A'}</p>
                            <p><strong>Submitted:</strong> ${application.created_at ? new Date(application.created_at).toLocaleDateString() : 'Recently'}</p>
                        </div>
                        <div class="verification-note">
                            <p><small><i class="fas fa-info-circle"></i> You will be notified once your application is reviewed.</small></p>
                        </div>
                    </div>
                    <div class="verification-status-actions">
                        <button id="refreshVerificationBtn" class="btn btn-outline" style="font-size: 12px; padding: 6px 12px;">
                            <i class="fas fa-sync-alt"></i> Refresh Status
                        </button>
                    </div>
                </div>
            `;
        } else {
            panelHTML = `
                <div class="verification-status-card not-verified">
                    <div class="verification-status-header">
                        <i class="fas fa-user-circle verification-status-icon"></i>
                        <div>
                            <h3 class="verification-status-title">Not Verified</h3>
                            <p class="verification-status-subtitle">Apply to become a verified contributor</p>
                        </div>
                    </div>
                    <div class="verification-status-content">
                        <p>Join our community of verified chefs and cooking enthusiasts. Get your recipes featured and build credibility with your audience.</p>
                        <ul class="verification-benefits">
                            <li><i class="fas fa-check"></i> Verified badge on your profile</li>
                            <li><i class="fas fa-check"></i> Priority in recipe search results</li>
                            <li><i class="fas fa-check"></i> Access to exclusive features</li>
                            <li><i class="fas fa-check"></i> Enhanced recipe visibility</li>
                        </ul>
                    </div>
                    <div class="verification-status-actions">
                        <button id="applyForVerification" class="btn btn-primary">
                            <i class="fas fa-paper-plane"></i>
                            Apply for Verification
                        </button>
                        <button id="refreshVerificationBtn" class="btn btn-outline" style="font-size: 12px; padding: 6px 12px;">
                            <i class="fas fa-sync-alt"></i> Refresh Status
                        </button>
                    </div>
                </div>
            `;
        }

        panel.innerHTML = panelHTML;
        
        // Store current status for comparison
        this.lastVerificationStatus = verificationData;
        
        // Add event listeners to new elements
        this.setupPanelEventListeners();
    }

    // Setup event listeners for panel elements
    setupPanelEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshVerificationBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await this.forceRefreshVerificationStatus();
            });
        }

        // Apply for verification button
        const applyBtn = document.getElementById('applyForVerification');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.showApplicationModal();
            });
        }
    }

    // Force refresh verification status
    async forceRefreshVerificationStatus() {
        console.log('🔄 Force refreshing verification status...');
        
        const refreshBtn = document.getElementById('refreshVerificationBtn');
        const originalText = refreshBtn?.innerHTML;
        
        try {
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
                refreshBtn.disabled = true;
            }
            
            // Clear cache if available
            if (window.universalVerification) {
                window.universalVerification.clearCache();
            }
            
            // Re-check verification status
            const newStatus = await this.checkVerificationStatusUniversal();
            
            // Update UI
            this.updateVerificationPanel(newStatus);
            
            this.showToast('✅ Verification status refreshed', 'success');
            
            return newStatus;
            
        } catch (error) {
            console.error('❌ Force refresh failed:', error);
            this.showToast('❌ Failed to refresh verification status', 'error');
        } finally {
            if (refreshBtn && originalText) {
                setTimeout(() => {
                    refreshBtn.innerHTML = originalText;
                    refreshBtn.disabled = false;
                }, 1000);
            }
        }
    }

    // Start periodic verification checking
    startPeriodicVerificationCheck() {
        // Check every 30 seconds for verification status changes
        this.verificationCheckInterval = setInterval(async () => {
            console.log('🔄 Periodic verification check...');
            
            try {
                const newStatus = await this.checkVerificationStatusUniversal();
                
                // Check if verification status changed
                if (this.lastVerificationStatus && 
                    this.lastVerificationStatus.is_verified !== newStatus.is_verified) {
                    
                    console.log('🚨 Verification status changed!');
                    console.log('Previous:', this.lastVerificationStatus.is_verified);
                    console.log('Current:', newStatus.is_verified);
                    
                    this.updateVerificationPanel(newStatus);
                    
                    // Show notification
                    if (newStatus.is_verified) {
                        this.showToast('✅ Your account has been verified!', 'success');
                    } else {
                        this.showToast('⚠️ Your verification status has changed.', 'warning');
                    }
                }
                
            } catch (error) {
                console.warn('⚠️ Periodic verification check failed:', error);
            }
        }, 30000); // 30 seconds
        
        console.log('🔄 Started periodic verification checking');
    }

    // Initialize admin panel (simplified)
    async initializeAdminPanel() {
        console.log('🔒 Initializing admin panel...');
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.display = 'block';
        }
    }

    // Setup general event listeners
    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Close modal handlers
        const closeModalBtn = document.getElementById('closeApplicationModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.closeApplicationModal();
            });
        }

        // Verification application form submission
        const verificationForm = document.getElementById('verificationApplicationForm');
        if (verificationForm) {
            verificationForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.submitVerificationApplication();
            });
        }

        // Page visibility change handler
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Check verification when page becomes visible
                setTimeout(async () => {
                    const newStatus = await this.checkVerificationStatusUniversal();
                    if (this.lastVerificationStatus && 
                        this.lastVerificationStatus.is_verified !== newStatus.is_verified) {
                        this.updateVerificationPanel(newStatus);
                    }
                }, 1000);
            }
        });
    }

    // Submit verification application to backend
    async submitVerificationApplication() {
        const form = document.getElementById('verificationApplicationForm');
        if (!form) return;
        const submitBtn = document.getElementById('submitApplication');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        }
        // Collect form data
        const data = {
            full_name: form.full_name.value.trim(),
            cooking_experience: form.cooking_experience.value.trim(),
            specialties: form.specialties.value.trim(),
            social_media_links: form.social_media_links.value.trim(),
            sample_recipes: form.sample_recipes.value.trim(),
            motivation: form.motivation.value.trim(),
        };
        try {
            // Update the endpoint URL to match backend
            const response = await fetch('https://njoya.pythonanywhere.com/api/users/verification/apply/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getHeaders(),
                },
                body: JSON.stringify(data),
            });
            if (response.ok) {
                this.showToast('Your application is pending, it will be reviewed within 48hrs', 'success');
                this.closeApplicationModal();
                // Optionally refresh status
                setTimeout(() => this.forceRefreshVerificationStatus(), 1000);
            } else {
                const errorData = await response.json().catch(() => ({}));
                this.showToast(errorData.detail || 'Failed to submit application. Please try again.', 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Application';
            }
        }
    }

    // Show application modal
    showApplicationModal() {
        const modal = document.getElementById('applicationModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // Close application modal
    closeApplicationModal() {
        const modal = document.getElementById('applicationModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Utility functions
    showSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.add('show');
        }
    }

    hideSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.remove('show');
        }
    }

    // Show toast notifications
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info-circle'}"></i>
            </div>
            <div class="toast-message">${message}</div>
            <div class="toast-close">
                <i class="fas fa-times"></i>
            </div>
        `;

        // Add to container
        toastContainer.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 5000);

        // Manual close button
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toastContainer.removeChild(toast);
            });
        }
    }

    // Logout function
    logout() {
        console.log('🔓 Logging out...');
        
        // Clear auth tokens
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        
        // Redirect to login page
        this.redirectToLogin();
    }

    // Redirect to login page
    redirectToLogin() {
        window.location.href = 'login.html';
    }
}

// Initialize the verification system on page load
document.addEventListener('DOMContentLoaded', () => {
    window.verificationSystem = new VerificationSystem();
});
