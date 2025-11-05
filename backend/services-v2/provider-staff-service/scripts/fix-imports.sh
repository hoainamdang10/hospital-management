#!/bin/bash

# Fix Import Paths Script
# Automatically replaces relative imports with @shared alias
#
# Usage: ./scripts/fix-imports.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Fix Import Paths - Provider Staff Service${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Counter
FIXED_COUNT=0
TOTAL_FILES=0

# Find all TypeScript files
echo -e "${YELLOW}Searching for TypeScript files...${NC}\n"

# Patterns to replace
declare -A PATTERNS=(
    ["../../../../shared/"]="@shared/"
    ["../../../shared/"]="@shared/"
    ["../../shared/"]="@shared/"
    ["../shared/"]="@shared/"
)

# Find all .ts files in src directory
FILES=$(find src -name "*.ts" -type f)

for file in $FILES; do
    TOTAL_FILES=$((TOTAL_FILES + 1))
    FILE_CHANGED=0

    for OLD_PATTERN in "${!PATTERNS[@]}"; do
        NEW_PATTERN="${PATTERNS[$OLD_PATTERN]}"

        # Check if file contains the pattern
        if grep -q "$OLD_PATTERN" "$file" 2>/dev/null; then
            if [ $FILE_CHANGED -eq 0 ]; then
                echo -e "${BLUE}Processing:${NC} $file"
                FILE_CHANGED=1
                FIXED_COUNT=$((FIXED_COUNT + 1))
            fi

            # Create backup
            cp "$file" "$file.bak"

            # Replace pattern
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s|$OLD_PATTERN|$NEW_PATTERN|g" "$file"
            else
                # Linux/Git Bash
                sed -i "s|$OLD_PATTERN|$NEW_PATTERN|g" "$file"
            fi

            echo -e "  ${GREEN}✓${NC} Replaced: ${OLD_PATTERN} → ${NEW_PATTERN}"
        fi
    done

    if [ $FILE_CHANGED -eq 1 ]; then
        # Remove backup if successful
        rm "$file.bak"
        echo ""
    fi
done

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Summary:${NC}"
echo -e "  Total files scanned: ${TOTAL_FILES}"
echo -e "  Files fixed: ${FIXED_COUNT}"
echo -e "${BLUE}========================================${NC}\n"

if [ $FIXED_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Import paths fixed successfully!${NC}\n"

    # Verify TypeScript compilation
    echo -e "${YELLOW}Verifying TypeScript compilation...${NC}"
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✓ TypeScript compilation successful!${NC}\n"
    else
        echo -e "${RED}✗ TypeScript compilation failed. Please check errors.${NC}"
        echo -e "${YELLOW}Run 'npm run build' to see detailed errors.${NC}\n"
        exit 1
    fi
else
    echo -e "${YELLOW}No files needed fixing.${NC}\n"
fi

echo -e "${GREEN}Done!${NC}"
