# Recipe Search Integration Guide

## Overview
The ChopSmo frontend now includes a complete recipe search and filtering system integrated into the Profile.html page. This guide explains how to properly integrate it with your Django backend.

## Frontend Implementation Status ✅

### Completed Features:
- ✅ **Recipe Search Tab**: Added to Profile.html navigation
- ✅ **Keyword Search**: Search recipes by title, description, ingredients
- ✅ **Ingredient-Based Search**: Get suggestions based on available ingredients
- ✅ **Advanced Filtering**: Filter by categories, meal types, tags
- ✅ **Responsive Design**: Works on all device sizes
- ✅ **Loading States**: Professional loading animations
- ✅ **Error Handling**: User-friendly error messages
- ✅ **API Integration**: RecipeAPI class in utils.js
- ✅ **Form Validation**: Input validation and sanitization

### Files Modified:
1. **Profile.html** - Main implementation
2. **utils.js** - API utilities and helper functions
3. **recipe-search-demo.html** - Testing guide

## Backend Requirements

### Required API Endpoints:

#### 1. Recipe Search
```
GET /api/recipes/?search=query&categories=cat&tags=tag&meal_type=type&cuisines=cuisine
```
**Expected Response:**
```json
{
  "results": [
    {
      "id": 1,
      "title": "Recipe Name",
      "description": "Recipe description",
      "image": "http://example.com/image.jpg",
      "prep_time": 30,
      "servings": 4,
      "tags": [{"name": "tag1"}],
      "categories": [{"name": "Main Course"}],
      "meal_type": "dinner"
    }
  ]
}
```

#### 2. Ingredient-Based Suggestions
```
POST /api/recipes/suggest-by-ingredients/
Body: {"ingredient_names": ["tomato", "onion", "chicken"]}
```
**Expected Response:**
```json
{
  "suggestions": [
    {
      "id": 1,
      "title": "Recipe Name",
      "description": "Recipe description",
      "image": "http://example.com/image.jpg",
      "missing_ingredients": ["ingredient1"],
      "message": "You have 3 out of 4 ingredients"
    }
  ]
}
```

#### 3. Filter Options
```
GET /api/recipes/categories/
GET /api/recipes/tags/
GET /api/recipes/cuisines/
```
**Expected Response:**
```json
[
  {"id": 1, "name": "Category Name"},
  {"id": 2, "name": "Another Category"}
]
```

## Configuration Steps

### 1. Update API Base URL
In Profile.html, find this line and update the URL:
```javascript
const recipeAPI = new RecipeAPI('http://localhost:8000'); // Update this URL
```

### 2. Authentication (Optional)
If your API requires authentication, the RecipeAPI class automatically handles tokens stored in localStorage or sessionStorage:
```javascript
// Set token after login
localStorage.setItem('authToken', 'your-jwt-token');
```

### 3. CORS Configuration
Ensure your Django backend allows requests from your frontend domain:
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add your frontend domain
]
```

## Testing Guide

### 1. Open Demo Page
```
recipe-search-demo.html
```

### 2. Test Search Functionality
1. Go to Profile.html
2. Click "Find Recipes" tab
3. Try keyword search with filters
4. Test ingredient-based search
5. Check browser console for API calls

### 3. Debugging
- Check Network tab in browser dev tools
- Look for CORS errors in console
- Verify API endpoint responses
- Test with different search terms

## API Response Handling

The frontend handles various response formats:
- **Images**: `image`, `image_url`, `photo` fields supported
- **Descriptions**: `description`, `summary`, `instructions` fields supported
- **Tags/Categories**: Array of objects or strings supported
- **Error handling**: Graceful fallbacks for missing data

## Customization Options

### 1. Styling
All styles are contained in Profile.html and can be customized:
- Color scheme via CSS variables
- Card layouts and animations
- Responsive breakpoints

### 2. API Endpoints
Update endpoints in utils.js RecipeAPI class:
```javascript
// In utils.js
async searchRecipes(query, filters = {}) {
    // Modify endpoint URL here
    const response = await fetch(`${this.baseUrl}/api/recipes/?${params}`);
}
```

### 3. Search Features
Add new filters or search options by:
1. Adding form fields in Profile.html
2. Updating API call parameters
3. Extending RecipeAPI methods

## Performance Optimizations

- ✅ Debounced search input
- ✅ Cached filter options
- ✅ Optimized DOM updates
- ✅ Lazy loading for large result sets
- ✅ Responsive image loading

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)  
- ✅ Safari (latest)
- ✅ Mobile browsers

## Troubleshooting

### Common Issues:

1. **No search results**: Check API endpoint URLs and CORS
2. **Filter options not loading**: Verify categories/tags endpoints
3. **Images not showing**: Check image URLs and CORS for images
4. **Authentication errors**: Verify token storage and headers

### Debug Commands:
```javascript
// In browser console
localStorage.getItem('authToken'); // Check auth token
window.RecipeAPI; // Check if utils.js loaded
```

## Next Steps

1. ✅ Frontend implementation complete
2. 🔄 Backend API integration
3. 🔄 Testing with real data
4. 🔄 Performance optimization
5. 🔄 User feedback integration

The frontend is fully ready for backend integration. Focus on implementing the required API endpoints and testing the complete flow.
