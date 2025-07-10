// Initialize recipe detail page with comprehensive error handling
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Recipe Detail Page DOM loaded');
    
    // Check network connectivity first
    const networkStatus = navigator.onLine ? 'online' : 'offline';
    console.log(`📡 Network status: ${networkStatus}`);
    
    if (!navigator.onLine) {
        showDetailedError({
            message: 'You appear to be offline. Please check your internet connection.'
        });
        return;
    }
    
    // Check if API is accessible (optional health check)
    try {
        console.log('🔍 Testing API connectivity...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // Shorter timeout
        
        const apiTest = await fetch('https://njoya.pythonanywhere.com/api/', { 
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
            cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        console.log(`🌐 API connection test completed with status: ${apiTest.status}`);
    } catch (apiError) {
        console.warn('⚠️ API connectivity test failed:', apiError.message);
        // Continue anyway, individual requests will handle their own errors
    }
    
    // Verify core dependencies are loaded
    const dependencies = [
        { name: 'utils.js', variable: 'RecipeAPI' },
        { name: 'ingredient-parser.js', variable: 'IngredientParser' },
        { name: 'enhanced-recipe-api.js', variable: 'enhancedRecipeAPI' }
    ];
    
    const missingDeps = dependencies.filter(dep => 
        window[dep.variable] === undefined
    );
    
    if (missingDeps.length > 0) {
        console.error('❌ Missing dependencies:', missingDeps.map(d => d.name).join(', '));
        showDetailedError({
            message: `Required scripts are missing: ${missingDeps.map(d => d.name).join(', ')}`,
            type: 'dependency_error'
        });
        return;
    }

    try {
        console.log('🚀 Initializing Recipe Detail Manager');
        window.recipeDetailManager = new RecipeDetailManager();
        console.log('✅ Recipe Detail Manager initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Recipe Detail Page:', error);
        showDetailedError({
            message: `Failed to initialize recipe page: ${error.message || 'Unknown error'}`,
            originalError: error
        });
    }
    
    // Enhanced error display function with troubleshooting suggestions
    function showDetailedError(error) {
        // Show an error message on the page
        const errorContainer = document.createElement('div');
        errorContainer.style.margin = '50px auto';
        errorContainer.style.padding = '25px';
        errorContainer.style.maxWidth = '700px';
        errorContainer.style.backgroundColor = '#ffebee';
        errorContainer.style.border = '1px solid #f44336';
        errorContainer.style.borderRadius = '8px';
        errorContainer.style.color = '#c62828';
        errorContainer.style.textAlign = 'center';
        errorContainer.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        errorContainer.style.fontFamily = '"Poppins", sans-serif';
        
        // Get recipe ID for diagnostic
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = urlParams.get('id') || 'not provided';
        
        // Determine error type and suggestions
        let errorType = error.type || 'unknown';
        let errorMessage = error.message || (typeof error === 'string' ? error : 'Unknown error');
        let suggestions = [];
        
        // Add specific troubleshooting suggestions
        if (errorType === 'dependency_error' || errorMessage.includes('is not defined') || 
            errorMessage.includes('missing') && errorMessage.includes('script')) {
            suggestions = [
                'Clear your browser cache and reload the page',
                'Try using a different browser',
                'Make sure all script files are properly loaded'
            ];
        } else if (!navigator.onLine || errorMessage.includes('offline')) {
            suggestions = [
                'Check your internet connection',
                'Make sure you\'re connected to the internet',
                'Your firewall might be blocking connections'
            ];
        } else {
            suggestions = [
                'Refresh the page and try again',
                'Return to the recipes list and select this recipe again',
                'Try clearing your browser cookies and cache'
            ];
        }
        
        // Diagnostic info
        const diagnosticInfo = {
            url: window.location.href,
            recipeId: recipeId,
            browserInfo: navigator.userAgent,
            timestamp: new Date().toISOString(),
            networkStatus: navigator.onLine ? 'online' : 'offline',
            errorMessage: errorMessage,
            errorType: errorType,
            errorStack: error.originalError ? error.originalError.stack : (error.stack || '')
        };
        
        // Create suggestions HTML
        const suggestionsHtml = suggestions.map(s => `<li style="margin-bottom:8px;">${s}</li>`).join('');
        
        errorContainer.innerHTML = `
            <div style="font-size:40px;color:#e53935;margin-bottom:20px;">
                <i class="fas fa-utensils" style="opacity:0.7;"></i>
            </div>
            <h3 style="margin-bottom:15px;font-size:22px;">Unable to Load Recipe</h3>
            <p style="margin-bottom:20px;font-size:16px;line-height:1.5;">We encountered an error while trying to display this recipe.</p>
            
            <div style="text-align:left;background:#f8f8f8;padding:15px;margin:15px 0;border-radius:4px;">
                <p><strong>Recipe ID:</strong> ${recipeId}</p>
                <p><strong>Error:</strong> ${diagnosticInfo.errorMessage}</p>
            </div>
            
            <div style="text-align:left;margin:20px 0;padding:15px;border:1px dashed #4CAF50;border-radius:4px;background:#f1f8e9;">
                <h4 style="color:#2E7D32;margin-bottom:10px;">Troubleshooting Suggestions</h4>
                <ul style="padding-left:20px;text-align:left;">${suggestionsHtml}</ul>
            </div>
            
            <details style="text-align:left;margin-top:20px;">
                <summary style="cursor:pointer;color:#2196F3;padding:5px 0;">Technical Details</summary>
                <pre style="background:#f5f5f5;padding:10px;margin-top:10px;overflow:auto;max-height:200px;font-size:12px;">${JSON.stringify(diagnosticInfo, null, 2)}</pre>
            </details>
            
            <div style="margin-top:25px;">
                <button onclick="location.reload()" style="margin-right:10px;padding:10px 24px;background:#2196F3;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;">
                    <i class="fas fa-sync-alt" style="margin-right:5px;"></i> Reload Page
                </button>
                <button onclick="window.location.href='Recipes.html'" style="padding:10px 24px;background:#757575;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;">
                    <i class="fas fa-arrow-left" style="margin-right:5px;"></i> Back to Recipes
                </button>
            </div>
        `;
        
        // Find a good place to insert the error message
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        
        const container = document.getElementById('recipeDetailContainer') || document.getElementById('recipeContent') || document.body;
        
        // Clear existing content if it's the body
        if (container === document.body) {
            Array.from(container.children).forEach(child => {
                if (child.tagName !== 'SCRIPT') {
                    child.style.display = 'none';
                }
            });
        }
        
        container.prepend(errorContainer);
    }
});
