# PowerShell script to convert logo.jpg to multiple favicon formats
# This creates ICO file and various PNG sizes for better browser compatibility

Write-Host "🎨 Converting logo.jpg to favicon formats..." -ForegroundColor Cyan

# Check if ImageMagick is available (if not, we'll provide instructions)
$magickPath = Get-Command magick -ErrorAction SilentlyContinue

if ($null -eq $magickPath) {
    Write-Host "`n⚠️  ImageMagick not found!" -ForegroundColor Yellow
    Write-Host "`nTo create optimal favicon formats, please:" -ForegroundColor White
    Write-Host "1. Install ImageMagick: https://imagemagick.org/script/download.php" -ForegroundColor White
    Write-Host "   OR use this command:" -ForegroundColor White
    Write-Host "   winget install ImageMagick.ImageMagick" -ForegroundColor Green
    Write-Host "`n2. After installing, run this script again" -ForegroundColor White
    Write-Host "`n📝 For now, we'll use favicon.jpg directly (works but not optimal)" -ForegroundColor Yellow
    
    # Copy as favicon.ico (browsers will handle it)
    Copy-Item "logo.jpg" "Frontend\favicon.ico" -Force
    Write-Host "✓ Created favicon.ico from logo.jpg" -ForegroundColor Green
} else {
    Write-Host "✓ ImageMagick found! Creating optimized favicons..." -ForegroundColor Green
    
    # Create different sizes
    $sizes = @(16, 32, 48, 64, 128, 180, 192, 512)
    
    foreach ($size in $sizes) {
        $outputFile = "Frontend\favicon-${size}x${size}.png"
        magick "logo.jpg" -resize "${size}x${size}" -quality 95 $outputFile
        Write-Host "  ✓ Created ${size}x${size} PNG" -ForegroundColor Green
    }
    
    # Create ICO file with multiple sizes (16, 32, 48)
    magick "logo.jpg" -resize 16x16 -quality 95 -define icon:auto-resize=16,32,48 "Frontend\favicon.ico"
    Write-Host "  ✓ Created favicon.ico with multiple sizes" -ForegroundColor Green
    
    # Create Apple Touch Icon
    magick "logo.jpg" -resize 180x180 -quality 95 "Frontend\apple-touch-icon.png"
    Write-Host "  ✓ Created apple-touch-icon.png" -ForegroundColor Green
}

Write-Host "`n✨ Favicon conversion complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Your logo is now being used as the favicon" -ForegroundColor White
Write-Host "2. Clear your browser cache to see the new favicon" -ForegroundColor White
Write-Host "3. The changes will be visible on all pages" -ForegroundColor White
