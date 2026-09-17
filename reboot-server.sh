#!/usr/bin/env bash
# Restart the local Tsuru workspace after refreshing admin dashboard config.
# Usage: ./reboot-server.sh [dev|stag|prod] [aws-profile|-]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVIRONMENT="${1:-dev}"
AWS_PROFILE_NAME="${2:-PACIFIC-PROD}"
PORTS=(3001 3002 5000 5173 5180 9000)

cd "${REPO_ROOT}"
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required" >&2; exit 1; }

echo "Refreshing admin dashboard configuration from SSM..."
pnpm --dir fe/dashboard env:ssm -- "${ENVIRONMENT}" "${AWS_PROFILE_NAME}"

echo "Stopping local processes on configured development ports..."
for port in "${PORTS[@]}"; do
  while IFS= read -r pid; do
    [[ -n "${pid}" ]] && kill "${pid}" 2>/dev/null || true
  done < <(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)
done

echo "Clearing local Vite caches..."
for directory in \
  fe/dashboard/node_modules/.vite fe/dashboard/.vite fe/dashboard/dist \
  fe/landing/node_modules/.vite fe/landing/.vite fe/landing/dist \
  fe/pos-system/node_modules/.vite fe/pos-system/.vite fe/pos-system/dist \
  fe/pos-landing/node_modules/.vite fe/pos-landing/.vite fe/pos-landing/dist; do
  [[ -e "${directory}" ]] && rm -rf -- "${directory}"
done

mkdir -p logs
echo "Starting server, landing, admin dashboard, POS, and POS landing..."
nohup pnpm run dev:all:full > logs/server.log 2>&1 &
process_id=$!
sleep 3

if ! kill -0 "${process_id}" 2>/dev/null; then
  echo "Services failed to start. See ${REPO_ROOT}/logs/server.log" >&2
  exit 1
fi

echo "Tsuru local services started (PID ${process_id})."
echo "Logs: tail -f ${REPO_ROOT}/logs/server.log"
