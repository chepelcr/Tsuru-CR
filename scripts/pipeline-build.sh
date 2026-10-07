#!/bin/bash
# Phase 1 — Build lambda-package.zip for Linux CodeBuild environment.
# Replaces the local `npm run package:lambda` which uses PowerShell/Compress-Archive.
set -euo pipefail

echo "=== Tsuru Lambda Build ==="
echo "  Environment : ${ENVIRONMENT:-dev}"
echo "  Region      : ${REGION:-us-east-1}"
echo ""

# Step 1: Generate swagger spec (dist mode → dist/swagger-spec.json)
echo "Generating swagger spec..."
node scripts/generate-swagger-spec.cjs --dist

# Step 2: Build Lambda bundle (esbuild → dist/lambda.js)
echo "Building Lambda bundle..."
npm run build:lambda

# Step 3: Package into zip (Linux zip, replaces PowerShell Compress-Archive)
echo "Packaging lambda-package.zip..."
rm -f lambda-package.zip
zip -j lambda-package.zip dist/lambda.js dist/swagger-spec.json

if [ ! -f "lambda-package.zip" ]; then
  echo "ERROR: lambda-package.zip not found after packaging"
  exit 1
fi

SIZE=$(du -h lambda-package.zip | cut -f1)
echo ""
echo "lambda-package.zip  →  ${SIZE}"
echo "Build complete."
