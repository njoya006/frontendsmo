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
                } catch (e) {}
            }

            // --- MAIN LOGIC: Use is_verified_contributor and verified_badge ---
            let isVerified = false;
            let badge = null;
            if (profileData) {
                isVerified = !!profileData.is_verified_contributor;
                badge = profileData.verified_badge || null;
            }

            const result = {
                status: isVerified ? 'approved' : 'not_applied',
                is_verified: isVerified,
                badge: badge,
                profile_data: profileData
            };

            this.verificationCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
            return result;
        } catch (error) {
            return {
                status: 'error',
                is_verified: false,
                badge: null,
                profile_data: null
            };
        }
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
