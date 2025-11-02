# Script để update tất cả integration tests sử dụng test pool cache
# Chạy: .\tests\update-all-integration-tests.ps1

$testFiles = @(
    "integration\auth-routes.integration.test.ts",
    "integration\session-management.integration.test.ts",
    "integration\account-lockout.integration.test.ts",
    "integration\password-recovery.integration.test.ts"
)

Write-Host "🔄 Updating integration test files to use test pool cache..." -ForegroundColor Cyan

foreach ($file in $testFiles) {
    $filePath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $filePath) {
        Write-Host "  📝 Updating $file..." -ForegroundColor Yellow
        
        # Read content
        $content = Get-Content $filePath -Raw
        
        # Replace import statement
        $content = $content -replace "import \{ seedTestUserPool, cleanupTestUserPool, TestUserPool \} from '\.\.\/helpers\/test-user-pool';", "import { TestUserPool } from '../helpers/test-user-pool';`nimport { testUserPoolCache } from '../helpers/test-user-pool-cache';"
        
        # Replace seed call in beforeAll
        $content = $content -replace "userPool = await seedTestUserPool\(supabaseClient, \{ sequential: true \}\);", "userPool = await testUserPoolCache.getPool(supabaseClient);"
        
        # Replace cleanup in afterAll
        $content = $content -replace "if \(userPool\) \{\s+await cleanupTestUserPool\(supabaseClient, userPool\);\s+\}", "// Note: User pool is cached and will be cleaned up in global teardown"
        
        # Write back
        Set-Content -Path $filePath -Value $content -NoNewline
        
        Write-Host "    ✅ Updated $file" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️  File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n✅ All integration tests updated!" -ForegroundColor Green
Write-Host "📝 Remember to configure jest.config.js to use globalSetup/globalTeardown" -ForegroundColor Yellow

