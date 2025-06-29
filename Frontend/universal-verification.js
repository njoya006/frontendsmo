// ChopSmo Universal Verification Logic
// Production-ready verification system that works for all users
// Handles all possible backend verification patterns and flags

class UniversalVerification {
    constructor() {
        this.baseUrl = 'https://njoya.pythonanywhere.com';
        this.authToken = this.getAuthToken();
        this.verificationCache = new Map();
        this.cacheExpiration = 30 * 1000; // 30 seconds for more responsive updates
        this.lastCheck = 0;
        this.checkInterval = 15 * 1000; // Check every 15 seconds if needed
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

    // Universal verification status check - works for all users
    async getUniversalVerificationStatus(userId = null) {
        const cacheKey = userId || 'current-user';
        const cached = this.verificationCache.get(cacheKey);

        if (this.isCacheValid(cached)) {
            return cached.data;
        }

        try {
            // First, get user profile data
            let profileData = null;
            
            if (!userId) {
                // For current user
                const profileResponse = await fetch(`${this.baseUrl}/api/users/profile/`, {
                    headers: this.getHeaders()
                });
                
                if (profileResponse.ok) {
                    profileData = await profileResponse.json();
                }
            } else {
                // For specific user (if endpoint exists)
                try {
                    const userResponse = await fetch(`${this.baseUrl}/api/users/${userId}/`, {
                        headers: this.getHeaders()
                    });
                    if (userResponse.ok) {
                        profileData = await userResponse.json();
                    }
                } catch (e) {
                    // Endpoint might not exist, continue with verification endpoint only
                }
            }

            // Check verification using comprehensive pattern matching
            let isVerified = false;
            let verificationSource = 'none';
            let applicationData = null;

            if (profileData) {
                const verificationResult = this.checkAllVerificationPatterns(profileData);
                isVerified = verificationResult.isVerified;
                verificationSource = verificationResult.source;
                
                if (isVerified) {
                    applicationData = {
                        business_name: this.extractBusinessName(profileData),
                        business_license: verificationResult.source,
                        created_at: this.extractVerificationDate(profileData),
                        description: `Verified via ${verificationResult.source}`
                    };
                }
            }

            // Also check dedicated verification endpoint
            if (!isVerified) {
                try {
                    let verificationUrl = `${this.baseUrl}/api/verification/status/`;
                    if (userId) {
                        verificationUrl += `?user_id=${userId}`;
                    }

                    const verificationResponse = await fetch(verificationUrl, {
                        headers: this.getHeaders()
                    });

                    if (verificationResponse.ok) {
                        const verificationData = await verificationResponse.json();
                        
                        if (verificationData.status === 'approved' || verificationData.is_verified) {
                            isVerified = true;
                            verificationSource = 'verification_endpoint';
                            applicationData = verificationData.application || applicationData;
                        }
                    }
                } catch (e) {
                    // Verification endpoint might not exist, continue
                }
            }

            // Prepare result
            const result = {
                status: isVerified ? 'approved' : 'not_applied',
                is_verified: isVerified,
                verification_source: verificationSource,
                application: applicationData,
                profile_data: profileData
            };

            // Cache the result
            this.verificationCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;

        } catch (error) {
            console.warn('⚠️ Universal verification check failed:', error);
            return {
                status: 'error',
                is_verified: false,
                verification_source: 'error',
                application: null
            };
        }
    }

    // Comprehensive verification pattern checking
    checkAllVerificationPatterns(profileData) {
        // First check if verification is explicitly revoked or disabled
        if (profileData.verification_revoked === true || 
            profileData.verification_disabled === true ||
            profileData.is_banned === true ||
            profileData.account_disabled === true ||
            profileData.verification_status === 'revoked' ||
            profileData.verification_status === 'disabled' ||
            profileData.verification_status === 'rejected') {
            console.log('❌ Verification explicitly revoked or disabled');
            return { isVerified: false, source: 'explicitly_revoked' };
        }

        const checks = [
            // Direct verification flags
            { check: () => profileData.is_verified === true, source: 'is_verified_flag' },
            { check: () => profileData.verified === true, source: 'verified_flag' },
            { check: () => profileData.verification_approved === true, source: 'verification_approved_flag' },
            
            // Status-based verification
            { check: () => profileData.verification_status === 'approved', source: 'verification_status_approved' },
            { check: () => profileData.verification_status === 'verified', source: 'verification_status_verified' },
            { check: () => profileData.user_verification === 'approved', source: 'user_verification_approved' },
            { check: () => profileData.user_verification === true, source: 'user_verification_true' },
            
            // Staff/admin verification (with validation)
            { check: () => profileData.is_staff === true && this.shouldStaffBeVerified(profileData), source: 'staff_verification' },
            { check: () => profileData.is_superuser === true && this.shouldSuperuserBeVerified(profileData), source: 'superuser_verification' },
            
            // Nested profile verification
            { check: () => profileData.profile?.is_verified === true, source: 'nested_profile_verified' },
            { check: () => profileData.profile?.verified === true, source: 'nested_profile_verified_flag' },
            { check: () => profileData.profile?.verification_status === 'approved', source: 'nested_profile_status' },
            
            // Alternative field patterns
            { check: () => profileData.user_verified === true, source: 'user_verified_flag' },
            { check: () => profileData.verified_user === true, source: 'verified_user_flag' },
            { check: () => profileData.account_verified === true, source: 'account_verified_flag' },
            { check: () => profileData.business_verified === true, source: 'business_verified_flag' },
            { check: () => profileData.is_contributor === true, source: 'contributor_flag' },
            { check: () => profileData.contributor_status === 'verified', source: 'contributor_status_verified' },
            { check: () => profileData.chef_verified === true, source: 'chef_verified_flag' },
            { check: () => profileData.content_creator_verified === true, source: 'content_creator_verified' },
            
            // Date-based verification
            { check: () => this.hasValidVerificationDate(profileData), source: 'verification_date' },
            
            // Group/role-based verification
            { check: () => this.checkVerificationFromGroups(profileData), source: 'group_verification' },
            { check: () => this.checkVerificationFromRoles(profileData), source: 'role_verification' },
            { check: () => this.checkVerificationFromPermissions(profileData), source: 'permission_verification' },
            
            // Complex verification patterns
            { check: () => profileData.email_verified === true && profileData.profile_verified === true, source: 'compound_verification' },
            { check: () => profileData.account_type === 'business' && profileData.business_approved === true, source: 'business_account_verified' },
            { check: () => profileData.user_type === 'verified', source: 'user_type_verified' },
            
            // Fuzzy pattern matching (last resort)
            { check: () => this.fuzzyVerificationDetection(profileData), source: 'fuzzy_pattern_match' }
        ];

        // Run all checks and return first match
        for (const { check, source } of checks) {
            try {
                if (check()) {
                    return { isVerified: true, source };
                }
            } catch (e) {
                // Continue to next check if this one fails
                continue;
            }
        }

        return { isVerified: false, source: 'none' };
    }

    // Helper: Should staff be considered verified
    shouldStaffBeVerified(profileData) {
        // Staff should be verified unless explicitly revoked
        return !profileData.verification_revoked && !profileData.verification_disabled;
    }

    // Helper: Should superuser be considered verified
    shouldSuperuserBeVerified(profileData) {
        // Superuser should be verified unless explicitly revoked
        return !profileData.verification_revoked && !profileData.verification_disabled;
    }

    // Helper: Check verification from user groups
    checkVerificationFromGroups(profileData) {
        if (!profileData.groups || !Array.isArray(profileData.groups)) {
            return false;
        }

        const verificationGroups = [
            'verified', 'contributors', 'verified_users', 'business_verified', 
            'moderators', 'chefs', 'content_creators', 'premium_users', 'approved_users'
        ];

        return profileData.groups.some(group => {
            const groupName = (typeof group === 'string' ? group : group.name || '').toLowerCase();
            return verificationGroups.some(vGroup => 
                groupName.includes(vGroup.toLowerCase())
            );
        });
    }

    // Helper: Check verification from user roles
    checkVerificationFromRoles(profileData) {
        const roles = profileData.roles || (profileData.role ? [profileData.role] : []);
        const verificationRoles = [
            'verified', 'contributor', 'business', 'moderator', 'chef', 
            'cook', 'content_creator', 'premium', 'approved'
        ];
        
        return roles.some(role => {
            const roleName = (typeof role === 'string' ? role : role.name || '').toLowerCase();
            return verificationRoles.some(vRole => 
                roleName.includes(vRole.toLowerCase())
            );
        });
    }

    // Helper: Check verification from permissions
    checkVerificationFromPermissions(profileData) {
        const permissions = profileData.user_permissions || profileData.permissions || [];
        const verificationPerms = [
            'verified', 'contributor', 'business', 'chef', 'moderator', 
            'content_creator', 'premium', 'approved'
        ];
        
        return permissions.some(perm => {
            const permName = (perm.name || perm.codename || perm || '').toLowerCase();
            return verificationPerms.some(vPerm => 
                permName.includes(vPerm.toLowerCase())
            );
        });
    }

    // Helper: Check if user has valid verification date
    hasValidVerificationDate(profileData) {
        const dateFields = ['verified_at', 'verification_date', 'date_verified', 'approval_date'];
        
        for (const field of dateFields) {
            if (profileData[field]) {
                try {
                    const date = new Date(profileData[field]);
                    return date <= new Date(); // Verification date should be in the past
                } catch (e) {
                    continue;
                }
            }
        }
        
        return false;
    }

    // Helper: Fuzzy verification detection
    fuzzyVerificationDetection(profileData) {
        const profileText = JSON.stringify(profileData).toLowerCase();
        
        const verificationPatterns = [
            /verified[_\s]*true/,
            /verification[_\s]*approv/,
            /verification[_\s]*success/,
            /status[_\s]*verified/,
            /verified[_\s]*user/,
            /contributor[_\s]*verified/,
            /business[_\s]*verified/,
            /account[_\s]*verified/,
            /chef[_\s]*verified/,
            /creator[_\s]*verified/
        ];

        return verificationPatterns.some(pattern => pattern.test(profileText));
    }

    // Helper: Extract business name for application data
    extractBusinessName(profileData) {
        return profileData.business_name || 
               profileData.company_name ||
               (profileData.first_name && profileData.last_name ? 
                `${profileData.first_name} ${profileData.last_name}` : 
                profileData.display_name || profileData.username || 'Verified User');
    }

    // Helper: Extract verification date
    extractVerificationDate(profileData) {
        const dateFields = ['verified_at', 'verification_date', 'date_verified', 'approval_date', 'date_joined'];
        
        for (const field of dateFields) {
            if (profileData[field]) {
                return profileData[field];
            }
        }
        
        return new Date().toISOString();
    }

    // Check if user can apply for verification
    canApplyForVerification(verificationStatus) {
        // User can apply if:
        // 1. Not currently verified
        // 2. No pending application
        // 3. Not explicitly banned from verification
        return !verificationStatus.is_verified && 
               verificationStatus.status !== 'pending' &&
               verificationStatus.status !== 'approved' &&
               !verificationStatus.profile_data?.verification_banned;
    }

    // Clear verification cache
    clearCache() {
        this.verificationCache.clear();
        console.log('🧹 Verification cache cleared');
    }

    // Force refresh verification status (ignores cache)
    async forceRefreshVerificationStatus(userId = null) {
        const cacheKey = userId || 'current-user';
        this.verificationCache.delete(cacheKey);
        console.log('🔄 Forcing verification status refresh for:', cacheKey);
        return await this.getUniversalVerificationStatus(userId);
    }

    // Check if verification status should be refreshed
    shouldRefreshVerification() {
        const now = Date.now();
        return (now - this.lastCheck) > this.checkInterval;
    }

    // Periodic verification check
    async periodicVerificationCheck(userId = null) {
        if (!this.shouldRefreshVerification()) {
            return null; // Skip if checked recently
        }
        
        this.lastCheck = Date.now();
        console.log('🔍 Performing periodic verification check...');
        
        try {
            const freshStatus = await this.forceRefreshVerificationStatus(userId);
            console.log('✅ Periodic check result:', freshStatus.is_verified ? 'VERIFIED' : 'NOT VERIFIED');
            return freshStatus;
        } catch (error) {
            console.warn('⚠️ Periodic verification check failed:', error);
            return null;
        }
    }

    // Get verification status for current user (main public method)
    async getCurrentUserVerificationStatus() {
        return await this.getUniversalVerificationStatus();
    }

    // Get verification status for specific user (if authorized)
    async getUserVerificationStatus(userId) {
        return await this.getUniversalVerificationStatus(userId);
    }
}

// Create global instance
window.universalVerification = new UniversalVerification();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalVerification;
}

// Initialize and make available globally
console.log('🔧 Universal Verification System loaded');
