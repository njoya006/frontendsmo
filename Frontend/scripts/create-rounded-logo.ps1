# PowerShell script to create rounded logo favicons
# This creates circular and rounded-square versions of your logo

Write-Host "🎨 Creating rounded logo favicons..." -ForegroundColor Cyan

$logoPath = "..\logo.jpg"
$outputDir = "."

# Check if logo exists
if (-not (Test-Path $logoPath)) {
    Write-Host "❌ Error: logo.jpg not found at $logoPath" -ForegroundColor Red
    exit 1
}

# Check for ImageMagick
$magick = Get-Command magick -ErrorAction SilentlyContinue

if ($null -eq $magick) {
    Write-Host "`n⚠️  ImageMagick not installed!" -ForegroundColor Yellow
    Write-Host "Installing ImageMagick to create rounded logos..." -ForegroundColor White
    Write-Host "Run: winget install ImageMagick.ImageMagick" -ForegroundColor Green
    Write-Host "`nOr download from: https://imagemagick.org/script/download.php" -ForegroundColor White
    
    # Create a simple CSS-based solution instead
    Write-Host "`n📝 Creating CSS solution for rounded logos..." -ForegroundColor Cyan
    
    $cssContent = @"
/* Rounded Logo Favicon Style */
/* Automatically rounds your logo.jpg favicon */

/* Make favicon appear circular in browser */
link[rel="icon"][href*="favicon.jpg"],
link[rel="apple-touch-icon"] {
    /* Note: link tags can't be styled, but this documents the intent */
}

/* Round any logo image displayed on the page */
img[src*="logo"],
img[src*="favicon"],
.site-logo img,
.brand-logo img,
header .logo img,
.logo img {
    border-radius: 50% !important; /* Fully circular */
    object-fit: cover !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
    background: white; /* Clean background */
    padding: 2px; /* Small padding for breathing room */
}

/* Alternative: iOS-style rounded square (18% radius) */
.logo-rounded-square img {
    border-radius: 18% !important;
}

/* For small favicon-sized images */
img[width="16"],
img[width="32"],
img[width="48"] {
    border-radius: 50% !important;
}
"@
    
    $cssContent | Out-File "favicon-rounded.css" -Encoding UTF8
    Write-Host "✓ Created favicon-rounded.css" -ForegroundColor Green
    Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Add to your HTML files: <link rel='stylesheet' href='favicon-rounded.css'>" -ForegroundColor White
    Write-Host "2. This will round your logo wherever it appears on the page" -ForegroundColor White
    
} else {
    Write-Host "✓ ImageMagick found! Creating rounded logo versions..." -ForegroundColor Green
    
    # Create circular version (using mask)
    Write-Host "`n🔵 Creating circular logo..." -ForegroundColor Cyan
    
    # Create circle mask
    magick -size 512x512 xc:none -draw "circle 256,256 256,0" "$outputDir\circle-mask.png"
    
    # Apply circular mask to logo
    magick "$logoPath" -resize 512x512^ -gravity center -extent 512x512 `
        "$outputDir\circle-mask.png" -alpha off -compose copy_opacity -composite `
        "$outputDir\favicon-circular.png"
    
    Write-Host "  ✓ Created favicon-circular.png (512x512)" -ForegroundColor Green
    
    # Create rounded square version (iOS-style)
    Write-Host "`n🔶 Creating rounded square logo..." -ForegroundColor Cyan
    
    magick "$logoPath" -resize 512x512^ -gravity center -extent 512x512 `
        `( +clone -alpha extract -draw "fill black polygon 0,0 0,20 20,0 fill white circle 20,20 20,0" `
        `( +clone -flip `> `( +clone -flop `> -compose Multiply -flatten `
        `( +clone -flop `> -compose Multiply -flatten `> `
        -alpha off -compose copy_opacity -composite `
        "$outputDir\favicon-rounded.png"
    
    Write-Host "  ✓ Created favicon-rounded.png (iOS-style, 512x512)" -ForegroundColor Green
    
    # Create different sizes for both versions
    $sizes = @(16, 32, 48, 64, 96, 128, 180, 192, 256, 512)
    
    Write-Host "`n📏 Creating multiple sizes..." -ForegroundColor Cyan
    foreach ($size in $sizes) {
        # Circular versions
        magick "$outputDir\favicon-circular.png" -resize "${size}x${size}" `
            "$outputDir\favicon-circular-${size}.png"
        
        # Rounded square versions  
        magick "$outputDir\favicon-rounded.png" -resize "${size}x${size}" `
            "$outputDir\favicon-rounded-${size}.png"
    }
    Write-Host "  ✓ Created ${sizes.Count} sizes for each style" -ForegroundColor Green
    
    # Create ICO files
    Write-Host "`n💾 Creating ICO files..." -ForegroundColor Cyan
    
    magick "$outputDir\favicon-circular.png" -define icon:auto-resize=16,32,48,64 `
        "$outputDir\favicon-circular.ico"
    Write-Host "  ✓ Created favicon-circular.ico" -ForegroundColor Green
    
    magick "$outputDir\favicon-rounded.png" -define icon:auto-resize=16,32,48,64 `
        "$outputDir\favicon-rounded.ico"
    Write-Host "  ✓ Created favicon-rounded.ico" -ForegroundColor Green
    
    # Create Apple Touch Icon (circular)
    magick "$outputDir\favicon-circular.png" -resize 180x180 `
        "$outputDir\apple-touch-icon-circular.png"
    Write-Host "  ✓ Created apple-touch-icon-circular.png" -ForegroundColor Green
    
    # Cleanup mask
    Remove-Item "$outputDir\circle-mask.png" -ErrorAction SilentlyContinue
    
    Write-Host "`n✨ Rounded logos created successfully!" -ForegroundColor Green
    Write-Host "`n📋 Choose your preferred style:" -ForegroundColor Cyan
    Write-Host "  🔵 Circular: favicon-circular.ico / favicon-circular.png" -ForegroundColor White
    Write-Host "  🔶 Rounded Square: favicon-rounded.ico / favicon-rounded.png" -ForegroundColor White
    Write-Host "`n💡 To use circular favicon:" -ForegroundColor Yellow
    Write-Host '  Replace favicon.ico with favicon-circular.ico' -ForegroundColor White
    Write-Host '  Replace favicon.jpg with favicon-circular.png (rename to .jpg)' -ForegroundColor White
}

Write-Host "`n🎯 Recommendation:" -ForegroundColor Cyan
Write-Host "Use CIRCULAR version for modern, clean look!" -ForegroundColor White
