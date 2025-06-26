# Recipe Creation 400 Error - Diagnosis & Solutions

## Problem Summary
The frontend is receiving a **400 Bad Request** error when attempting to create new recipes via `POST /api/recipes/`. This indicates a backend validation or data format issue.

## Likely Causes & Solutions

### 1. **Field Name Mismatch** ⚠️
**Issue**: Frontend may be sending field names that don't match backend model expectations.

**Frontend sends:**
- `title`, `name`, `description`, `instructions`
- `ingredients` (as JSON strings)
- `category_names`, `cuisine_names`, `tag_names`

**Backend might expect:**
- Different field names (e.g., `recipe_name` instead of `name`)
- Different ingredient format
- Category/cuisine/tag IDs instead of names

**Solution**: Check Django model fields and serializer to match field names exactly.

### 2. **Ingredient Format Issue** 🔍
**Current format:**
```javascript
formData.append('ingredients', JSON.stringify({
    ingredient_name: 'Flour',
    quantity: '2',
    unit: 'cups'
}));
```

**Possible backend expectations:**
- Nested ingredient objects with different field names
- Separate arrays for names, quantities, units
- Pre-existing ingredient IDs instead of names

### 3. **Authentication/Authorization** 🔐
**Issue**: Token authentication might be failing or user lacks recipe creation permissions.

**Check:**
- Token format: `Token <token>` vs `Bearer <token>`
- Token validity and user permissions
- Django REST Framework authentication settings

### 4. **Content-Type Headers** 📨
**Issue**: Missing or incorrect headers for multipart/form-data.

**Current headers:**
```javascript
headers: {
    'Authorization': `Token ${token}`
}
```

**May need:**
```javascript
headers: {
    'Authorization': `Token ${token}`,
    // Note: Don't set Content-Type for FormData - browser sets it automatically
}
```

### 5. **Required Fields Missing** ❌
**Check if backend requires:**
- User/author field (auto-populated from token)
- Default values for optional fields
- Specific field validation rules

### 6. **CORS/CSRF Configuration** 🚫
**Issue**: Backend might require CSRF tokens even with token auth.

**Solution**: Check Django settings:
```python
# settings.py
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']
```

## Debug Steps

### Step 1: Use the Debug Tool
Open `recipe-creation-debug.html` and:
1. Load your auth token
2. Test connection to backend
3. Try "Create Minimal Recipe" first
4. Check the response details

### Step 2: Backend Inspection
Check Django backend:
```bash
# Check Django logs
python manage.py runserver --verbosity=2

# Check model fields
python manage.py shell
>>> from your_app.models import Recipe
>>> Recipe._meta.get_fields()
```

### Step 3: Network Inspection
1. Open browser DevTools → Network tab
2. Attempt recipe creation
3. Check request payload and response details
4. Look for specific error messages

## Immediate Fixes to Try

### Fix 1: Match Backend Field Names
Update `Recipes.js` to use exact backend field names:

```javascript
// Instead of guessing, use exact backend field names
const formData = new FormData();
formData.append('title', title);           // or 'recipe_title'
formData.append('name', name);             // or 'recipe_name'  
formData.append('description', description);
formData.append('instructions', instructions);

// For ingredients, try different formats:
// Option A: Single JSON array
formData.append('ingredients', JSON.stringify(ingredientsArr));

// Option B: Individual JSON objects
ingredientsArr.forEach(ing => {
    formData.append('ingredients', JSON.stringify(ing));
});
```

### Fix 2: Handle Categories/Tags Correctly
```javascript
// If backend expects IDs, not names:
categories.forEach(id => formData.append('categories', id));
cuisines.forEach(id => formData.append('cuisines', id));
tags.forEach(id => formData.append('tags', id));

// If backend expects names:
categories.forEach(name => formData.append('category_names', name));
```

### Fix 3: Add Error Logging
```javascript
try {
    const response = await fetch('http://127.0.0.1:8000/api/recipes/', {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
        body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        console.error('Recipe creation failed:', {
            status: response.status,
            statusText: response.statusText,
            data: data
        });
        
        // Log the actual form data sent
        console.log('Form data sent:');
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }
    }
} catch (error) {
    console.error('Request failed:', error);
}
```

## Backend Requirements to Verify

1. **Django Model**: What fields are required vs optional?
2. **Serializer**: What validation rules exist?
3. **View Permissions**: Is user authenticated and authorized?
4. **URL Routing**: Is `/api/recipes/` the correct endpoint?
5. **Ingredient Model**: How are ingredients stored/related?

## Next Steps

1. **Test with debug tool** - Use minimal data first
2. **Check Django admin** - Can you create recipes manually?
3. **Review backend code** - Match field names exactly
4. **Test authentication** - Verify token works for other endpoints
5. **Check logs** - Both frontend console and Django server logs

The debug tool I created will help identify the exact issue by testing different scenarios systematically.
