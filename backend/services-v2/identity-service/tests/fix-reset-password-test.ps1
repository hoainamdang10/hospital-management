# PowerShell script to add refreshToken to all ResetPasswordRequest in test file

$filePath = "tests/unit/application/use-cases/ResetPasswordUseCase.test.ts"

Write-Host "Processing: $filePath"

if (Test-Path $filePath) {
    $content = Get-Content $filePath -Raw
    
    # Replace all occurrences of ResetPasswordRequest without refreshToken
    $content = $content -replace "accessToken: '([^']+)',\s+newPassword:", "accessToken: '`$1',`n        refreshToken: 'valid-refresh-token',`n        newPassword:"
    
    Set-Content $filePath $content -NoNewline
    Write-Host "  ✓ Fixed: $filePath"
} else {
    Write-Host "  ✗ Not found: $filePath"
}

Write-Host "`nDone!"

