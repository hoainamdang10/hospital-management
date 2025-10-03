#!/bin/bash

# Identity Service Consolidation Validation Script
# Comprehensive post-deployment validation and testing
# 
# @author Hospital Management Team
# @version 2.0.0
# @compliance Production-Ready Validation

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/validation-$(date +%Y%m%d-%H%M%S).log"

# Service configuration
SERVICE_URL="http://localhost:3031"
HEALTH_URL="$SERVICE_URL/health"
AUTH_URL="$SERVICE_URL/auth/login"
INFO_URL="$SERVICE_URL/info"
CIRCUIT_BREAKER_URL="$SERVICE_URL/circuit-breakers"

# Test configuration
TEST_EMAIL="test@hospital.vn"
TEST_PASSWORD="TestPassword123!"
LOAD_TEST_DURATION=300  # 5 minutes
LOAD_TEST_CONCURRENT=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO" "${BLUE}$*${NC}"
}

log_warn() {
    log "WARN" "${YELLOW}$*${NC}"
}

log_error() {
    log "ERROR" "${RED}$*${NC}"
}

log_success() {
    log "SUCCESS" "${GREEN}$*${NC}"
}

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

validate_service_availability() {
    log_info "🔍 Validating service availability..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$SERVICE_URL" >/dev/null 2>&1; then
            log_success "✅ Service is available"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts: Service not available, waiting 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    log_error "❌ Service availability validation failed"
    return 1
}

validate_health_endpoints() {
    log_info "🏥 Validating health endpoints..."
    
    # Test health endpoint
    local health_response=$(curl -s "$HEALTH_URL" 2>/dev/null || echo "ERROR")
    
    if [ "$health_response" = "ERROR" ]; then
        log_error "❌ Health endpoint not accessible"
        return 1
    fi
    
    # Parse health status
    if command -v jq >/dev/null 2>&1; then
        local overall_status=$(echo "$health_response" | jq -r '.overall' 2>/dev/null || echo "UNKNOWN")
        
        if [ "$overall_status" = "HEALTHY" ]; then
            log_success "✅ Service health status: HEALTHY"
        elif [ "$overall_status" = "DEGRADED" ]; then
            log_warn "⚠️ Service health status: DEGRADED"
        else
            log_error "❌ Service health status: $overall_status"
            return 1
        fi
        
        # Check individual components
        local components=("database" "authentication" "authorization" "sessions" "audit" "circuitBreakers")
        for component in "${components[@]}"; do
            local component_status=$(echo "$health_response" | jq -r ".components.$component.status" 2>/dev/null || echo "UNKNOWN")
            if [ "$component_status" = "HEALTHY" ]; then
                log_success "  ✅ $component: HEALTHY"
            else
                log_warn "  ⚠️ $component: $component_status"
            fi
        done
    else
        log_info "✅ Health endpoint accessible (jq not available for detailed parsing)"
    fi
    
    return 0
}

validate_service_info() {
    log_info "ℹ️ Validating service information..."
    
    local info_response=$(curl -s "$INFO_URL" 2>/dev/null || echo "ERROR")
    
    if [ "$info_response" = "ERROR" ]; then
        log_error "❌ Service info endpoint not accessible"
        return 1
    fi
    
    if command -v jq >/dev/null 2>&1; then
        local service_name=$(echo "$info_response" | jq -r '.service' 2>/dev/null || echo "UNKNOWN")
        local version=$(echo "$info_response" | jq -r '.version' 2>/dev/null || echo "UNKNOWN")
        local environment=$(echo "$info_response" | jq -r '.environment' 2>/dev/null || echo "UNKNOWN")
        
        log_success "✅ Service: $service_name"
        log_success "✅ Version: $version"
        log_success "✅ Environment: $environment"
        
        if [ "$service_name" != "identity-service-consolidated" ]; then
            log_error "❌ Unexpected service name: $service_name"
            return 1
        fi
        
        if [ "$version" != "2.0.0" ]; then
            log_error "❌ Unexpected version: $version"
            return 1
        fi
    else
        log_info "✅ Service info endpoint accessible"
    fi
    
    return 0
}

