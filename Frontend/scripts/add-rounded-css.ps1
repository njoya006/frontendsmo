# Add logo-rounded.css to all HTML pages
# This makes the logo appear with rounded borders everywhere

$files = @(
    "Login.html",
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

$cssLink = '    <link rel="stylesheet" href="logo-rounded.css">'

Write-Host "🎨 Adding rounded logo CSS to HTML pages..." -ForegroundColor Cyan

foreach ($file in $files) {
    $filePath = "..\$file"
    
    if (Test-Path $filePath) {
        try {
            $content = Get-Content $filePath -Raw -ErrorAction Stop
            
            # Check if already added
            if ($content -match 'logo-rounded\.css') {
                Write-Host "  - $file already has logo-rounded.css" -ForegroundColor Gray
                continue
            }
            
            # Add before </head> tag
            $updated = $content -replace '(</head>)', "$cssLink`r`n`$1"
            
            $updated | Set-Content $filePath -NoNewline -ErrorAction Stop
            Write-Host "  ✓ Added to $file" -ForegroundColor Green
        }
        catch {
            Write-Host "  ⚠ Could not update $file - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "  - Skipped $file (not found)" -ForegroundColor Gray
    }
}

Write-Host "`n✨ Rounded logo CSS added!" -ForegroundColor Green
Write-Host "`nYour logo now appears with rounded borders on all pages!" -ForegroundColor White
Write-Host "Refresh your browser (Ctrl+F5) to see the changes." -ForegroundColor Yellow
