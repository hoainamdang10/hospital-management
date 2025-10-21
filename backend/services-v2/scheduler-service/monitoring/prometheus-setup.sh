#!/bin/bash

# Prometheus Setup Script for Scheduler Service
# Version: 1.0.0
# Last Updated: 2025-10-21

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMETHEUS_DIR="$SCRIPT_DIR/prometheus"

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if Docker is running
check_docker() {
    print_header "Checking Docker"
    
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    print_success "Docker is running"
}

# Check if configuration files exist
check_config() {
    print_header "Checking Configuration Files"
    
    if [ ! -f "$PROMETHEUS_DIR/prometheus.yml" ]; then
        print_error "prometheus.yml not found in $PROMETHEUS_DIR"
        exit 1
    fi
    print_success "prometheus.yml found"
    
    if [ ! -f "$PROMETHEUS_DIR/alerts.yml" ]; then
        print_error "alerts.yml not found in $PROMETHEUS_DIR"
        exit 1
    fi
    print_success "alerts.yml found"
}

# Validate Prometheus configuration
validate_config() {
    print_header "Validating Prometheus Configuration"
    
    # Use promtool to validate config (if available)
    if command -v promtool &> /dev/null; then
        if promtool check config "$PROMETHEUS_DIR/prometheus.yml"; then
            print_success "Prometheus configuration is valid"
        else
            print_error "Prometheus configuration is invalid"
            exit 1
        fi
        
        if promtool check rules "$PROMETHEUS_DIR/alerts.yml"; then
            print_success "Alert rules are valid"
        else
            print_error "Alert rules are invalid"
            exit 1
        fi
    else
        print_warning "promtool not found. Skipping configuration validation."
        print_info "Install Prometheus locally to enable validation: https://prometheus.io/download/"
    fi
}

# Start Prometheus
start_prometheus() {
    print_header "Starting Prometheus"
    
    cd "$SCRIPT_DIR"
    
    # Check if Prometheus is already running
    if docker ps | grep -q scheduler-prometheus; then
        print_warning "Prometheus is already running"
        print_info "Use './prometheus-setup.sh restart' to restart"
        return
    fi
    
    # Start Prometheus
    docker-compose -f docker-compose.prometheus.yml up -d
    
    # Wait for Prometheus to be healthy
    print_info "Waiting for Prometheus to be healthy..."
    sleep 5
    
    MAX_RETRIES=30
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
            print_success "Prometheus is healthy"
            break
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo -n "."
        sleep 2
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        print_error "Prometheus failed to start within timeout"
        print_info "Check logs: docker logs scheduler-prometheus"
        exit 1
    fi
    
    echo ""
    print_success "Prometheus started successfully"
    print_info "Prometheus UI: http://localhost:9090"
    print_info "Metrics endpoint: http://localhost:3025/metrics"
}

# Stop Prometheus
stop_prometheus() {
    print_header "Stopping Prometheus"
    
    cd "$SCRIPT_DIR"
    
    if ! docker ps | grep -q scheduler-prometheus; then
        print_warning "Prometheus is not running"
        return
    fi
    
    docker-compose -f docker-compose.prometheus.yml down
    
    print_success "Prometheus stopped"
}

# Restart Prometheus
restart_prometheus() {
    print_header "Restarting Prometheus"
    
    stop_prometheus
    sleep 2
    start_prometheus
}

# Show Prometheus status
status_prometheus() {
    print_header "Prometheus Status"
    
    if docker ps | grep -q scheduler-prometheus; then
        print_success "Prometheus is running"
        
        # Show container details
        docker ps --filter "name=scheduler-prometheus" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        # Check health
        if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
            print_success "Prometheus is healthy"
        else
            print_error "Prometheus is unhealthy"
        fi
        
        # Show URLs
        echo ""
        print_info "Prometheus UI: http://localhost:9090"
        print_info "Metrics endpoint: http://localhost:3025/metrics"
        print_info "Targets: http://localhost:9090/targets"
        print_info "Alerts: http://localhost:9090/alerts"
    else
        print_warning "Prometheus is not running"
        print_info "Use './prometheus-setup.sh start' to start"
    fi
}

# Show logs
logs_prometheus() {
    print_header "Prometheus Logs"
    
    if ! docker ps | grep -q scheduler-prometheus; then
        print_error "Prometheus is not running"
        exit 1
    fi
    
    docker logs -f scheduler-prometheus
}

# Reload configuration
reload_config() {
    print_header "Reloading Prometheus Configuration"
    
    if ! docker ps | grep -q scheduler-prometheus; then
        print_error "Prometheus is not running"
        exit 1
    fi
    
    # Validate config first
    validate_config
    
    # Reload config
    if curl -X POST http://localhost:9090/-/reload > /dev/null 2>&1; then
        print_success "Configuration reloaded successfully"
    else
        print_error "Failed to reload configuration"
        print_info "Make sure --web.enable-lifecycle is enabled"
        exit 1
    fi
}

# Clean up (remove volumes)
cleanup_prometheus() {
    print_header "Cleaning Up Prometheus"
    
    print_warning "This will remove all Prometheus data!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleanup cancelled"
        exit 0
    fi
    
    cd "$SCRIPT_DIR"
    
    # Stop and remove containers and volumes
    docker-compose -f docker-compose.prometheus.yml down -v
    
    print_success "Prometheus cleaned up"
}

# Show help
show_help() {
    cat << EOF
Prometheus Setup Script for Scheduler Service

Usage: ./prometheus-setup.sh [COMMAND]

Commands:
    start       Start Prometheus
    stop        Stop Prometheus
    restart     Restart Prometheus
    status      Show Prometheus status
    logs        Show Prometheus logs (follow mode)
    reload      Reload Prometheus configuration
    validate    Validate Prometheus configuration
    cleanup     Stop Prometheus and remove all data
    help        Show this help message

Examples:
    ./prometheus-setup.sh start
    ./prometheus-setup.sh status
    ./prometheus-setup.sh logs
    ./prometheus-setup.sh reload

EOF
}

# Main script
main() {
    case "${1:-}" in
        start)
            check_docker
            check_config
            validate_config
            start_prometheus
            ;;
        stop)
            check_docker
            stop_prometheus
            ;;
        restart)
            check_docker
            check_config
            validate_config
            restart_prometheus
            ;;
        status)
            check_docker
            status_prometheus
            ;;
        logs)
            check_docker
            logs_prometheus
            ;;
        reload)
            check_docker
            check_config
            validate_config
            reload_config
            ;;
        validate)
            check_config
            validate_config
            ;;
        cleanup)
            check_docker
            cleanup_prometheus
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: ${1:-}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main
main "$@"

