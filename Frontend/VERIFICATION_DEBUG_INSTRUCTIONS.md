# VERIFICATION DEBUG INSTRUCTIONS

## Quick Debug Steps

### Step 1: Open Browser Console
1. Go to the Recipes page
2. Open browser developer tools (F12)
3. Go to Console tab

### Step 2: Test Functions Available

In the console, you can run these commands:

```javascript
// Test verification status
testVerification()

// Force show create button (bypass verification)
forceShowCreateButton()

// Check what's in local storage
console.log('Auth Token:', localStorage.getItem('authToken'));
console.log('User Data:', JSON.parse(localStorage.getItem('userData') || '{}'));
```

### Step 3: Manual Verification Check

```javascript
// Full manual check
(async function() {
    try {
        const verification = new UniversalVerification();
        const status = await verification.getUniversalVerificationStatus();
        console.log('=== VERIFICATION DEBUG ===');
        console.log('is_verified:', status.is_verified);
        console.log('status:', status.status);
        console.log('source:', status.source);
        console.log('Full data:', status);
        
        // Check profile directly
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            const response = await fetch('https://njoya.pythonanywhere.com/api/users/profile/', {
                headers: {
                    'Authorization': authToken.startsWith('Token ') ? authToken : `Token ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const profile = await response.json();
                console.log('=== PROFILE DATA ===');
                console.log('is_verified field:', profile.is_verified);
                console.log('verified field:', profile.verified);
                console.log('verification_status:', profile.verification_status);
                console.log('is_staff:', profile.is_staff);
                console.log('Full profile:', profile);
            }
        }
    } catch (error) {
        console.error('Debug error:', error);
    }
})();
```

## Common Issues

### Issue 1: User Data Not Saved
- Check if login properly saves user data to localStorage
- User might need to log in again

### Issue 2: Backend Not Returning Verification Flag
- Check if backend sets `is_verified=True` for your user
- Check verification endpoint response

### Issue 3: Frontend Logic Error
- Use `forceShowCreateButton()` to test button functionality
- Check console for any JavaScript errors

## Quick Fixes

### Force Show Button (Temporary)
```javascript
forceShowCreateButton()
```

### Set Manual Verification (Testing Only)
```javascript
// This will only work for current session
localStorage.setItem('debugVerified', 'true');
location.reload();
```

## Files to Check
- `universal-verification.js` - Main verification logic
- `Recipes.js` - Button display logic
- Backend user model - `is_verified` field
- Backend verification endpoint responses
