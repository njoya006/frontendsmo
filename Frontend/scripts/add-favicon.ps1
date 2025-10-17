# PowerShell script to add favicon to all HTML pages
# Run this from the Frontend directory

$htmlFiles = @(
    "SignUp.html",
    "Dashboard.html",
    "Profile.html",
    "Recipes.html",
    "recipe-detail.html",
    "MealPlans.html",
    "MealSuggestion.html",
    "grocery-list.html",
    "About.html",
    "Contact.html",
    "FAQ.html",
    "Privacy Policy.html",
    "Term Of Service.html"
)

$faviconLinks = @"
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="alternate icon" href="favicon.svg">
    <meta name="theme-color" content="#ff6b6b">
"@

foreach ($file in $htmlFiles) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        # Check if favicon already exists
        if ($content -notmatch 'favicon\.svg') {
            # Find the first <link or <style tag after <title>
            $pattern = '(<title>.*?</title>)\s*(\r?\n\s*)'
            if ($content -match $pattern) {
                $newContent = $content -replace $pattern, "`$1$faviconLinks`$2"
                Set-Content -Path $filePath -Value $newContent -NoNewline
                Write-Host "✓ Added favicon to $file" -ForegroundColor Green
            } else {
                Write-Host "⚠ Could not find insertion point in $file" -ForegroundColor Yellow
            }
        } else {
            Write-Host "- Favicon already exists in $file" -ForegroundColor Cyan
        }
    } else {
        Write-Host "✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n✓ Favicon update complete!" -ForegroundColor Green
