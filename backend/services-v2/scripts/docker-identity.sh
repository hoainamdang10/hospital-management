#!/bin/bash

# Docker Identity Service Management Script
# Hospital Management System V2
#
# Usage: ./docker-identity.sh [command]
# Commands: build, start, stop, restart, logs, health, clean, rebuild, status

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.v2.yml"
SERVICE_NAME="identity-service"
CONTAINER_NAME="hospital-identity-service-v2"
HEALTH_URL="http://localhost:3021/health"

# Helper functions
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  ${1}${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Check if docker and docker-compose are available
check_prerequisites() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
}

# Build identity service
build_service() {
    print_header "Building Identity Service"
    print_info "Building Docker image..."
    docker-compose -f $COMPOSE_FILE build $SERVICE_NAME
    print_success "Build completed successfully"
}

# Start infrastructure (Redis + RabbitMQ)
start_infrastructure() {
    print_info "Starting infrastructure services..."
    docker-compose -f $COMPOSE_FILE --profile infrastructure up -d
    print_info "Waiting for RabbitMQ to be ready (10 seconds)..."
    sleep 10
    print_success "Infrastructure services started"
}

# Start identity service
start_service() {
    print_header "Starting Identity Service"

    # Check if infrastructure is running
    if ! docker ps | grep -q "hospital-redis-v2"; then
        start_infrastructure
    fi

    print_info "Starting Identity Service..."
    docker-compose -f $COMPOSE_FILE up -d $SERVICE_NAME

    print_info "Waiting for service to be ready (5 seconds)..."
    sleep 5

    if docker ps | grep -q "$CONTAINER_NAME"; then
        print_success "Identity Service started successfully"
        check_health
    else
        print_error "Failed to start Identity Service"
        exit 1
    fi
}

# Stop identity service
stop_service() {
    print_header "Stopping Identity Service"
    docker-compose -f $COMPOSE_FILE stop $SERVICE_NAME
    print_success "Identity Service stopped"
}

# Restart identity service
restart_service() {
    print_header "Restarting Identity Service"
    docker-compose -f $COMPOSE_FILE restart $SERVICE_NAME
    sleep 5
    check_health
    print_success "Identity Service restarted"
}

# Show logs
show_logs() {
    print_header "Identity Service Logs"
    local lines=${1:-50}
    docker-compose -f $COMPOSE_FILE logs --tail=$lines -f $SERVICE_NAME
}

# Check health
check_health() {
    print_info "Checking service health..."

    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        print_error "Container is not running"
        return 1
    fi

    # Try to get health status
    if command -v curl &> /dev/null; then
        local response=$(curl -s $HEALTH_URL)
        if echo "$response" | grep -q "HEALTHY"; then
            print_success "Service is HEALTHY"
            echo "$response" | grep -o '"overall":"[^"]*"'
            echo "$response" | grep -o '"version":"[^"]*"'
        else
            print_warning "Service health check failed"
            echo "$response"
        fi
    else
        print_warning "curl not found, skipping health check"
    fi

    # Show container status
    echo ""
    print_info "Container Status:"
    docker ps | grep -E "NAME|$CONTAINER_NAME"
}

# Show status
show_status() {
    print_header "Service Status"
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    check_health
}

# Clean up (stop all services and remove volumes)
clean_all() {
    print_header "Cleaning Up"
    print_warning "This will stop all services and remove volumes!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Stopping all services..."
        docker-compose -f $COMPOSE_FILE down

        print_info "Removing volumes..."
        docker volume rm services-v2_rabbitmq-v2-data 2>/dev/null || true
        docker volume rm services-v2_redis-v2-data 2>/dev/null || true

        print_success "Cleanup completed"
    else
        print_info "Cleanup cancelled"
    fi
}

# Rebuild (clean build)
rebuild_service() {
    print_header "Rebuilding Identity Service"
    print_info "Stopping service..."
    docker-compose -f $COMPOSE_FILE stop $SERVICE_NAME

    print_info "Removing old image..."
    docker-compose -f $COMPOSE_FILE rm -f $SERVICE_NAME

    print_info "Building new image..."
    docker-compose -f $COMPOSE_FILE build --no-cache $SERVICE_NAME

    print_success "Rebuild completed"

    read -p "Start the service now? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        start_service
    fi
}

# Show help
show_help() {
    cat << EOF
${BLUE}Identity Service Docker Management Script${NC}

${YELLOW}Usage:${NC}
    ./docker-identity.sh [command]

${YELLOW}Commands:${NC}
    ${GREEN}build${NC}       Build the Docker image
    ${GREEN}start${NC}       Start identity service (with infrastructure)
    ${GREEN}stop${NC}        Stop identity service
    ${GREEN}restart${NC}     Restart identity service
    ${GREEN}logs${NC}        Show service logs (follow mode)
    ${GREEN}health${NC}      Check service health
    ${GREEN}status${NC}      Show service status
    ${GREEN}rebuild${NC}     Rebuild service from scratch (no cache)
    ${GREEN}clean${NC}       Stop all services and remove volumes
    ${GREEN}help${NC}        Show this help message

${YELLOW}Examples:${NC}
    ./docker-identity.sh build        # Build the image
    ./docker-identity.sh start        # Start the service
    ./docker-identity.sh logs         # View logs
    ./docker-identity.sh health       # Check health

${YELLOW}Quick Start:${NC}
    1. ./docker-identity.sh build
    2. ./docker-identity.sh start
    3. ./docker-identity.sh health

${YELLOW}Service Info:${NC}
    Container:  $CONTAINER_NAME
    Port:       3021 -> 3001
    Health URL: $HEALTH_URL
    Metrics:    http://localhost:3021/metrics (protected)
    API Docs:   http://localhost:3021/api-docs (protected)

EOF
}

# Main script
main() {
    check_prerequisites

    case "${1:-help}" in
        build)
            build_service
            ;;
        start)
            start_service
            ;;
        stop)
            stop_service
            ;;
        restart)
            restart_service
            ;;
        logs)
            show_logs "${2:-50}"
            ;;
        health)
            check_health
            ;;
        status)
            show_status
            ;;
        rebuild)
            rebuild_service
            ;;
        clean)
            clean_all
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
