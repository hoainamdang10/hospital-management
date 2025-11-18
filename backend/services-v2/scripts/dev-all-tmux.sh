#!/bin/bash
# Development Script - Start All Services in Tmux (Linux/macOS)
# Usage: ./scripts/dev-all-tmux.sh

set -e

echo "🚀 Starting Hospital Management Services V2..."
echo "Each service will run in a separate tmux pane"
echo ""

# Get the base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux is not installed. Please install tmux first:"
    echo "  - Ubuntu/Debian: sudo apt install tmux"
    echo "  - macOS: brew install tmux"
    exit 1
fi

# Check if infrastructure is running
echo "📋 Checking infrastructure..."
redis_running=$(docker ps --filter "name=hospital-redis-v2" --filter "status=running" --format "{{.Names}}")
rabbit_running=$(docker ps --filter "name=hospital-rabbitmq-v2" --filter "status=running" --format "{{.Names}}")

if [ -z "$redis_running" ] || [ -z "$rabbit_running" ]; then
    echo "⚠️  Infrastructure not running. Starting Redis + RabbitMQ..."
    cd "$BASE_DIR"
    docker-compose -f docker-compose.infra.yml up -d
    echo ""
    echo "⏳ Waiting 5 seconds for infrastructure to be ready..."
    sleep 5
else
    echo "✅ Infrastructure is running"
fi

echo ""
echo "🚀 Starting tmux session 'hospital-v2'..."

# Kill existing session if exists
tmux kill-session -t hospital-v2 2>/dev/null || true

# Create new session with first service (API Gateway)
tmux new-session -d -s hospital-v2 -n "gateway" "cd $BASE_DIR/api-gateway && npm run dev"

# Split window and create panes for other services
tmux split-window -h -t hospital-v2:0 "cd $BASE_DIR/identity-service && npm run dev"
tmux split-window -v -t hospital-v2:0.0 "cd $BASE_DIR/patient-registry-service && npm run dev"
tmux split-window -v -t hospital-v2:0.1 "cd $BASE_DIR/provider-staff-service && npm run dev"

# Create additional panes
tmux split-window -h -t hospital-v2:0.0 "cd $BASE_DIR/appointments-service && npm run dev"
tmux split-window -v -t hospital-v2:0.4 "cd $BASE_DIR/notifications-service && npm run dev"
tmux split-window -h -t hospital-v2:0.5 "cd $BASE_DIR/billing-service && npm run dev"

# Balance the layout
tmux select-layout -t hospital-v2:0 tiled

echo ""
echo "✅ Tmux session 'hospital-v2' created!"
echo ""
echo "📝 Commands:"
echo "  - Attach to session: tmux attach -t hospital-v2"
echo "  - Detach: Ctrl+B then D"
echo "  - Navigate panes: Ctrl+B then arrow keys"
echo "  - Kill session: tmux kill-session -t hospital-v2"
echo ""
echo "🚀 Attaching to session..."

# Attach to the session
tmux attach -t hospital-v2
