#!/bin/bash

# Athora - Start All Services
# Usage: ./start.sh [all|web|backend|mobile]

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[Athora]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Check dependencies
check_deps() {
  if ! command -v pnpm &> /dev/null; then
    echo "pnpm not found. Install: npm install -g pnpm"
    exit 1
  fi
}

# Install dependencies if needed
install_deps() {
  if [ ! -d "node_modules" ]; then
    log "Installing dependencies..."
    pnpm install
  fi
}

# Start frontend (Next.js)
start_web() {
  log "Starting web (Next.js) on http://localhost:3000"
  pnpm --filter @athora/web dev &
}

# Start backend (NestJS)
start_backend() {
  log "Starting backend (NestJS) on http://localhost:3001"
  pnpm --filter @athora/backend start:dev &
}

# Start mobile (Expo)
start_mobile() {
  log "Starting mobile (Expo)"
  pnpm --filter @athora/mobile dev &
}

# Stop all
stop_all() {
  log "Stopping all services..."
  pkill -f "next dev" 2>/dev/null || true
  pkill -f "nest start" 2>/dev/null || true
  pkill -f "expo start" 2>/dev/null || true
  log "All services stopped."
}

# Main
check_deps
install_deps

MODE=${1:-all}

case $MODE in
  all)
    log "Starting all services..."
    echo ""
    start_web
    start_backend
    echo ""
    info "Web:     http://localhost:3000"
    info "Backend: http://localhost:3001"
    info ""
    info "Press Ctrl+C to stop all services"
    wait
    ;;
  web)
    start_web
    wait
    ;;
  backend)
    start_backend
    wait
    ;;
  mobile)
    start_mobile
    wait
    ;;
  stop)
    stop_all
    ;;
  *)
    echo "Usage: ./start.sh [all|web|backend|mobile|stop]"
    echo ""
    echo "  all      Start web + backend (default)"
    echo "  web      Start frontend only"
    echo "  backend  Start backend only"
    echo "  mobile   Start Expo dev server"
    echo "  stop     Stop all running services"
    exit 1
    ;;
esac
