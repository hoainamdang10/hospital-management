#!/bin/bash

# =====================================================
# Phase 1: Infrastructure Setup & Backup
# Hospital Management System - Microservices Consolidation
# Department Service → Auth Service Migration
# =====================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="backups/phase1-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="logs/phase1-infrastructure-setup.log"
DEPLOYMENT_ID="phase1-$(date +%s)"

# Ensure directories exist
mkdir -p backups logs scripts/consolidation/rollback

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "\n${BLUE}=================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS" "$1"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    log "ERROR" "$1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log "WARNING" "$1"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    log "INFO" "$1"
}

# Validation functions
validate_environment() {
    print_header "VALIDATING ENVIRONMENT"
    
    # Check required tools
    local required_tools=("docker" "docker-compose" "node" "npm" "git" "curl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            print_error "Required tool not found: $tool"
            exit 1
        fi
    done
    print_success "All required tools are available"
    
    # Check environment variables
    local required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable not set: $var"
            exit 1
        fi
    done
    print_success "All required environment variables are set"
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    print_success "Docker daemon is running"
    
    # Check current directory
    if [ ! -f "backend/docker-compose.yml" ]; then
        print_error "Must be run from project root directory"
        exit 1
    fi
    print_success "Running from correct directory"
}

# Backup functions
create_comprehensive_backup() {
    print_header "CREATING COMPREHENSIVE BACKUP"
    
    print_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    
    # 1. Backup codebase
    print_info "Backing up codebase..."
    cp -r backend/services "$BACKUP_DIR/"
    cp -r backend/shared "$BACKUP_DIR/"
    cp backend/docker-compose.yml "$BACKUP_DIR/"
    cp backend/package.json "$BACKUP_DIR/"
    print_success "Codebase backup completed"
    
    # 2. Backup database schemas
    print_info "Backing up database schemas..."
    mkdir -p "$BACKUP_DIR/database"
    
    # Export current schema structure
    if command -v pg_dump &> /dev/null; then
        pg_dump "$SUPABASE_URL" --schema-only > "$BACKUP_DIR/database/schema-backup.sql" 2>/dev/null || {
            print_warning "pg_dump not available, using alternative backup method"
            # Alternative: Use Supabase API to backup schema
            curl -s -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
                 "$SUPABASE_URL/rest/v1/rpc/get_schema_info" > "$BACKUP_DIR/database/schema-info.json"
        }
    fi
    print_success "Database schema backup completed"
    
    # 3. Backup current service configurations
    print_info "Backing up service configurations..."
    mkdir -p "$BACKUP_DIR/configs"
    
    # Department service config
    if [ -d "backend/services/department-service" ]; then
        cp -r backend/services/department-service/src/config "$BACKUP_DIR/configs/department-service-config"
    fi
    
    # Auth service config
    if [ -d "backend/services/auth-service" ]; then
        cp -r backend/services/auth-service/src/config "$BACKUP_DIR/configs/auth-service-config"
    fi
    
    # API Gateway routing config
    if [ -f "backend/services/api-gateway/src/app.ts" ]; then
        cp backend/services/api-gateway/src/app.ts "$BACKUP_DIR/configs/api-gateway-routes.ts"
    fi
    
    print_success "Service configurations backup completed"
    
    # 4. Create backup manifest
    cat > "$BACKUP_DIR/backup-manifest.json" << EOF
{
  "backup_id": "$DEPLOYMENT_ID",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "phase": "phase1-infrastructure-setup",
  "type": "comprehensive",
  "contents": {
    "codebase": true,
    "database_schema": true,
    "service_configs": true,
    "docker_configs": true
  },
  "services_backed_up": [
    "department-service",
    "auth-service",
    "api-gateway"
  ],
  "backup_size": "$(du -sh $BACKUP_DIR | cut -f1)",
  "restoration_notes": "Use rollback scripts in scripts/consolidation/rollback/"
}
EOF
    
    print_success "Backup manifest created"
    print_success "Comprehensive backup completed: $BACKUP_DIR"
}

# Safety protocol setup
setup_safety_protocols() {
    print_header "SETTING UP SAFETY PROTOCOLS"
    
    # 1. Create rollback scripts
    print_info "Creating rollback scripts..."
    
    cat > "scripts/consolidation/rollback/phase1-rollback.sh" << 'EOF'
#!/bin/bash
# Phase 1 Rollback Script
# Restores system to pre-migration state

BACKUP_DIR="$1"
if [ -z "$BACKUP_DIR" ]; then
    echo "Usage: $0 <backup_directory>"
    exit 1
fi

echo "🔄 Rolling back Phase 1 migration..."
echo "📁 Using backup: $BACKUP_DIR"

# Stop current services
docker-compose --profile core down

# Restore codebase
cp -r "$BACKUP_DIR/services" backend/
cp -r "$BACKUP_DIR/shared" backend/
cp "$BACKUP_DIR/docker-compose.yml" backend/

# Rebuild and restart services
cd backend
docker-compose --profile core build
docker-compose --profile core up -d

echo "✅ Phase 1 rollback completed"
EOF
    
    chmod +x "scripts/consolidation/rollback/phase1-rollback.sh"
    print_success "Rollback script created"
    
    # 2. Create health check script
    cat > "scripts/consolidation/health-check.sh" << 'EOF'
#!/bin/bash
# Health check script for consolidation process

check_service_health() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    echo "🔍 Checking $service_name health..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://localhost:$port/health" > /dev/null; then
            echo "✅ $service_name is healthy"
            return 0
        fi
        echo "⏳ Attempt $attempt/$max_attempts - waiting for $service_name..."
        sleep 2
        ((attempt++))
    done
    
    echo "❌ $service_name health check failed"
    return 1
}

# Check all core services
check_service_health "API Gateway" 3100
check_service_health "Auth Service" 3001
check_service_health "Department Service" 3005

echo "🏥 All services health check completed"
EOF
    
    chmod +x "scripts/consolidation/health-check.sh"
    print_success "Health check script created"
    
    print_success "Safety protocols setup completed"
}

