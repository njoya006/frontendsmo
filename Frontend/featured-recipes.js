const resolveFeaturedRecipesEndpoint = () => {
    const base = (() => {
        if (typeof window !== 'undefined') {
            if (typeof window.buildChopsmoApiUrl === 'function') {
                return null; // we'll handle via helper below
            }
            if (typeof window.getChopsmoApiBaseUrl === 'function') {
                const resolved = window.getChopsmoApiBaseUrl();
                if (resolved) return resolved;
            }
            if (window.CHOPSMO_CONFIG && window.CHOPSMO_CONFIG.API_BASE_URL) {
                return window.CHOPSMO_CONFIG.API_BASE_URL;
            }
        }
        return 'http://56.228.22.20';
    })();

    if (typeof window !== 'undefined' && typeof window.buildChopsmoApiUrl === 'function') {
        return window.buildChopsmoApiUrl('/api/recipes/featured/');
    }

    const normalizedBase = (base || 'http://56.228.22.20').replace(/\/$/, '');
    return `${normalizedBase}/api/recipes/featured/`;
};

const FEATURED_RECIPES_ENDPOINT = resolveFeaturedRecipesEndpoint();

// Fetch and render featured recipes with verification badge
// Assumes universalVerification is loaded globally

async function fetchFeaturedRecipes() {
    try {
        const response = await fetch(FEATURED_RECIPES_ENDPOINT);
        if (!response.ok) throw new Error('Failed to fetch featured recipes');
        const recipes = await response.json();
        return recipes;
    } catch (e) {
        console.error('Error fetching featured recipes:', e);
        return [];
    }
}

function getVerificationBadgeHtml(isVerified, verifiedBadgeField) {
    if (verifiedBadgeField) {
        return `<span class="verified-badge" title="Verified Contributor"><i class="fas fa-check-circle"></i> Verified</span>`;
    }
    return isVerified
        ? `<span class="verified-badge" title="Verified Contributor"><i class="fas fa-check-circle"></i> Verified</span>`
        : '';
}

async function renderFeaturedRecipes() {
    const container = document.getElementById('featuredRecipesSection');
    if (!container) return;
    container.innerHTML = '<div class="featured-loading">Loading featured recipes...</div>';
    const recipes = await fetchFeaturedRecipes();
    if (!recipes.length) {
        container.innerHTML = '<div class="featured-error">No featured recipes available.</div>';
        return;
    }
    let html = '<div class="featured-recipes-list">';
    for (const recipe of recipes) {
        let isVerified = false;
        let badgeHtml = '';
        // Use verified_badge field if present
        const verifiedBadgeField = recipe.created_by && recipe.created_by.verified_badge;
        if (verifiedBadgeField) {
            badgeHtml = getVerificationBadgeHtml(false, verifiedBadgeField);
        } else if (window.universalVerification && recipe.created_by && recipe.created_by.id) {
            try {
                const status = await window.universalVerification.getUserVerificationStatus(recipe.created_by.id);
                isVerified = status && status.is_verified;
                badgeHtml = getVerificationBadgeHtml(isVerified);
            } catch (e) {
                // fallback: no badge
            }
        }
        html += `
        <div class="featured-recipe-card">
            <div class="featured-recipe-header">
                <span class="featured-recipe-title">${recipe.title || 'Untitled Recipe'}</span>
                ${badgeHtml}
            </div>
            <div class="featured-recipe-meta">
                <span class="featured-recipe-author">By: ${recipe.created_by?.username || 'Unknown'}</span>
            </div>
            <div class="featured-recipe-desc">${recipe.description || ''}</div>
            <a href="recipe-detail.html?id=${recipe.id}" class="btn btn-primary btn-sm">View Recipe</a>
        </div>
        `;
    }
    html += '</div>';
    container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', renderFeaturedRecipes);
