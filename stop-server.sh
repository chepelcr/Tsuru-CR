#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Rebooting Tsuru server...${NC}"

# Kill existing server processes by name
echo "Stopping existing processes..."
taskkill //F //IM node.exe 2>/dev/null || true
taskkill //F //IM tsx.exe 2>/dev/null || true

# Force kill processes on specific ports
echo "Stopping processes on ports 3001, 3002, 5000, 9000..."
for port in 3001 3002 5000 9000; do
  pid=$(netstat -ano | grep ":$port" | grep LISTENING | awk '{print $5}' | head -1)
  if [ ! -z "$pid" ]; then
    taskkill //F //PID $pid 2>/dev/null || true
  fi
done

echo -e "${GREEN}Done.${NC}"
echo ""
