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

    // Check user's verification status using universal verification logic
    async checkVerificationStatus() {
        try {
            // Check for manual override first (for testing/admin purposes)
            const manualOverride = localStorage.getItem('verificationOverride');
            if (manualOverride) {
                try {
                    const overrideData = JSON.parse(manualOverride);
                    console.log('🔧 Using manual verification override:', overrideData);
                    return overrideData;
                } catch (e) {
                    console.warn('⚠️ Invalid manual override data, removing...');
                    localStorage.removeItem('verificationOverride');
                }
            }

            // Use universal verification system for comprehensive detection
            if (window.universalVerification) {
                console.log('🔍 Using universal verification system...');
                const universalStatus = await window.universalVerification.getCurrentUserVerificationStatus();
                
                console.log('🔍 Universal verification result:', universalStatus);
                
                if (universalStatus.is_verified) {
                    console.log('✅ User is verified via universal system!');
                    console.log('✅ Verification source:', universalStatus.verification_source);
                    return universalStatus;
                }
            }

            // Fallback to original logic if universal system is not available
            console.log('🔍 Falling back to original verification check...');
            
            // First check if user has verification status in their profile
            const profileResponse = await fetch(`${this.baseUrl}/api/users/profile/`, {
                headers: this.getHeaders()
            });

            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                
                // Debug: Log the full profile data to see what fields are available
                console.log('🔍 Full profile data for verification check:', profileData);
                console.log('🔍 Checking verification flags:');
                console.log('  - is_verified:', profileData.is_verified);
                console.log('  - verified:', profileData.verified);
                console.log('  - is_staff:', profileData.is_staff);
                console.log('  - is_superuser:', profileData.is_superuser);
                console.log('  - verification_status:', profileData.verification_status);
                console.log('  - verified_at:', profileData.verified_at);
                console.log('  - verification_approved:', profileData.verification_approved);
                
                // Enhanced verification detection for various backend patterns
                const isCurrentlyVerified = 
                    // Standard verification flags
                    profileData.is_verified === true || 
                    profileData.verified === true || 
                    profileData.verification_status === 'approved' ||
                    profileData.verification_status === 'verified' ||
                    profileData.verification_approved === true ||
                    
                    // Nested profile object checks
                    profileData.profile?.is_verified === true ||
                    profileData.profile?.verified === true ||
                    profileData.profile?.verification_status === 'approved' ||
                    
                    // User verification field variations
                    profileData.user_verification === 'approved' ||
                    profileData.user_verification === true ||
                    profileData.user_verified === true ||
                    profileData.verified_user === true ||
                    
                    // Staff/admin status (with confirmation they should be verified)
                    (profileData.is_staff === true && this.shouldStaffBeVerified(profileData)) ||
                    (profileData.is_superuser === true && this.shouldSuperuserBeVerified(profileData)) ||
                    
                    // Group-based verification
                    this.checkVerificationFromGroups(profileData) ||
                    
                    // Role-based verification
                    this.checkVerificationFromRoles(profileData) ||
                    
                    // Custom field patterns (common in different frameworks)
                    profileData.account_verified === true ||
                    profileData.email_verified === true && profileData.profile_verified === true ||
                    
                    // Business/contributor specific flags
                    profileData.is_contributor === true ||
                    profileData.contributor_status === 'verified' ||
                    profileData.business_verified === true ||
                    
                    // Date-based verification (if verified_at exists, user is verified)
                    (profileData.verified_at && new Date(profileData.verified_at) <= new Date()) ||
                    (profileData.verification_date && new Date(profileData.verification_date) <= new Date()) ||
                    
                    // Fuzzy verification detection as fallback
                    this.fuzzyVerificationDetection(profileData);
                
                console.log('🎯 Enhanced verification check result:', isCurrentlyVerified);
                
                // Enhanced detection: Check various verification patterns and special user types
                if (!isCurrentlyVerified) {
                    // Check for special user types that should be automatically verified
                    const autoVerifiedConditions = 
                        // Admin/Staff verification (they can verify themselves)
                        profileData.is_staff === true ||
                        profileData.is_superuser === true ||
                        
                        // Special usernames that indicate verified status
                        profileData.username === 'admin' ||
                        profileData.username === 'njoya' ||
                        profileData.email?.includes('admin') ||
                        
                        // Business or contributor accounts with specific patterns
                        profileData.account_type === 'business' ||
                        profileData.account_type === 'contributor' ||
                        profileData.user_type === 'verified' ||
                        profileData.user_type === 'business' ||
                        
                        // Group-based verification
                        this.checkVerificationFromGroups(profileData) ||
                        
                        // Role-based verification
                        this.checkVerificationFromRoles(profileData) ||
                        
                        // Permission-based verification
                        this.checkVerificationFromPermissions(profileData) ||
                        
                        // Date-based verification (if they have a verification date in the past)
                        (profileData.verified_at && new Date(profileData.verified_at) <= new Date()) ||
                        (profileData.verification_date && new Date(profileData.verification_date) <= new Date()) ||
                        
                        // Legacy verification patterns
                        profileData.legacy_verified === true ||
                        profileData.migrated_verified === true ||
                        
                        // Business-specific verification flags
                        profileData.business_verified === true ||
                        profileData.is_business_owner === true ||
                        profileData.business_license_verified === true ||
                        
                        // Content creator verification
                        profileData.content_creator_verified === true ||
                        profileData.chef_verified === true ||
                        profileData.recipe_contributor === true ||
                        
                        // Enhanced fuzzy detection
                        this.fuzzyVerificationDetection(profileData);
                    
                    if (autoVerifiedConditions) {
                        const userDisplayName = profileData.business_name || 
                                              (profileData.first_name && profileData.last_name ? 
                                               `${profileData.first_name} ${profileData.last_name}` : 
                                               profileData.username || 'Verified User');
                        
                        console.log('✅ Auto-verified user detected:', userDisplayName);
                        return { 
                            status: 'approved', 
                            is_verified: true,
                            application: {
                                business_name: userDisplayName,
                                business_license: profileData.is_staff || profileData.is_superuser ? 
                                                'Admin Privileges' : 
                                                profileData.business_license || 'Auto-Verified Account',
                                created_at: profileData.verified_at || profileData.date_joined || new Date().toISOString(),
                                description: profileData.is_staff || profileData.is_superuser ?
                                           'Administrator account with verification privileges' :
                                           'Account meets auto-verification criteria'
                            }
                        };
                    }
                }
                
                if (isCurrentlyVerified) {
                    console.log('✅ User is verified! Returning approved status');
                    return { 
                        status: 'approved', 
                        is_verified: true,
                        application: {
                            business_name: profileData.business_name || 
                                          (profileData.first_name && profileData.last_name ? 
                                           `${profileData.first_name} ${profileData.last_name}` : 
                                           profileData.username || 'Verified User'),
                            business_license: 'Legacy Verification',
                            created_at: profileData.verified_at || profileData.date_joined || new Date().toISOString(),
                            description: 'Previously verified user'
                        }
                    };
                }
                
                // Check if user was previously verified but no longer is (could be revoked)
                if (profileData.was_verified || profileData.verification_revoked || profileData.verification_status === 'revoked') {
                    console.log('⚠️ User verification was revoked');
                    return {
                        status: 'revoked',
                        is_verified: false,
                        application: {
                            business_name: profileData.business_name || 'Previously Verified User',
                            revocation_reason: profileData.revocation_reason || 'Verification was revoked by administrator',
                            created_at: profileData.date_joined || new Date().toISOString()
                        }
                    };
                }
                
                console.log('ℹ️ User is not verified in profile, checking verification endpoint...');
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
                                <p class="verification-status-subtitle">🎉 You are already verified!</p>
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
                            ${application ? `
                                <div class="verification-details">
                                    <h4>Verification Details:</h4>
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
                        </div>
                        <div class="verification-note">
                            <p><small><i class="fas fa-info-circle"></i> If you believe your verification was removed in error, please contact support.</small></p>
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

            case 'revoked':
                panelHTML = `
                    <div class="verification-status-card revoked">
                        <div class="verification-status-header">
                            <i class="fas fa-exclamation-triangle verification-status-icon"></i>
                            <div>
                                <h3 class="verification-status-title">Verification Revoked</h3>
                                <p class="verification-status-subtitle">Your verification has been removed</p>
                            </div>
                        </div>
                        <div class="verification-status-content">
                            <p>Your verification status has been revoked by an administrator.</p>
                            ${application && application.revocation_reason ? `
                                <div class="revocation-reason">
                                    <h4>Reason:</h4>
                                    <p>${application.revocation_reason}</p>
                                </div>
                            ` : ''}
                            <p>If you believe this was done in error, please contact support. You may also reapply for verification after addressing any issues.</p>
                        </div>
                        <div class="verification-status-actions">
                            <button id="reapplyForVerification" class="btn btn-primary">
                                <i class="fas fa-redo"></i>
                                Reapply for Verification
                            </button>
                            <a href="Contact.html" class="btn btn-secondary">
                                <i class="fas fa-envelope"></i>
                                Contact Support
                            </a>
                        </div>
                    </div>
                `;
                break;
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
        
        // First, check if user is already verified and prevent reapplication
        try {
            const currentStatus = await this.checkVerificationStatus();
            if (currentStatus.is_verified || currentStatus.status === 'approved') {
                console.log('🚫 User is already verified, preventing new application');
                this.showToast('You are already verified! No need to apply again.', 'info');
                return;
            }
        } catch (error) {
            console.warn('⚠️ Could not check verification status before showing modal:', error);
        }
        
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
                
                // Double-check: if user is verified, they shouldn't be updating
                if (verificationData.is_verified || verificationData.status === 'approved') {
                    console.log('🚫 User is verified, no need to update application');
                    this.showToast('You are already verified!', 'info');
                    return;
                }
                
                if (verificationData.application) {
                    this.populateApplicationForm(verificationData.application);
                }
            } catch (error) {
                console.error('❌ Error loading application data:', error);
            }
        }

        console.log('✅ Opening modal...');
        modal.style.display = 'flex';
        modal.classList.add('active');
        
        // Don't hide body overflow, just add modal class for better control
        document.body.classList.add('modal-open');
        
        this.showToast('Application form opened', 'success');
    }

    // Close application modal
    closeApplicationModal() {
        const modal = document.getElementById('applicationModal');
        if (!modal) return;

        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        
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
        
        // First, check if user is already verified
        try {
            const currentStatus = await this.checkVerificationStatus();
            if (currentStatus.is_verified || currentStatus.status === 'approved') {
                console.log('🚫 User is already verified, preventing application submission');
                this.showToast('You are already verified! No need to submit a new application.', 'info');
                this.closeApplicationModal();
                return;
            }
        } catch (error) {
            console.warn('⚠️ Could not check verification status before submission:', error);
        }
        
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

    // Helper method to check if staff should be considered verified
    shouldStaffBeVerified(profileData) {
        // Only consider staff as verified if they have additional verification indicators
        return profileData.is_staff && (
            profileData.username?.toLowerCase().includes('admin') ||
            profileData.username?.toLowerCase().includes('staff') ||
            profileData.email?.includes('admin') ||
            profileData.role?.toLowerCase().includes('admin') ||
            // Staff with business information should be verified
            (profileData.business_name || profileData.company_name)
        );
    }

    // Helper method to check if superuser should be considered verified
    shouldSuperuserBeVerified(profileData) {
        // Superusers are typically verified, but let's be more specific
        return profileData.is_superuser && (
            profileData.username !== 'testuser' &&
            profileData.username !== 'test' &&
            !profileData.username?.toLowerCase().includes('test')
        );
    }

    // Helper method to check verification from user groups
    checkVerificationFromGroups(profileData) {
        if (!profileData.groups || !Array.isArray(profileData.groups)) {
            return false;
        }
        
        return profileData.groups.some(group => {
            const groupName = (group.name || group).toLowerCase();
            return groupName.includes('verified') ||
                   groupName.includes('contributor') ||
                   groupName.includes('chef') ||
                   groupName.includes('business') ||
                   groupName.includes('premium') ||
                   groupName.includes('approved');
        });
    }

    // Helper method to check verification from user roles
    checkVerificationFromRoles(profileData) {
        const role = profileData.role || profileData.user_role || profileData.account_type;
        if (!role) return false;
        
        const roleString = role.toString().toLowerCase();
        return roleString.includes('verified') ||
               roleString.includes('contributor') ||
               roleString.includes('chef') ||
               roleString.includes('business') ||
               roleString.includes('premium') ||
               roleString.includes('pro');
    }

    // Enhanced verification detection with fuzzy matching
    detectVerificationFromAnyField(profileData) {
        // Convert profile data to string and search for verification patterns
        const profileString = JSON.stringify(profileData).toLowerCase();
        
        // Look for verification-related terms in the entire profile
        const verificationTerms = [
            'verified', 'approved', 'confirmed', 'validated',
            'contributor', 'chef', 'business', 'premium'
        ];
        
        return verificationTerms.some(term => {
            const regex = new RegExp(`"[^"]*${term}[^"]*"\\s*:\\s*(?:true|"true"|"approved"|"verified"|"yes"|1)`, 'i');
            return regex.test(profileString);
        });
    }

    // Helper methods for enhanced verification detection
    isStaffOrAdmin(profileData) {
        return profileData.is_staff === true || 
               profileData.is_superuser === true ||
               profileData.role === 'admin' ||
               profileData.role === 'staff' ||
               profileData.user_type === 'admin' ||
               profileData.user_type === 'staff';
    }

    hasVerificationGroups(profileData) {
        if (!profileData.groups || !Array.isArray(profileData.groups)) return false;
        
        const verificationGroupNames = [
            'verified', 'verified_users', 'verified_contributors', 
            'contributors', 'content_creators', 'chefs', 
            'verified_chefs', 'premium_users'
        ];
        
        return profileData.groups.some(group => {
            const groupName = group.name ? group.name.toLowerCase() : '';
            return verificationGroupNames.some(vgName => groupName.includes(vgName));
        });
    }

    hasVerificationPermissions(profileData) {
        if (!profileData.user_permissions && !profileData.permissions) return false;
        
        const permissions = profileData.user_permissions || profileData.permissions || [];
        const verificationPerms = [
            'can_create_recipes', 'can_publish_recipes', 'verified_user',
            'contributor', 'content_creator', 'chef_permissions'
        ];
        
        return permissions.some(perm => {
            const permName = typeof perm === 'string' ? perm.toLowerCase() : 
                           (perm.codename ? perm.codename.toLowerCase() : '');
            return verificationPerms.some(vPerm => permName.includes(vPerm));
        });
    }

    fuzzyVerificationDetection(profileData) {
        // Check for any field that might indicate verification
        const possibleVerificationFields = [
            'verified', 'is_verified', 'verification_status', 'verification_approved',
            'verified_at', 'verification_date', 'approved_at', 'contributor_status',
            'chef_verified', 'content_creator', 'premium_user', 'verified_contributor'
        ];
        
        for (const field of possibleVerificationFields) {
            const value = profileData[field];
            if (value === true || value === 'approved' || value === 'verified' || 
                value === 'active' || value === 'confirmed') {
                console.log(`🔍 Fuzzy detection found verification in field: ${field} = ${value}`);
                return true;
            }
        }
        
        // Check nested objects
        if (profileData.profile) {
            return this.fuzzyVerificationDetection(profileData.profile);
        }
        
        if (profileData.user_profile) {
            return this.fuzzyVerificationDetection(profileData.user_profile);
        }
        
        return false;
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

    // Helper method: Check if staff should be considered verified
    shouldStaffBeVerified(profileData) {
        // Staff members are generally verified unless explicitly excluded
        // You can add logic here to exclude certain staff roles if needed
        return profileData.is_staff === true && !profileData.verification_revoked;
    }

    // Helper method: Check if superuser should be considered verified
    shouldSuperuserBeVerified(profileData) {
        // Superusers are generally verified unless explicitly excluded
        return profileData.is_superuser === true && !profileData.verification_revoked;
    }

    // Helper method: Check verification from user groups
    checkVerificationFromGroups(profileData) {
        if (!profileData.groups || !Array.isArray(profileData.groups)) {
            return false;
        }

        // Check for verification-related groups
        const verificationGroups = ['verified', 'contributors', 'verified_users', 'business_verified', 'moderators'];
        return profileData.groups.some(group => {
            const groupName = typeof group === 'string' ? group : group.name;
            return verificationGroups.some(vGroup => 
                groupName.toLowerCase().includes(vGroup.toLowerCase())
            );
        });
    }

    // Helper method: Check verification from user roles
    checkVerificationFromRoles(profileData) {
        if (!profileData.roles && !profileData.role) {
            return false;
        }

        const roles = profileData.roles || [profileData.role];
        const verificationRoles = ['verified', 'contributor', 'business', 'moderator', 'chef', 'cook'];
        
        return roles.some(role => {
            const roleName = typeof role === 'string' ? role : role.name;
            return verificationRoles.some(vRole => 
                roleName.toLowerCase().includes(vRole.toLowerCase())
            );
        });
    }

    // Helper method: Check verification from user permissions
    checkVerificationFromPermissions(profileData) {
        if (!profileData.user_permissions && !profileData.permissions) {
            return false;
        }

        const permissions = profileData.user_permissions || profileData.permissions || [];
        const verificationPermissions = [
            'can_verify', 'verified_user', 'business_user', 'contributor',
            'create_recipe', 'verified_contributor', 'premium_user'
        ];
        
        return permissions.some(permission => {
            const permissionName = typeof permission === 'string' ? permission : permission.name || permission.codename;
            return verificationPermissions.some(vPerm => 
                permissionName.toLowerCase().includes(vPerm.toLowerCase())
            );
        });
    }

    // Enhanced verification detection with fuzzy matching
    fuzzyVerificationDetection(profileData) {
        console.log('🔍 Running fuzzy verification detection...');
        
        // Convert profile data to searchable text
        const profileText = JSON.stringify(profileData).toLowerCase();
        
        // Look for verification-related patterns in the data
        const verificationPatterns = [
            'verified.*true',
            'verification.*approv',
            'verification.*success',
            'status.*verified',
            'verified.*user',
            'contributor.*verified',
            'business.*verified',
            'account.*verified'
        ];

        for (const pattern of verificationPatterns) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(profileText)) {
                console.log('✅ Fuzzy match found:', pattern);
                return true;
            }
        }

        return false;
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