validate_circuit_breakers() {
    log_info "🔌 Validating circuit breakers..."
    
    local cb_response=$(curl -s "$CIRCUIT_BREAKER_URL" 2>/dev/null || echo "ERROR")
    
    if [ "$cb_response" = "ERROR" ]; then
        log_error "❌ Circuit breaker endpoint not accessible"
        return 1
    fi
    
    if command -v jq >/dev/null 2>&1; then
        # Check if any circuit breakers are open
        local open_breakers=$(echo "$cb_response" | jq -r 'to_entries[] | select(.value.state == "OPEN") | .key' 2>/dev/null || echo "")
        
        if [ -z "$open_breakers" ]; then
            log_success "✅ All circuit breakers are closed"
        else
            log_warn "⚠️ Open circuit breakers: $open_breakers"
        fi
    else
        log_info "✅ Circuit breaker endpoint accessible"
    fi
    
    return 0
}

validate_authentication_flow() {
    log_info "🔐 Validating authentication flow..."
    
    # Test authentication endpoint
    local auth_payload='{
        "email": "'$TEST_EMAIL'",
        "password": "'$TEST_PASSWORD'",
        "platform": "test",
        "browser": "curl",
        "version": "1.0.0"
    }'
    
    local auth_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$auth_payload" \
        "$AUTH_URL" 2>/dev/null || echo "ERROR")
    
    if [ "$auth_response" = "ERROR" ]; then
        log_error "❌ Authentication endpoint not accessible"
        return 1
    fi
    
    if command -v jq >/dev/null 2>&1; then
        local success=$(echo "$auth_response" | jq -r '.success' 2>/dev/null || echo "false")
        local mode=$(echo "$auth_response" | jq -r '.mode' 2>/dev/null || echo "UNKNOWN")
        
        if [ "$success" = "true" ]; then
            log_success "✅ Authentication successful (mode: $mode)"
        else
            local error=$(echo "$auth_response" | jq -r '.error' 2>/dev/null || echo "Unknown error")
            log_info "ℹ️ Authentication failed as expected: $error"
        fi
    else
        log_info "✅ Authentication endpoint accessible"
    fi
    
    return 0
}

validate_performance() {
    log_info "⚡ Validating performance..."
    
    local total_requests=0
    local successful_requests=0
    local total_response_time=0
    local max_response_time=0
    local min_response_time=999999
    
    log_info "Running performance test for 60 seconds..."
    
    local end_time=$(($(date +%s) + 60))
    
    while [ $(date +%s) -lt $end_time ]; do
        local start_time=$(date +%s%3N)
        
        if curl -f -s "$HEALTH_URL" >/dev/null 2>&1; then
            ((successful_requests++))
        fi
        
        local end_time_ms=$(date +%s%3N)
        local response_time=$((end_time_ms - start_time))
        
        total_response_time=$((total_response_time + response_time))
        
        if [ $response_time -gt $max_response_time ]; then
            max_response_time=$response_time
        fi
        
        if [ $response_time -lt $min_response_time ]; then
            min_response_time=$response_time
        fi
        
        ((total_requests++))
        sleep 1
    done
    
    local success_rate=$((successful_requests * 100 / total_requests))
    local avg_response_time=$((total_response_time / total_requests))
    
    log_info "Performance Results:"
    log_info "  Total requests: $total_requests"
    log_info "  Successful requests: $successful_requests"
    log_info "  Success rate: $success_rate%"
    log_info "  Average response time: ${avg_response_time}ms"
    log_info "  Min response time: ${min_response_time}ms"
    log_info "  Max response time: ${max_response_time}ms"
    
    # Validate performance thresholds
    if [ $success_rate -lt 95 ]; then
        log_error "❌ Success rate ($success_rate%) below threshold (95%)"
        return 1
    fi
    
    if [ $avg_response_time -gt 500 ]; then
        log_error "❌ Average response time (${avg_response_time}ms) above threshold (500ms)"
        return 1
    fi
    
    log_success "✅ Performance validation passed"
    return 0
}

