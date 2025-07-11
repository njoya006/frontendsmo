// API Validation Script for ChopSmo Enhanced Recipe API
// Run this in the browser console to test API functionality

(async function validateAPI() {
    console.log('🧪 Starting ChopSmo API Validation...');
    
    if (!window.enhancedRecipeAPI) {
        console.error('❌ Enhanced Recipe API not found!');
        return;
    }
    
    const api = window.enhancedRecipeAPI;
    const testRecipeId = '1';
    let passedTests = 0;
    let totalTests = 0;
    
    function logTest(testName, passed, details = '') {
        totalTests++;
        if (passed) {
            passedTests++;
            console.log(`✅ ${testName}: PASSED ${details}`);
        } else {
            console.error(`❌ ${testName}: FAILED ${details}`);
        }
    }
    
    // Test 1: API Initialization
    logTest('API Initialization', !!api, `Base URL: ${api.baseUrl}`);
    
    // Test 2: Auth Token Check
    const authToken = api.getAuthToken();
    logTest('Auth Token Check', typeof authToken === 'string', authToken ? 'Token present' : 'No token (may use mock data)');
    
    // Test 3: Online Status
    const isOnline = api.isOnline();
    logTest('Online Status Check', typeof isOnline === 'boolean', `Status: ${isOnline ? 'Online' : 'Offline'}`);
    
    // Test 4: API Status Check
    console.log('🔍 Testing API Status...');
    try {
        const apiStatus = await api.checkApiStatus();
        logTest('API Status Check', typeof apiStatus === 'boolean', `Available: ${apiStatus}`);
        console.log('📊 API Status Details:', api.apiStatus);
    } catch (error) {
        logTest('API Status Check', false, error.message);
    }
    
    // Test 5: Recipe Loading
    console.log('📖 Testing Recipe Loading...');
    try {
        const recipe = await api.getRecipe(testRecipeId);
        logTest('Recipe Loading', !!recipe && !!recipe.id, `Recipe: ${recipe?.title || 'N/A'}`);
    } catch (error) {
        logTest('Recipe Loading', false, error.message);
    }
    
    // Test 6: Ratings Loading
    console.log('⭐ Testing Ratings Loading...');
    try {
        const ratings = await api.getRecipeRatings(testRecipeId);
        logTest('Ratings Loading', !!ratings && typeof ratings.average_rating === 'number', 
                `Average: ${ratings?.average_rating || 0}, Total: ${ratings?.total_ratings || 0}`);
    } catch (error) {
        logTest('Ratings Loading', false, error.message);
    }
    
    // Test 7: Reviews Loading
    console.log('💬 Testing Reviews Loading...');
    try {
        const reviews = await api.getRecipeReviews(testRecipeId);
        logTest('Reviews Loading', !!reviews && Array.isArray(reviews.results), 
                `Count: ${reviews?.count || 0}, Results: ${reviews?.results?.length || 0}`);
    } catch (error) {
        logTest('Reviews Loading', false, error.message);
    }
    
    // Test 8: Rating Submission (will use mock if API unavailable)
    console.log('⭐ Testing Rating Submission...');
    try {
        const ratingResult = await api.submitRating(testRecipeId, 5);
        const hasUpdatedData = !!(ratingResult?.updatedRatings);
        logTest('Rating Submission', !!ratingResult?.success, 
                `Success: ${ratingResult?.success}, Has Updated Data: ${hasUpdatedData}`);
        
        if (hasUpdatedData) {
            console.log('📊 Updated Ratings:', ratingResult.updatedRatings);
        }
    } catch (error) {
        logTest('Rating Submission', false, error.message);
    }
    
    // Test 9: Review Submission (will use mock if API unavailable)
    console.log('💬 Testing Review Submission...');
    try {
        const reviewText = `Test review from validation script - ${new Date().toISOString()}`;
        const reviewResult = await api.submitReview(testRecipeId, 4, reviewText);
        const hasUpdatedData = !!(reviewResult?.updatedReviews || reviewResult?.updatedRatings);
        logTest('Review Submission', !!reviewResult?.success, 
                `Success: ${reviewResult?.success}, Has Updated Data: ${hasUpdatedData}`);
        
        if (hasUpdatedData) {
            console.log('📊 Updated Reviews:', reviewResult.updatedReviews);
            console.log('📊 Updated Ratings:', reviewResult.updatedRatings);
        }
    } catch (error) {
        logTest('Review Submission', false, error.message);
    }
    
    // Test 10: Cache Functionality
    console.log('💾 Testing Cache Functionality...');
    try {
        // Test cache set/get
        const testCacheKey = 'test_cache_key';
        const testCacheData = { test: 'data', timestamp: Date.now() };
        
        const setCacheResult = api.setCachedData(testCacheKey, testCacheData, 60000);
        const getCacheResult = api.getCachedData(testCacheKey);
        
        const cacheWorks = setCacheResult && getCacheResult && getCacheResult.data.test === 'data';
        logTest('Cache Functionality', cacheWorks, 'Set/Get operations');
        
        // Clean up test cache
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(`chopsmo_cache_${testCacheKey}`);
        }
    } catch (error) {
        logTest('Cache Functionality', false, error.message);
    }
    
    // Test 11: Debug Methods
    console.log('🔧 Testing Debug Methods...');
    try {
        // Test debug API status
        await api.debugApiStatus();
        logTest('Debug API Status', true, 'Check console for detailed output');
        
        // Test endpoint testing
        const testResult = await api.testEndpoint('/api/recipes/', 'GET');
        logTest('Endpoint Testing', !!testResult, `Status: ${testResult?.status || 'N/A'}`);
    } catch (error) {
        logTest('Debug Methods', false, error.message);
    }
    
    // Summary
    console.log('\n🏁 VALIDATION SUMMARY');
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
    
    const successRate = (passedTests / totalTests) * 100;
    if (successRate >= 80) {
        console.log('🎉 API Validation: EXCELLENT (80%+ tests passed)');
    } else if (successRate >= 60) {
        console.log('⚠️ API Validation: GOOD (60%+ tests passed)');
    } else {
        console.log('🔴 API Validation: NEEDS ATTENTION (<60% tests passed)');
    }
    
    console.log('\n📝 Next Steps:');
    if (!api.apiStatus.isAvailable) {
        console.log('• Check backend API server status');
        console.log('• Verify CORS configuration');
        console.log('• Check authentication token');
    } else {
        console.log('• API appears to be working well!');
        console.log('• Test with real recipe data on your pages');
    }
    
    return {
        passed: passedTests,
        total: totalTests,
        successRate: successRate,
        apiStatus: api.apiStatus
    };
})();
