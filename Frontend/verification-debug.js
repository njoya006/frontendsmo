// Verification Debug Utility
// Add this script to any page to debug verification issues

function debugVerificationSystem() {
    console.log('🔍 DEBUG: Verification System Status Check');
    console.log('='.repeat(50));
    
    // Check if scripts are loaded
    console.log('📜 Script Status:');
    console.log('- verificationBadgeUtil exists:', typeof window.verificationBadgeUtil);
    console.log('- verificationSystem exists:', typeof window.verificationSystem);
    
    // Check DOM elements
    console.log('\n🏗️ DOM Elements:');
    console.log('- verificationPanel:', !!document.getElementById('verificationPanel'));
    console.log('- applicationModal:', !!document.getElementById('applicationModal'));
    console.log('- applyForVerification button:', !!document.getElementById('applyForVerification'));
    
    // Check auth status
    console.log('\n🔑 Authentication:');
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    console.log('- Auth token exists:', !!authToken);
    console.log('- Auth token preview:', authToken ? authToken.substring(0, 20) + '...' : 'None');
    
    // Check page
    console.log('\n📄 Current Page:');
    console.log('- Page:', window.location.pathname.split('/').pop());
    console.log('- URL:', window.location.href);
    
    // Check verification status
    if (window.verificationBadgeUtil) {
        console.log('\n🏅 Testing Verification Status...');
        window.verificationBadgeUtil.getVerificationStatus()
            .then(status => {
                console.log('- Verification status:', status);
            })
            .catch(error => {
                console.error('- Error getting verification status:', error);
            });
    }
    
    console.log('='.repeat(50));
}