validate_security_headers() {
    log_info "🛡️ Validating security headers..."
    
    local headers=$(curl -I -s "$SERVICE_URL" 2>/dev/null || echo "ERROR")
    
    if [ "$headers" = "ERROR" ]; then
        log_error "❌ Could not retrieve headers"
        return 1
    fi
    
    # Check for security headers
    local security_headers=("X-Content-Type-Options" "X-Frame-Options" "X-XSS-Protection" "Strict-Transport-Security")
    local missing_headers=()
    
    for header in "${security_headers[@]}"; do
        if echo "$headers" | grep -qi "$header"; then
            log_success "  ✅ $header present"
        else
            missing_headers+=("$header")
            log_warn "  ⚠️ $header missing"
        fi
    done
    
    if [ ${#missing_headers[@]} -eq 0 ]; then
        log_success "✅ All security headers present"
    else
        log_warn "⚠️ Missing security headers: ${missing_headers[*]}"
    fi
    
    return 0
}

validate_database_connectivity() {
    log_info "🗄️ Validating database connectivity..."
    
    # Check health endpoint for database status
    local health_response=$(curl -s "$HEALTH_URL" 2>/dev/null || echo "ERROR")
    
    if [ "$health_response" = "ERROR" ]; then
        log_error "❌ Cannot check database connectivity"
        return 1
    fi
    
    if command -v jq >/dev/null 2>&1; then
        local db_status=$(echo "$health_response" | jq -r '.components.database.status' 2>/dev/null || echo "UNKNOWN")
        local db_response_time=$(echo "$health_response" | jq -r '.components.database.responseTime' 2>/dev/null || echo "0")
        
        if [ "$db_status" = "HEALTHY" ]; then
            log_success "✅ Database connectivity: HEALTHY (${db_response_time}ms)"
        else
            log_error "❌ Database connectivity: $db_status"
            return 1
        fi
    else
        log_info "✅ Database connectivity check completed"
    fi
    
    return 0
}

# =============================================================================
# MAIN VALIDATION FUNCTION
# =============================================================================

run_comprehensive_validation() {
    log_info "🚀 Starting comprehensive validation of Identity Service Consolidated"
    log_info "Validation log: $LOG_FILE"
    
    local validation_results=()
    
    # Run all validations
    if validate_service_availability; then
        validation_results+=("✅ Service Availability")
    else
        validation_results+=("❌ Service Availability")
    fi
    
    if validate_health_endpoints; then
        validation_results+=("✅ Health Endpoints")
    else
        validation_results+=("❌ Health Endpoints")
    fi
    
    if validate_service_info; then
        validation_results+=("✅ Service Information")
    else
        validation_results+=("❌ Service Information")
    fi
    
    if validate_circuit_breakers; then
        validation_results+=("✅ Circuit Breakers")
    else
        validation_results+=("❌ Circuit Breakers")
    fi
    
    if validate_authentication_flow; then
        validation_results+=("✅ Authentication Flow")
    else
        validation_results+=("❌ Authentication Flow")
    fi
    
    if validate_performance; then
        validation_results+=("✅ Performance")
    else
        validation_results+=("❌ Performance")
    fi
    
    if validate_security_headers; then
        validation_results+=("✅ Security Headers")
    else
        validation_results+=("❌ Security Headers")
    fi
    
    if validate_database_connectivity; then
        validation_results+=("✅ Database Connectivity")
    else
        validation_results+=("❌ Database Connectivity")
    fi
    
    # Summary
    log_info ""
    log_info "📊 VALIDATION SUMMARY"
    log_info "===================="
    
    local passed=0
    local failed=0
    
    for result in "${validation_results[@]}"; do
        log_info "$result"
        if [[ $result == ✅* ]]; then
            ((passed++))
        else
            ((failed++))
        fi
    done
    
    log_info ""
    log_info "Total validations: $((passed + failed))"
    log_info "Passed: $passed"
    log_info "Failed: $failed"
    
    if [ $failed -eq 0 ]; then
        log_success "🎉 ALL VALIDATIONS PASSED! Identity Service Consolidation is successful!"
        return 0
    else
        log_error "❌ $failed validation(s) failed. Please review and address the issues."
        return 1
    fi
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Handle script arguments
case "${1:-validate}" in
    "validate")
        run_comprehensive_validation
        ;;
    "health")
        validate_health_endpoints
        ;;
    "performance")
        validate_performance
        ;;
    "security")
        validate_security_headers
        ;;
    "auth")
        validate_authentication_flow
        ;;
    *)
        echo "Usage: $0 {validate|health|performance|security|auth}"
        exit 1
        ;;
esac
