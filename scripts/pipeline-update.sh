#!/bin/bash
# Phase 2 — Update Lambda function code from lambda-package.zip artifact
set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:-dev}"
REGION="${REGION:-us-east-1}"
FUNCTION_NAME="tsuru-${ENVIRONMENT}-api-handler"

echo "=== Tsuru Lambda Update ==="
echo "  Function    : ${FUNCTION_NAME}"
echo "  Region      : ${REGION}"
echo ""

# Locate lambda-package.zip — in secondary artifact dir when run via CodePipeline,
# or in the working directory when run standalone.
ZIP_PATH="${CODEBUILD_SRC_DIR_BuildOutput:-$PWD}/lambda-package.zip"

if [ ! -f "$ZIP_PATH" ]; then
  echo "ERROR: lambda-package.zip not found at $ZIP_PATH"
  exit 1
fi
echo "Using zip: $ZIP_PATH"

# Check function exists
if ! aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &>/dev/null; then
  echo "[SKIP] Function ${FUNCTION_NAME} does not exist — deploy Lambda stack first"
  exit 0
fi

# Update with retry (throttle protection)
UPDATED=false
for attempt in 1 2 3; do
  echo "Attempt ${attempt}: updating ${FUNCTION_NAME}..."
  if aws lambda update-function-code \
      --function-name "$FUNCTION_NAME" \
      --zip-file "fileb://$ZIP_PATH" \
      --region "$REGION" \
      --output text --query 'FunctionArn'; then
    UPDATED=true
    break
  fi
  echo "  Retrying in 10s..."
  sleep 10
done

if [ "$UPDATED" = "false" ]; then
  echo "ERROR: Failed to update ${FUNCTION_NAME} after 3 attempts"
  exit 1
fi

echo ""
echo "Updated: ${FUNCTION_NAME}"
echo "Update complete."