// Debug function to check verification status manually
function debugMyVerificationStatus() {
    console.log('🔍 DEBUG: Checking My Verification Status');
    console.log('='.repeat(60));
    
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!authToken) {
        console.log('❌ No auth token found');
        return;
    }
    
    console.log('✅ Auth token found, checking profile...');
    
    fetch('https://njoya.pythonanywhere.com/api/users/profile/', {
        headers: {
            'Authorization': authToken.startsWith('Token ') ? authToken : `Token ${authToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('👤 Full Profile Data:');
        console.log(JSON.stringify(data, null, 2));
        
        console.log('\n🔍 Verification Fields Check:');
        console.log('- is_verified:', data.is_verified, typeof data.is_verified);
        console.log('- verified:', data.verified, typeof data.verified);
        console.log('- is_staff:', data.is_staff, typeof data.is_staff);
        console.log('- is_superuser:', data.is_superuser, typeof data.is_superuser);
        console.log('- verification_status:', data.verification_status);
        console.log('- verification_approved:', data.verification_approved);
        console.log('- verified_at:', data.verified_at);
        
        console.log('\n🎯 Verification Logic Test:');
        const checks = {
            'is_verified === true': data.is_verified === true,
            'verified === true': data.verified === true,
            'is_staff === true': data.is_staff === true,
            'is_superuser === true': data.is_superuser === true,
            'verification_status === approved': data.verification_status === 'approved',
            'verification_status === verified': data.verification_status === 'verified',
            'verification_approved === true': data.verification_approved === true
        };
        
        Object.entries(checks).forEach(([check, result]) => {
            console.log(`  ${result ? '✅' : '❌'} ${check}: ${result}`);
        });
        
        const isVerified = Object.values(checks).some(check => check);
        console.log(`\n🏆 FINAL RESULT: User is ${isVerified ? 'VERIFIED' : 'NOT VERIFIED'}`);
        
        if (!isVerified) {
            console.log('\n💡 SUGGESTIONS:');
            console.log('1. Check if backend has set is_verified=true for your user');
            console.log('2. Check if verification_status field exists and is set to "approved"');
            console.log('3. Verify that your user account has the verification flag properly set');
        }
        
        console.log('='.repeat(60));
    })
    .catch(error => {
        console.error('❌ Error fetching profile:', error);
    });
}

// Force refresh verification status (clears cache and reloads)
function forceRefreshVerificationStatus() {
    console.log('🔄 Force refreshing verification status...');
    
    // Clear verification cache
    if (window.verificationBadgeUtil) {
        window.verificationBadgeUtil.clearCache();
    }
    
    // Clear any cached verification data
    localStorage.removeItem('verificationStatus');
    sessionStorage.removeItem('verificationStatus');
    
    // Reload verification system
    if (window.verificationSystem) {
        console.log('🔄 Reloading verification system...');
        window.verificationSystem.initializeUI();
    }
    
    // Reload badge utility
    if (window.verificationBadgeUtil) {
        console.log('🔄 Reloading badge utility...');
        window.verificationBadgeUtil.refreshVerificationStatus();
    }
    
    console.log('✅ Verification status refresh complete!');
}

// Manual verification override for testing/admin purposes
function setManualVerificationStatus(isVerified = true, reason = 'Manual override') {
    const verificationData = {
        status: isVerified ? 'approved' : 'not_applied',
        is_verified: isVerified,
        application: isVerified ? {
            business_name: 'Manual Verification',
            business_license: 'Override',
            created_at: new Date().toISOString(),
            description: reason
        } : null
    };
    
    // Store in localStorage as override
    localStorage.setItem('verificationOverride', JSON.stringify(verificationData));
    
    console.log(`🔧 Manual verification status set to: ${isVerified ? 'VERIFIED' : 'NOT VERIFIED'}`);
    console.log('🔄 Refreshing verification system...');
    
    // Force refresh
    forceRefreshVerificationStatus();
    
    // Reload page after a short delay
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Clear manual override
function clearVerificationOverride() {
    localStorage.removeItem('verificationOverride');
    console.log('🗑️ Manual verification override cleared');
    forceRefreshVerificationStatus();
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Quick verification for your case
function verifyMyself() {
    setManualVerificationStatus(true, 'Admin self-verification');
}

// Universal Verification Test Utility
// This utility can test verification status for any user and apply universal fixes

function createUniversalVerificationTest() {
    return {
        // Test any user's verification status
        async testUserVerification(username = null) {
            console.log('🔍 UNIVERSAL VERIFICATION TEST');
            console.log('='.repeat(60));
            
            const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            if (!authToken) {
                console.log('❌ No auth token found');
                return;
            }
            
            try {
                const profileResponse = await fetch('https://njoya.pythonanywhere.com/api/users/profile/', {
                    headers: {
                        'Authorization': authToken.startsWith('Token ') ? authToken : `Token ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!profileResponse.ok) {
                    console.log('❌ Failed to fetch profile data');
                    return;
                }
                
                const profileData = await profileResponse.json();
                
                console.log('👤 Profile Data for:', profileData.username);
                console.log(JSON.stringify(profileData, null, 2));
                
                // Test all possible verification patterns
                const verificationTests = this.runAllVerificationTests(profileData);
                
                console.log('\n🧪 VERIFICATION TEST RESULTS:');
                Object.entries(verificationTests).forEach(([test, result]) => {
                    console.log(`  ${result ? '✅' : '❌'} ${test}: ${result}`);
                });
                
                const shouldBeVerified = Object.values(verificationTests).some(test => test);
                console.log(`\n🏆 RECOMMENDATION: User ${shouldBeVerified ? 'SHOULD BE' : 'SHOULD NOT BE'} verified`);
                
                if (shouldBeVerified && !this.checkBasicVerification(profileData)) {
                    console.log('\n💡 SUGGESTED ACTIONS:');
                    console.log('1. Set is_verified=True in backend');
                    console.log('2. OR set verification_status="approved"');
                    console.log('3. OR use manual override: setManualVerificationStatus(true)');
                    console.log('\n🔧 QUICK FIX: Run setManualVerificationStatus(true) to verify this user locally');
                }
                
                return { profileData, verificationTests, shouldBeVerified };
                
            } catch (error) {
                console.error('❌ Error testing verification:', error);
                return null;
            }
        },
        
        // Run all possible verification tests
        runAllVerificationTests(profileData) {
            return {
                'is_verified flag': profileData.is_verified === true,
                'verified flag': profileData.verified === true,
                'is_staff flag': profileData.is_staff === true,
                'is_superuser flag': profileData.is_superuser === true,
                'verification_status approved': profileData.verification_status === 'approved',
                'verification_status verified': profileData.verification_status === 'verified',
                'verification_approved flag': profileData.verification_approved === true,
                'admin username': profileData.username === 'admin' || profileData.username === 'njoya',
                'admin email': profileData.email && profileData.email.includes('admin'),
                'business_verified flag': profileData.business_verified === true,
                'is_contributor flag': profileData.is_contributor === true,
                'contributor_status': profileData.contributor_status === 'verified',
                'verified_at date exists': !!(profileData.verified_at),
                'verification_date exists': !!(profileData.verification_date),
                'account_type business': profileData.account_type === 'business',
                'user_type verified': profileData.user_type === 'verified',
                'chef_verified flag': profileData.chef_verified === true,
                'content_creator_verified': profileData.content_creator_verified === true,
                'has verification groups': this.hasVerificationGroups(profileData),
                'has verification roles': this.hasVerificationRoles(profileData),
                'has verification permissions': this.hasVerificationPermissions(profileData),
                'nested profile verified': profileData.profile?.is_verified === true || profileData.profile?.verified === true,
                'fuzzy pattern match': this.fuzzyVerificationPattern(profileData)
            };
        },
        
        // Check basic verification flags
        checkBasicVerification(profileData) {
            return profileData.is_verified === true || 
                   profileData.verified === true || 
                   profileData.verification_status === 'approved';
        },
        
        // Check groups
        hasVerificationGroups(profileData) {
            if (!profileData.groups || !Array.isArray(profileData.groups)) return false;
            const verificationGroups = ['verified', 'contributor', 'business', 'chef', 'premium', 'approved'];
            return profileData.groups.some(group => {
                const groupName = (group.name || group || '').toLowerCase();
                return verificationGroups.some(vg => groupName.includes(vg));
            });
        },
        
        // Check roles
        hasVerificationRoles(profileData) {
            const roles = profileData.roles || (profileData.role ? [profileData.role] : []);
            const verificationRoles = ['verified', 'contributor', 'business', 'chef', 'moderator'];
            return roles.some(role => {
                const roleName = (role.name || role || '').toLowerCase();
                return verificationRoles.some(vr => roleName.includes(vr));
            });
        },
        
        // Check permissions
        hasVerificationPermissions(profileData) {
            const permissions = profileData.user_permissions || profileData.permissions || [];
            const verificationPerms = ['verified', 'contributor', 'business', 'chef'];
            return permissions.some(perm => {
                const permName = (perm.name || perm.codename || perm || '').toLowerCase();
                return verificationPerms.some(vp => permName.includes(vp));
            });
        },
        
        // Fuzzy pattern matching
        fuzzyVerificationPattern(profileData) {
            const dataString = JSON.stringify(profileData).toLowerCase();
            const patterns = [
                'verified.*true', 'verification.*approv', 'status.*verified',
                'contributor.*true', 'business.*verified', 'chef.*verified'
            ];
            return patterns.some(pattern => new RegExp(pattern).test(dataString));
        },
        
        // Apply universal verification fix
        async applyUniversalVerificationFix() {
            console.log('🔧 Applying universal verification fix...');
            
            const testResult = await this.testUserVerification();
            if (!testResult) {
                console.log('❌ Could not test user verification');
                return;
            }
            
            const { profileData, verificationTests, shouldBeVerified } = testResult;
            
            if (shouldBeVerified) {
                console.log('✅ User should be verified, applying manual override...');
                setManualVerificationStatus(true, 'Universal auto-verification based on profile analysis');
            } else {
                console.log('ℹ️ User does not meet verification criteria');
                console.log('📝 Available options:');
                console.log('- setManualVerificationStatus(true) - Force verify');
                console.log('- Contact admin to set backend verification flags');
            }
        }
    };
}

