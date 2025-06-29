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
            
            console.log('👤 Current user loaded:', this.currentUser.username);
            console.log('🔒 Admin status:', this.isAdmin);
            
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            throw error;
        }
    }

    // Initialize UI based on user status
    async initializeUI() {
        try {
            // Show loading while checking verification status
            this.showSpinner();
            
            // Load verification status using universal system
            const verificationStatus = await this.checkVerificationStatusUniversal();
            
            // Update verification panel
            this.updateVerificationPanel(verificationStatus);
            
            // Show admin panel if user is admin
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

    showToast(message, type = 'info') {
        console.log(`🔔 Toast (${type}):`, message);
        
        const toast = document.getElementById('toastMessage');
        if (toast) {
            toast.textContent = message;
            toast.className = `toast-${type}`;
            toast.style.display = 'block';
            
            setTimeout(() => {
                toast.style.display = 'none';
            }, 4000);
        }
    }

    redirectToLogin() {
        window.location.href = 'Login.html';
    }

    logout() {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        this.redirectToLogin();
    }
}

// Initialize verification system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a moment for other scripts to load
    setTimeout(() => {
        window.verificationSystem = new VerificationSystem();
    }, 500);
});

// Global functions for testing
window.testVerificationSystem = function() {
    if (window.verificationSystem) {
        return window.verificationSystem.checkVerificationStatusUniversal();
    }
    return Promise.resolve({ status: 'not_initialized' });
};

window.forceRefreshVerificationSystem = function() {
    if (window.verificationSystem) {
        return window.verificationSystem.forceRefreshVerificationStatus();
    }
    return Promise.resolve({ status: 'not_initialized' });
};

window.debugVerificationStatus = async function() {
    console.log('🔧 === VERIFICATION DEBUG REPORT ===');
    
    // Check auth token
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    console.log('🔑 Auth token present:', !!token);
    console.log('🔑 Token length:', token ? token.length : 0);
    
    // Check universal verification system
    console.log('🌍 Universal verification available:', !!window.universalVerification);
    
    // Check verification system
    console.log('🏠 Verification system available:', !!window.verificationSystem);
    
    if (window.universalVerification) {
        try {
            const universalStatus = await window.universalVerification.forceRefreshVerificationStatus();
            console.log('🌍 Universal verification result:', universalStatus);
        } catch (error) {
            console.error('❌ Universal verification error:', error);
        }
    }
    
    if (window.verificationSystem) {
        try {
            const systemStatus = await window.verificationSystem.checkVerificationStatusUniversal();
            console.log('🏠 System verification result:', systemStatus);
        } catch (error) {
            console.error('❌ System verification error:', error);
        }
    }
    
    // Check current page elements
    console.log('📄 Verification panel exists:', !!document.getElementById('verificationPanel'));
    console.log('📄 Panel content length:', document.getElementById('verificationPanel')?.innerHTML?.length || 0);
    
    console.log('🔧 === DEBUG REPORT COMPLETE ===');
};

console.log('🔧 Clean Verification System loaded');
console.log('🛠️ Available debug functions:');
console.log('  - testVerificationSystem() - Test verification');
console.log('  - forceRefreshVerificationSystem() - Force refresh');
console.log('  - debugVerificationStatus() - Complete debug report');
