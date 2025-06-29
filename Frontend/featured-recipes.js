// Fetch and render featured recipes with verification badge
// Assumes universalVerification is loaded globally

async function fetchFeaturedRecipes() {
    try {
        const response = await fetch('https://njoya.pythonanywhere.com/api/recipes/featured/');
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
