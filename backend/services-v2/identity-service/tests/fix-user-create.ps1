# PowerShell script to fix User.create() calls in test files
# This script replaces old User.create({...}) with createMockUser({...})

$files = @(
    "unit/application/use-cases/UpdateUserUseCase.test.ts",
    "unit/application/use-cases/DeleteUserUseCase.test.ts",
    "unit/application/use-cases/ListUsersUseCase.test.ts",
    "unit/application/use-cases/ForgotPasswordUseCase.test.ts",
    "unit/application/use-cases/EnableMFAUseCase.test.ts",
    "unit/application/use-cases/DisableMFAUseCase.test.ts"
)

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot $file
    Write-Host "Processing: $file"
    
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        # Replace imports
        $content = $content -replace "import \{ User \} from '../../../../src/domain/aggregates/User';", ""
        $content = $content -replace "import \{ Email \} from '../../../../src/domain/value-objects/Email';", ""
        $content = $content -replace "import \{ UserId \} from '../../../../src/domain/value-objects/UserId';", ""
        
        # Add new import if not exists
        if ($content -notmatch "createMockUser") {
            $content = $content -replace "(import.*from '../../../../src/application/repositories/IUserRepository';)", "`$1`nimport { createMockUser } from '../../../helpers/user-test-helper';"
        }
        
        # Replace User.create calls
        $content = $content -replace "User\.create\(\{", "createMockUser({"
        $content = $content -replace "userId: UserId\.create\('([^']+)'\),", "userId: '`$1',"
        $content = $content -replace "email: Email\.create\('([^']+)'\),", "email: '`$1',"
        $content = $content -replace "roleType: '([a-z]+)'", "roleType: '`$1'.toUpperCase()"
        
        Set-Content $filePath $content -NoNewline
        Write-Host "  ✓ Fixed: $file"
    } else {
        Write-Host "  ✗ Not found: $file"
    }
}

Write-Host "`nDone! Fixed $($files.Count) files."

