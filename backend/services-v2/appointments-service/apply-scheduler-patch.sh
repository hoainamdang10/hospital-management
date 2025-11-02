#!/bin/bash

# Scheduler Integration Patch Script
# This script backs up original files and applies patched versions
# Run from: backend/services-v2/appointments-service/

set -e

echo "========================================"
echo "  SCHEDULER INTEGRATION PATCH v1.0"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from appointments-service directory"
    exit 1
fi

if ! grep -q "appointments-service" package.json; then
    echo "❌ Error: Not in appointments-service directory"
    exit 1
fi

echo "✓ Directory check passed"
echo ""

# Create backup directory
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📁 Created backup directory: $BACKUP_DIR"
echo ""

# Function to backup and replace file
backup_and_replace() {
    local original=$1
    local patched=$2
    local display_name=$3
    
    if [ ! -f "$original" ]; then
        echo "⚠️  Warning: Original file not found: $original"
        return 1
    fi
    
    if [ ! -f "$patched" ]; then
        echo "❌ Error: Patched file not found: $patched"
        return 1
    fi
    
    echo "Processing: $display_name"
    
    # Backup original
    cp "$original" "$BACKUP_DIR/$(basename $original)"
    echo "  ✓ Backed up to: $BACKUP_DIR/$(basename $original)"
    
    # Replace with patched version
    cp "$patched" "$original"
    echo "  ✓ Replaced with patched version"
    
    # Remove patched file
    rm "$patched"
    echo "  ✓ Cleaned up patched file"
    echo ""
    
    return 0
}

# Apply patches
echo "Applying patches..."
echo ""

backup_and_replace \
    "src/application/use-cases/ScheduleAppointment.use-case.ts" \
    "src/application/use-cases/ScheduleAppointment.use-case.PATCHED.ts" \
    "ScheduleAppointment Use Case"

backup_and_replace \
    "src/application/use-cases/CancelAppointment.use-case.ts" \
    "src/application/use-cases/CancelAppointment.use-case.PATCHED.ts" \
    "CancelAppointment Use Case"

backup_and_replace \
    "src/application/use-cases/RescheduleAppointment.use-case.ts" \
    "src/application/use-cases/RescheduleAppointment.use-case.PATCHED.ts" \
    "RescheduleAppointment Use Case"

echo "========================================"
echo "✅ PATCH APPLIED SUCCESSFULLY"
echo "========================================"
echo ""
echo "📋 Summary:"
echo "   - 3 use case files patched"
echo "   - Original files backed up to: $BACKUP_DIR"
echo ""
echo "🔧 Next steps:"
echo "   1. Review CONTAINER_PATCH_INSTRUCTIONS.md"
echo "   2. Manually update src/infrastructure/di/container.ts"
echo "   3. Install dependencies: npm install axios axios-retry"
echo "   4. Build: npm run build"
echo "   5. Test: npm run dev"
echo ""
echo "📚 To rollback:"
echo "   cp $BACKUP_DIR/*.ts src/application/use-cases/"
echo ""
