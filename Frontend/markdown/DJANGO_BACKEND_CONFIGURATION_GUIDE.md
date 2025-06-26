# Django Backend Configuration Guide

This guide helps you configure your Django backend to support the frontend features, particularly image uploads and CSRF protection.

## Current Issues and Solutions

### 1. CSRF Trusted Origins Error

**Error:** `Forbidden (CSRF cookie not set): /api/recipes/{id}/`

**Solution:** Add the frontend origin to Django's `CSRF_TRUSTED_ORIGINS` setting.

In your Django `settings.py`:

```python
# Add this to your settings.py
CSRF_TRUSTED_ORIGINS = [
    'http://127.0.0.1:5500',  # For Live Server extension
    'http://localhost:5500',  # Alternative localhost
    'http://127.0.0.1:8000',  # If serving frontend from Django
    'http://localhost:8000',  # Alternative localhost
    # Add any other origins your frontend uses
]
```

### 2. CORS Configuration

Ensure your CORS settings allow the frontend origin:

```python
# In settings.py
CORS_ALLOWED_ORIGINS = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:8000',
    'http://localhost:8000',
]

# Or for development only (less secure):
CORS_ALLOW_ALL_ORIGINS = True
```

### 3. CSRF Token Endpoint

Make sure your Django backend provides a CSRF token endpoint:

```python
# In your urls.py
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse

@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({'csrfToken': request.META.get('CSRF_COOKIE')})

# Add to urlpatterns:
urlpatterns = [
    # ... your other patterns
    path('api/csrf-token/', get_csrf_token, name='csrf_token'),
]
```

### 4. Image Upload Configuration

Ensure your Django models and views support image uploads:

```python
# In your models.py
class Recipe(models.Model):
    # ... other fields
    image = models.ImageField(upload_to='recipe_images/', blank=True, null=True)

# In your views.py (if using Django REST Framework)
class RecipeViewSet(viewsets.ModelViewSet):
    # ... other configuration
    parser_classes = [MultiPartParser, FormParser, JSONParser]
```

### 5. Media Files Configuration

Configure Django to serve uploaded media files during development:

```python
# In settings.py
import os

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# In your main urls.py (for development only)
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... your patterns
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### 6. Install Required Packages

Make sure you have the required packages installed:

```bash
pip install Pillow  # For image handling
pip install django-cors-headers  # For CORS support
```

## Testing Configuration

After making these changes:

1. Restart your Django development server
2. Test CSRF token retrieval: `GET http://localhost:8000/api/csrf-token/`
3. Test recipe updates with the frontend
4. Test image uploads

## Frontend Features Supported

Once configured, the frontend will support:

- ✅ Recipe viewing and searching
- ✅ Owner-only edit and delete buttons
- ✅ Recipe updates (title, description, instructions, etc.)
- ✅ Image uploads and preview
- ✅ Proper error handling and user feedback
- ✅ CSRF protection
- ✅ Real-time ingredient rendering

## Troubleshooting

### Still getting CSRF errors?
1. Check that `CSRF_TRUSTED_ORIGINS` includes your exact frontend URL
2. Verify the CSRF token endpoint is accessible
3. Check browser console for specific error details
4. Clear cookies and try again

### Image uploads not working?
1. Verify `Pillow` is installed
2. Check `MEDIA_ROOT` and `MEDIA_URL` settings
3. Ensure the recipe model has an `image` field
4. Check file permissions on the media directory

### API calls failing?
1. Verify CORS settings include your frontend origin
2. Check that your API endpoints are correctly configured
3. Test API endpoints directly with tools like Postman

## Current Frontend Status

The frontend is fully functional and includes:
- Robust error handling with user-friendly messages
- Fallback logic for missing backend features
- Debug tools for troubleshooting
- Clear user guidance when backend configuration is needed

All that's needed now is the backend configuration described above.
