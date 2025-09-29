@echo off
echo 🧹 Cleaning up for Docker build...

REM Remove all node_modules directories to avoid symlink issues
echo 📦 Removing node_modules directories...
for /d /r . %%d in (node_modules) do @if exist "%%d" rd /s /q "%%d" 2>nul

REM Remove TypeScript build info files
echo 🔧 Removing TypeScript build info...
for /r . %%f in (*.tsbuildinfo) do @if exist "%%f" del /q "%%f" 2>nul

REM Remove dist directories
echo 📁 Removing dist directories...
for /d /r . %%d in (dist) do @if exist "%%d" rd /s /q "%%d" 2>nul

REM Remove log files
echo 📝 Removing log files...
for /r . %%f in (*.log) do @if exist "%%f" del /q "%%f" 2>nul

REM Remove coverage directories
echo 📊 Removing coverage directories...
for /d /r . %%d in (coverage) do @if exist "%%d" rd /s /q "%%d" 2>nul

REM Build shared package first
echo 🔨 Building shared package...
cd shared
call npm install
call npm run build
cd ..

echo ✅ Cleanup complete! Ready for Docker build.
echo.
echo Now you can run:
echo   docker compose --profile full up -d --build

pause