// Create and expose the universal verification test
const universalVerificationTest = createUniversalVerificationTest();

// Add convenient global functions
window.testMyVerification = () => universalVerificationTest.testUserVerification();
window.applyUniversalVerificationFix = () => universalVerificationTest.applyUniversalVerificationFix();
window.universalVerificationTest = universalVerificationTest;

console.log('🧪 Universal Verification Test utility loaded!');
console.log('📋 Available functions:');
console.log('- testMyVerification() - Test your verification status');
console.log('- applyUniversalVerificationFix() - Auto-fix verification if criteria are met');
console.log('- universalVerificationTest.testUserVerification() - Detailed test');

// Auto-run debug after a delay
setTimeout(debugVerificationSystem, 2000);

// Auto-run debug function after page load
setTimeout(() => {
    if (window.location.pathname.includes('verification.html')) {
        debugMyVerificationStatus();
    }
}, 3000);

// Make it available globally
window.debugVerificationSystem = debugVerificationSystem;
window.debugMyVerificationStatus = debugMyVerificationStatus;
window.forceRefreshVerificationStatus = forceRefreshVerificationStatus;
window.setManualVerificationStatus = setManualVerificationStatus;
window.clearVerificationOverride = clearVerificationOverride;
window.verifyMyself = verifyMyself;

console.log('🛠️ Verification debug utility loaded. Run debugVerificationSystem() or debugMyVerificationStatus() anytime.');
console.log('🛠️ Additional debug functions loaded:');
console.log('- debugMyVerificationStatus() - Check your verification status');
console.log('- forceRefreshVerificationStatus() - Force refresh verification status');
console.log('🛠️ Manual verification functions added:');
console.log('- verifyMyself() - Verify yourself manually');
console.log('- setManualVerificationStatus(true/false, reason) - Set manual status');
console.log('- clearVerificationOverride() - Clear manual override');
