# Smoke test script for ChopSmo frontend/backend
# Prompts for credentials securely and runs login + recipes GET

param(
    [string]$ApiBase = 'https://api.chopsmo.site'
)

Write-Host "Using API base: $ApiBase"

# Prompt for email and password securely
$email = Read-Host -Prompt 'Email (e.g. njoyaperfect06@gmail.com)'
$password = Read-Host -Prompt 'Password' -AsSecureString
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

$loginEndpoint = "$ApiBase/api/users/login/"
$body = @{ email = $email; password = $plainPassword } | ConvertTo-Json

Write-Host "\n===> Login attempt"
try {
    $resp = Invoke-WebRequest -Uri $loginEndpoint -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($resp.StatusCode)"
    Write-Host "Headers:"; $resp.Headers
    Write-Host "Body:"; $resp.Content
} catch {
    Write-Host "Login request failed. Trying to capture response details..."
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        $status = $_.Exception.Response.StatusCode
        Write-Host "STATUS: $status"
        Write-Host "BODY:"; Write-Host $content
    } else {
        Write-Host $_.Exception.Message
    }
}

# Try recipes GET without auth
Write-Host "\n===> GET /api/recipes/ (no auth)"
try {
    $r2 = Invoke-RestMethod -Uri "$ApiBase/api/recipes/" -Method Get -ContentType 'application/json' -ErrorAction Stop
    Write-Host "Recipes fetched: " ($r2 | Measure-Object).Count
    $r2 | ConvertTo-Json -Depth 3
} catch {
    Write-Host "GET /api/recipes/ failed:"; Write-Host $_.Exception.Message
}

Write-Host "\nSmoke test script finished. For create-recipe (multipart) use the provided curl example in README or run the UI manual test."