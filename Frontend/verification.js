// ChopSmo User Verification System
// Handles verification applications, status checking, and admin review

class VerificationSystem {
    constructor() {
        this.baseUrl = 'https://njoya.pythonanywhere.com';
        this.authToken = this.getAuthToken();
        this.currentUser = null;
        this.isAdmin = false;
        
        this.init();
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
            this.initializeUI();
            
            // Set up event listeners
            console.log('🎯 Setting up event listeners...');
            this.setupEventListeners();
            
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
            
            // Load verification status
            const verificationStatus = await this.checkVerificationStatus();
            
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

    // Check user's verification status
    async checkVerificationStatus() {
        try {
            // First check if user has verification status in their profile
            const profileResponse = await fetch(`${this.baseUrl}/api/users/profile/`, {
                headers: this.getHeaders()
            });

            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                
                // Check if user is already verified through existing flags
                if (profileData.is_verified || profileData.verified || profileData.is_staff || profileData.is_superuser) {
                    return { 
                        status: 'approved', 
                        is_verified: true,
                        application: {
                            business_name: profileData.business_name || 'Verified User',
                            business_license: 'Legacy Verification',
                            created_at: profileData.date_joined || new Date().toISOString(),
                            description: 'Previously verified user'
                        }
                    };
                }
            }

            // Then check for verification application
            const response = await fetch(`${this.baseUrl}/api/verification/status/`, {
                headers: this.getHeaders()
            });

            if (!response.ok && response.status !== 404) {
                // If verification endpoint doesn't exist yet, check profile flags
                if (response.status === 404 && profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    if (profileData.is_verified || profileData.verified) {
                        return { 
                            status: 'approved', 
                            is_verified: true,
                            application: {
                                business_name: 'Verified User',
                                business_license: 'Legacy Verification', 
                                created_at: profileData.date_joined || new Date().toISOString()
                            }
                        };
                    }
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            if (response.status === 404) {
                // No verification application found
                return { status: 'not_applied', application: null };
            }

            const data = await response.json();
            return data;
            
        } catch (error) {
            console.warn('⚠️ Error checking verification status:', error);
            
            // Fallback: check if user profile indicates they're verified
            try {
                const profileResponse = await fetch(`${this.baseUrl}/api/users/profile/`, {
                    headers: this.getHeaders()
                });
                
                if (profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    if (profileData.is_verified || profileData.verified || profileData.is_staff) {
                        return { 
                            status: 'approved', 
                            is_verified: true,
                            application: {
                                business_name: 'Verified User',
                                business_license: 'Legacy Verification',
                                created_at: profileData.date_joined || new Date().toISOString()
                            }
                        };
                    }
                }
            } catch (fallbackError) {
                console.warn('⚠️ Fallback verification check failed:', fallbackError);
            }
            
            return { status: 'error', application: null };
        }
    }

    // Update verification status panel
    updateVerificationPanel(verificationData) {
        const panel = document.getElementById('verificationPanel');
        if (!panel) return;

        const { status, application } = verificationData;

        let panelHTML = '';

        switch (status) {
            case 'not_applied':
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
                        </div>
                    </div>
                `;
                break;

            case 'pending':
                panelHTML = `
                    <div class="verification-status-card pending">
                        <div class="verification-status-header">
                            <i class="fas fa-clock verification-status-icon"></i>
                            <div>
                                <h3 class="verification-status-title">Application Pending</h3>
                                <p class="verification-status-subtitle">Your application is under review</p>
                            </div>
                        </div>
                        <div class="verification-status-content">
                            <p>Thank you for applying! Our team is reviewing your application. This typically takes 3-5 business days.</p>
                            <div class="application-details">
                                <h4>Application Details:</h4>
                                <p><strong>Business Name:</strong> ${application.business_name}</p>
                                <p><strong>License Number:</strong> ${application.business_license}</p>
                                <p><strong>Submitted:</strong> ${new Date(application.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div class="verification-status-actions">
                            <button id="updateApplication" class="btn btn-secondary">
                                <i class="fas fa-edit"></i>
                                Update Application
                            </button>
                        </div>
                    </div>
                `;
                break;

            case 'approved':
                panelHTML = `
                    <div class="verification-status-card verified">
                        <div class="verification-status-header">
                            <i class="fas fa-certificate verification-status-icon"></i>
                            <div>
                                <h3 class="verification-status-title">Verified Contributor</h3>
                                <p class="verification-status-subtitle">Congratulations! You are verified</p>
                            </div>
                        </div>
                        <div class="verification-status-content">
                            <p>🎉 Congratulations! You are now a verified contributor on ChopSmo. Your recipes will be featured prominently and you have access to all premium features.</p>
                            <div class="verification-perks">
                                <h4>Your Benefits:</h4>
                                <ul>
                                    <li><i class="fas fa-star"></i> Verified badge on all your content</li>
                                    <li><i class="fas fa-trophy"></i> Priority placement in search results</li>
                                    <li><i class="fas fa-crown"></i> Access to advanced analytics</li>
                                    <li><i class="fas fa-rocket"></i> Early access to new features</li>
                                </ul>
                            </div>
                        </div>
                        <div class="verification-status-actions">
                            <a href="Recipes.html" class="btn btn-primary">
                                <i class="fas fa-plus"></i>
                                Create Recipe
                            </a>
                        </div>
                    </div>
                `;
                break;

            case 'rejected':
                panelHTML = `
                    <div class="verification-status-card rejected">
                        <div class="verification-status-header">
                            <i class="fas fa-times-circle verification-status-icon"></i>
                            <div>
                                <h3 class="verification-status-title">Application Rejected</h3>
                                <p class="verification-status-subtitle">Your application was not approved</p>
                            </div>
                        </div>
                        <div class="verification-status-content">
                            <p>Unfortunately, your verification application was not approved at this time.</p>
                            ${application.rejection_reason ? `
                                <div class="rejection-reason">
                                    <h4>Reason:</h4>
                                    <p>${application.rejection_reason}</p>
                                </div>
                            ` : ''}
                            <p>You can update your information and reapply after addressing the concerns mentioned above.</p>
                        </div>
                        <div class="verification-status-actions">
                            <button id="reapplyForVerification" class="btn btn-primary">
                                <i class="fas fa-redo"></i>
                                Reapply for Verification
                            </button>
                        </div>
                    </div>
                `;
                break;

            default:
                panelHTML = `
                    <div class="verification-status-card error">
                        <div class="verification-status-header">
                            <i class="fas fa-exclamation-triangle verification-status-icon"></i>
                            <div>
                                <h3 class="verification-status-title">Error Loading Status</h3>
                                <p class="verification-status-subtitle">Unable to load verification status</p>
                            </div>
                        </div>
                        <div class="verification-status-content">
                            <p>There was an error loading your verification status. Please refresh the page or try again later.</p>
                        </div>
                        <div class="verification-status-actions">
                            <button onclick="location.reload()" class="btn btn-secondary">
                                <i class="fas fa-refresh"></i>
                                Refresh Page
                            </button>
                        </div>
                    </div>
                `;
        }

        panel.innerHTML = panelHTML;
    }

    // Initialize admin panel
    async initializeAdminPanel() {
        const adminPanel = document.getElementById('adminPanel');
        if (!adminPanel) return;

        adminPanel.style.display = 'block';
        
        try {
            await this.loadApplications();
        } catch (error) {
            console.error('❌ Error loading admin panel:', error);
            this.showToast('Failed to load admin panel.', 'error');
        }
    }

    // Load all verification applications for admin
    async loadApplications(statusFilter = '') {
        try {
            let url = `${this.baseUrl}/api/verification/applications/`;
            if (statusFilter) {
                url += `?status=${statusFilter}`;
            }

            const response = await fetch(url, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const applications = await response.json();
            this.displayApplications(applications);
            
            // Update count
            const pendingCount = applications.filter(app => app.status === 'pending').length;
            const countElement = document.getElementById('applicationsCount');
            if (countElement) {
                countElement.textContent = `${pendingCount} Pending`;
            }
            
        } catch (error) {
            console.error('❌ Error loading applications:', error);
            this.showToast('Failed to load applications.', 'error');
        }
    }

    // Display applications in admin panel
    displayApplications(applications) {
        const container = document.getElementById('applicationsList');
        if (!container) return;

        if (applications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>No applications found.</p>
                </div>
            `;
            return;
        }

        const applicationsHTML = applications.map(app => `
            <div class="admin-application-card" data-application-id="${app.id}">
                <div class="admin-application-header">
                    <div class="admin-application-user">
                        <h4>${app.user.first_name} ${app.user.last_name} (@${app.user.username})</h4>
                        <p>${app.user.email}</p>
                    </div>
                    <div class="admin-application-status">
                        <span class="status-badge status-${app.status}">${app.status.toUpperCase()}</span>
                        <small>${new Date(app.created_at).toLocaleDateString()}</small>
                    </div>
                </div>
                
                <div class="admin-application-details">
                    <div class="admin-application-field">
                        <label>Business Name:</label>
                        <span>${app.business_name}</span>
                    </div>
                    <div class="admin-application-field">
                        <label>License Number:</label>
                        <span>${app.business_license}</span>
                    </div>
                    <div class="admin-application-field">
                        <label>Description:</label>
                        <span>${app.description}</span>
                    </div>
                </div>
                
                ${app.status === 'pending' ? `
                    <div class="admin-application-actions">
                        <button onclick="verificationSystem.approveApplication(${app.id})" class="btn btn-success">
                            <i class="fas fa-check"></i>
                            Approve
                        </button>
                        <button onclick="verificationSystem.rejectApplication(${app.id})" class="btn btn-danger">
                            <i class="fas fa-times"></i>
                            Reject
                        </button>
                    </div>
                ` : ''}
                
                ${app.status === 'rejected' && app.rejection_reason ? `
                    <div class="admin-application-rejection">
                        <label>Rejection Reason:</label>
                        <span>${app.rejection_reason}</span>
                    </div>
                ` : ''}
            </div>
        `).join('');

        container.innerHTML = applicationsHTML;
    }

    // Set up event listeners
    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.logout.bind(this));
        }

        // Application form
        const applicationForm = document.getElementById('verificationApplicationForm');
        if (applicationForm) {
            applicationForm.addEventListener('submit', this.handleApplicationSubmit.bind(this));
        }

        // Modal controls
        const closeModalBtn = document.getElementById('closeApplicationModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', this.closeApplicationModal.bind(this));
        }

        // Admin filters
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.loadApplications(e.target.value);
            });
        }

        // Dynamic event delegation for application buttons - improved
        document.addEventListener('click', (e) => {
            // Check for apply/update/reapply buttons with better matching
            const target = e.target.closest('button');
            if (!target) return;
            
            const targetId = target.id || target.getAttribute('id');
            const targetText = target.textContent?.trim() || '';
            
            console.log('🔘 Button clicked:', targetId, targetText); // Debug log
            
            if (targetId === 'applyForVerification' || 
                targetText.includes('Apply for Verification') ||
                target.closest('#applyForVerification')) {
                e.preventDefault();
                console.log('🚀 Opening application modal');
                this.showApplicationModal();
            } else if (targetId === 'updateApplication' || 
                       targetText.includes('Update Application') ||
                       target.closest('#updateApplication')) {
                e.preventDefault();
                console.log('🔄 Opening update modal');
                this.showApplicationModal(true);
            } else if (targetId === 'reapplyForVerification' || 
                       targetText.includes('Reapply for Verification') ||
                       target.closest('#reapplyForVerification')) {
                e.preventDefault();
                console.log('🔁 Opening reapply modal');
                this.showApplicationModal();
            }
        });

        // Modal backdrop click
        const modal = document.getElementById('applicationModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeApplicationModal();
                }
            });
        }
    }

    // Show application modal
    async showApplicationModal(isUpdate = false) {
        console.log('📝 Showing application modal, isUpdate:', isUpdate);
        
        const modal = document.getElementById('applicationModal');
        if (!modal) {
            console.error('❌ Application modal not found!');
            this.showToast('Application form is not available. Please refresh the page.', 'error');
            return;
        }

        // If updating, load existing data
        if (isUpdate) {
            try {
                console.log('📋 Loading existing application data...');
                const verificationData = await this.checkVerificationStatus();
                if (verificationData.application) {
                    this.populateApplicationForm(verificationData.application);
                }
            } catch (error) {
                console.error('❌ Error loading application data:', error);
            }
        }

        console.log('✅ Opening modal...');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        this.showToast('Application form opened', 'success');
    }

    // Close application modal
    closeApplicationModal() {
        const modal = document.getElementById('applicationModal');
        if (!modal) return;

        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear form
        const form = document.getElementById('verificationApplicationForm');
        if (form) {
            form.reset();
        }
    }

    // Populate application form with existing data
    populateApplicationForm(application) {
        const fields = {
            'businessName': application.business_name,
            'businessLicense': application.business_license,
            'description': application.description
        };

        Object.keys(fields).forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element && fields[fieldId]) {
                element.value = fields[fieldId];
            }
        });
    }

    // Handle application form submission
    async handleApplicationSubmit(e) {
        e.preventDefault();
        
        console.log('📝 Submitting verification application...');
        
        const formData = new FormData(e.target);
        const applicationData = {
            business_name: formData.get('business_name'),
            business_license: formData.get('business_license'),
            description: formData.get('description')
        };

        console.log('📋 Application data:', applicationData);

        // Basic validation
        if (!applicationData.business_name || !applicationData.business_license || !applicationData.description) {
            this.showToast('Please fill in all required fields.', 'error');
            return;
        }

        if (applicationData.description.length < 50) {
            this.showToast('Description must be at least 50 characters long.', 'error');
            return;
        }

        try {
            this.showSpinner();
            
            // Try to submit to verification endpoint
            const response = await fetch(`${this.baseUrl}/api/verification/apply/`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(applicationData)
            });

            if (!response.ok) {
                // If verification endpoint doesn't exist, show appropriate message
                if (response.status === 404) {
                    this.hideSpinner();
                    this.showToast('Verification system is not yet available on the backend. Please contact support.', 'error');
                    this.closeApplicationModal();
                    return;
                }
                
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            this.hideSpinner();
            this.closeApplicationModal();
            this.showToast('Application submitted successfully! We will review it within 3-5 business days.', 'success');
            
            console.log('✅ Application submitted successfully:', result);
            
            // Refresh the verification panel
            setTimeout(() => {
                this.initializeUI();
            }, 1000);
            
        } catch (error) {
            this.hideSpinner();
            console.error('❌ Error submitting application:', error);
            
            if (error.message.includes('404')) {
                this.showToast('Verification system is not yet available. Please contact support.', 'error');
            } else {
                this.showToast(error.message || 'Failed to submit application. Please try again.', 'error');
            }
        }
    }

    // Approve application (admin only)
    async approveApplication(applicationId) {
        try {
            this.showSpinner();
            
            const response = await fetch(`${this.baseUrl}/api/verification/applications/${applicationId}/approve/`, {
                method: 'POST',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.hideSpinner();
            this.showToast('Application approved successfully!', 'success');
            
            // Reload applications
            await this.loadApplications();
            
        } catch (error) {
            this.hideSpinner();
            console.error('❌ Error approving application:', error);
            this.showToast('Failed to approve application. Please try again.', 'error');
        }
    }

    // Reject application (admin only)
    async rejectApplication(applicationId) {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;

        try {
            this.showSpinner();
            
            const response = await fetch(`${this.baseUrl}/api/verification/applications/${applicationId}/reject/`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ rejection_reason: reason })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.hideSpinner();
            this.showToast('Application rejected.', 'success');
            
            // Reload applications
            await this.loadApplications();
            
        } catch (error) {
            this.hideSpinner();
            console.error('❌ Error rejecting application:', error);
            this.showToast('Failed to reject application. Please try again.', 'error');
        }
    }

    // Utility methods
    redirectToLogin() {
        this.showToast('Please log in to access verification system.', 'error');
        setTimeout(() => {
            window.location.href = 'Login.html';
        }, 2000);
    }

    logout() {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        sessionStorage.removeItem('userData');
        localStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('isLoggedIn');
        
        this.showToast('Logged out successfully.', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    showSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'flex';
        }
    }

    hideSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toastMessage');
        if (!toast) return;

        // Set colors based on type
        const colors = {
            success: '#228B22',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };

        toast.textContent = message;
        toast.style.backgroundColor = colors[type] || colors.info;
        toast.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            toast.style.display = 'none';
        }, 5000);
    }
}

// Initialize verification system when page loads
let verificationSystem;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 ChopSmo Verification System Loading...');
    verificationSystem = new VerificationSystem();
});

// Add styles for loading spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
