# Update all HTML files to use favicon.ico and favicon.jpg instead of favicon.svg
# Run this from the Frontend directory

$files = @(
    "SignUp.html",
    "DashBoard.html",
    "Profile.html",
    "Recipes.html",
    "recipe-detail.html",
    "MealPlans.html",
    "MealSuggestion.html",
    "grocery-list.html",
    "About.html",
    "Contact.html",
    "FAQ.html"
)

$oldPattern1 = '<link rel="icon" type="image/svg\+xml" href="favicon\.svg">'
$oldPattern2 = '<link rel="alternate icon" href="favicon\.svg">'
$newFavicon = '<link rel="icon" type="image/x-icon" href="favicon.ico">' + "`n" + '    <link rel="icon" type="image/jpeg" href="favicon.jpg">' + "`n" + '    <link rel="apple-touch-icon" href="favicon.jpg">'

Write-Host "🔄 Updating favicon references in HTML files..." -ForegroundColor Cyan

foreach ($file in $files) {
    if (Test-Path $file) {
        try {
            $content = Get-Content $file -Raw -ErrorAction Stop
            
            # Replace the old favicon links
            $updated = $content -replace "$oldPattern1\s*\r?\n\s*$oldPattern2", $newFavicon
            
            # Save the file
            $updated | Set-Content $file -NoNewline -ErrorAction Stop
            Write-Host "  ✓ Updated $file" -ForegroundColor Green
        }
        catch {
            Write-Host "  ⚠ Could not update $file - file may be open in editor" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "  - Skipped $file (not found)" -ForegroundColor Gray
    }
}

Write-Host "`n✨ Favicon update complete!" -ForegroundColor Green
Write-Host "`nYour custom logo is now used as the favicon across all pages!" -ForegroundColor White
Write-Host "Clear your browser cache (Ctrl+Shift+Delete) to see the changes." -ForegroundColor Yellow
