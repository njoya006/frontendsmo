# CSRF Token Issue - Complete Django Solution

## Problem
The frontend is getting "CSRF token missing" errors when trying to upload images, despite backend updates.

## Root Cause
Django is not providing CSRF tokens to the frontend, likely due to:
1. Missing CSRF_TRUSTED_ORIGINS configuration
2. Missing CSRF token endpoint
3. CORS configuration issues
4. Django session/cookie settings

## Complete Solution

### 1. Django Settings Configuration

Add/update these settings in your `settings.py`:

```python
# CSRF Settings
CSRF_TRUSTED_ORIGINS = [
    'http://127.0.0.1:5500',    # Frontend Live Server
    'http://localhost:5500',     # Alternative localhost
    'http://127.0.0.1:8000',    # If serving frontend from Django
    'http://localhost:8000',     # Alternative localhost
]

# CORS Settings (install django-cors-headers first)
CORS_ALLOWED_ORIGINS = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:8000',
    'http://localhost:8000',
]

# Enable CORS credentials
CORS_ALLOW_CREDENTIALS = True

# Session settings
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# For development only (remove in production)
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_SECURE = False

# Ensure sessions are enabled
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be first
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',  # Required for CSRF
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',  # Required for CSRF
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

### 2. CSRF Token Endpoint

Create or update your `views.py`:

```python
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.middleware.csrf import get_token

@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Get CSRF token for frontend requests
    """
    csrf_token = get_token(request)
    return JsonResponse({
        'csrfToken': csrf_token,
        'status': 'success'
    })
```

Add to your `urls.py`:

```python
from django.urls import path
from . import views

urlpatterns = [
    # ... your existing patterns
    path('api/csrf-token/', views.get_csrf_token, name='csrf_token'),
    # ... rest of your patterns
]
```

### 3. Recipe Model & View Updates

Ensure your Recipe model supports image uploads:

```python
# models.py
class Recipe(models.Model):
    # ... your existing fields
    image = models.ImageField(upload_to='recipe_images/', blank=True, null=True)
    
    # ... rest of your model
```

Update your Recipe viewset/view:

```python
# views.py (if using DRF)
from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class RecipeViewSet(viewsets.ModelViewSet):
    # ... your existing code
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def update(self, request, *args, **kwargs):
        # Your update logic here
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        # Your partial update logic here  
        return super().partial_update(request, *args, **kwargs)
```

### 4. Media Files Configuration

Add to `settings.py`:

```python
import os

# Media files (uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
```

Add to your main `urls.py`:

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... your patterns
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### 5. Install Required Packages

```bash
pip install Pillow django-cors-headers
```

Add to `INSTALLED_APPS` in `settings.py`:

```python
INSTALLED_APPS = [
    # ... your existing apps
    'corsheaders',
    # ... rest of your apps
]
```

## Testing Steps

1. **Restart Django server** after making these changes
2. **Test CSRF endpoint**: `GET http://localhost:8000/api/csrf-token/`
3. **Use the debug pages**:
   - `csrf-debug-simple.html` - Basic CSRF testing
   - `image-upload-no-csrf-test.html` - Test image upload functionality

## Temporary Development Workarounds

If you need to test image uploads immediately while fixing CSRF:

### Option 1: Temporarily Disable CSRF (Development Only)

```python
# In settings.py - DEVELOPMENT ONLY
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False

# Or exempt specific views
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt  # REMOVE IN PRODUCTION
def your_recipe_update_view(request, recipe_id):
    # Your view code
```

### Option 2: Temporary Middleware Adjustment

```python
# Temporarily comment out CSRF middleware for testing
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware',  # Temporarily disabled
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

## Final Notes

- **Security**: Remove any CSRF exemptions in production
- **Testing**: Use the provided debug pages to verify each step
- **CORS**: Make sure `django-cors-headers` is properly installed and configured
- **Session**: Ensure sessions are working for CSRF tokens to be set properly

The frontend is ready and will work as soon as Django is properly configured with these settings.
