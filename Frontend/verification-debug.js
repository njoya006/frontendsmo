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

// Auto-run debug after a delay
setTimeout(debugVerificationSystem, 2000);

// Make it available globally
window.debugVerificationSystem = debugVerificationSystem;

console.log('🛠️ Verification debug utility loaded. Run debugVerificationSystem() anytime.');
