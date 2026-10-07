#!/bin/bash
# Phase: Deploy pos-system template — CFN stack + S3 sync + CF invalidation
set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:-dev}"
REGION="${REGION:-us-east-1}"
FRONTEND_DOMAIN="${FRONTEND_DOMAIN:-tsuru.jcampos.dev}"
ROOT_DOMAIN="${ROOT_DOMAIN:-tsuru.jcampos.dev}"

STACK_NAME="tsuru-${ENVIRONMENT}-frontend-pos-system"
BUCKET_NAME="tsuru-${ENVIRONMENT}-pos-system"
DIST_DIR="dist/templates/pos-system"
DOMAIN="pos.${FRONTEND_DOMAIN}"

echo "=== Tsuru Frontend Deploy: pos-system ==="
echo "  Environment : $ENVIRONMENT"
echo "  Region      : $REGION"
echo "  Domain      : $DOMAIN"
echo ""

# Resolve Route53 hosted zone
echo "Resolving hosted zone for ${ROOT_DOMAIN}..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='${ROOT_DOMAIN}.'].Id" \
  --output text | sed 's|/hostedzone/||')

if [ -z "$HOSTED_ZONE_ID" ]; then
  echo "ERROR: Could not resolve hosted zone for $ROOT_DOMAIN"
  exit 1
fi
echo "  HostedZoneId: $HOSTED_ZONE_ID"
echo ""

# Deploy CloudFormation stack (create or update — no-op if nothing changed)
echo "Deploying CFN stack: ${STACK_NAME}..."
aws cloudformation deploy \
  --template-file cloudformation/frontend-site.yml \
  --stack-name "${STACK_NAME}" \
  --parameter-overrides \
    "BucketName=${BUCKET_NAME}" \
    "DomainName=${DOMAIN}" \
    "HostedZoneId=${HOSTED_ZONE_ID}" \
    "Environment=${ENVIRONMENT}" \
  --region "${REGION}" \
  --no-fail-on-empty-changeset
echo "Stack ${STACK_NAME} ready."
echo ""

# Sync HTML/JSON with no-cache; hashed assets with long-lived cache
aws s3 sync "${DIST_DIR}/" "s3://${BUCKET_NAME}" \
  --delete \
  --exclude "assets/*" \
  --cache-control "no-cache, no-store, must-revalidate"

aws s3 sync "${DIST_DIR}/assets/" "s3://${BUCKET_NAME}/assets/" \
  --cache-control "public, max-age=31536000, immutable" 2>/dev/null || true

echo "S3 sync complete."
echo ""

# Retrieve distribution ID and create invalidation
DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
  --output text)

echo "Invalidating CloudFront cache (distribution: ${DIST_ID})..."
aws cloudfront create-invalidation \
  --distribution-id "${DIST_ID}" \
  --paths "/*"

echo ""
echo "pos-system deployed: https://${DOMAIN}"