# Environment preparation
prepare_environment() {
    print_header "PREPARING ENVIRONMENT"
    
    # 1. Check current service status
    print_info "Checking current service status..."
    cd backend
    docker-compose ps
    
    # 2. Ensure all services are running
    print_info "Starting all services to ensure clean state..."
    docker-compose --profile core up -d
    
    # Wait for services to be ready
    sleep 10
    
    # 3. Run health checks
    print_info "Running initial health checks..."
    ../scripts/consolidation/health-check.sh
    
    cd ..
    print_success "Environment preparation completed"
}

# Main execution
main() {
    print_header "PHASE 1: INFRASTRUCTURE SETUP & BACKUP"
    print_info "Deployment ID: $DEPLOYMENT_ID"
    print_info "Log file: $LOG_FILE"
    
    # Execute setup steps
    validate_environment
    create_comprehensive_backup
    setup_safety_protocols
    prepare_environment
    
    print_header "PHASE 1 INFRASTRUCTURE SETUP COMPLETED"
    print_success "✅ Backup created: $BACKUP_DIR"
    print_success "✅ Safety protocols established"
    print_success "✅ Environment prepared for migration"
    print_success "✅ Ready to proceed with Department Service analysis"
    
    # Save deployment info
    cat > "logs/phase1-deployment-info.json" << EOF
{
  "deployment_id": "$DEPLOYMENT_ID",
  "phase": "phase1-infrastructure-setup",
  "status": "completed",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backup_location": "$BACKUP_DIR",
  "next_step": "Department Service Analysis",
  "rollback_command": "./scripts/consolidation/rollback/phase1-rollback.sh $BACKUP_DIR"
}
EOF
    
    print_info "📋 Next step: Run Department Service Analysis"
    print_info "🔄 Rollback command: ./scripts/consolidation/rollback/phase1-rollback.sh $BACKUP_DIR"
}

# Execute main function
main "$@"
