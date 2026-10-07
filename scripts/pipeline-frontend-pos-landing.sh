#!/bin/bash
# Phase: Deploy pos-landing — CFN stack (S3 + CloudFront + ACM + Route53) + S3 sync + CF invalidation
set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:-dev}"
REGION="${REGION:-us-east-1}"
ROOT_DOMAIN="${ROOT_DOMAIN:-tsuru.jcampos.dev}"
POS_LANDING_DOMAIN="${POS_LANDING_DOMAIN:-pos-landing.tsuru.jcampos.dev}"

STACK_NAME="tsuru-${ENVIRONMENT}-frontend-pos-landing"
BUCKET_NAME="tsuru-${ENVIRONMENT}-pos-landing"
DIST_DIR="dist/fe/pos-landing"

echo "=== Tsuru Frontend Deploy: pos-landing ==="
echo "  Environment : $ENVIRONMENT"
echo "  Region      : $REGION"
echo "  Domain      : $POS_LANDING_DOMAIN"
echo ""

# ── Resolve Route53 hosted zone ───────────────────────────────────────────
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

# ── Deploy CloudFormation stack (idempotent) ──────────────────────────────
echo "Deploying CFN stack: ${STACK_NAME}..."
aws cloudformation deploy \
  --template-file cloudformation/frontend-site.yml \
  --stack-name "${STACK_NAME}" \
  --parameter-overrides \
    "BucketName=${BUCKET_NAME}" \
    "DomainName=${POS_LANDING_DOMAIN}" \
    "HostedZoneId=${HOSTED_ZONE_ID}" \
    "Environment=${ENVIRONMENT}" \
  --region "${REGION}" \
  --no-fail-on-empty-changeset
echo "Stack ${STACK_NAME} ready."
echo ""

# ── Sync files to S3 ──────────────────────────────────────────────────────
# HTML + config.json — no cache (always latest)
aws s3 sync "${DIST_DIR}/" "s3://${BUCKET_NAME}" \
  --delete \
  --exclude "assets/*" \
  --cache-control "no-cache, no-store, must-revalidate"

# Hashed JS/CSS assets — immutable
aws s3 sync "${DIST_DIR}/assets/" "s3://${BUCKET_NAME}/assets/" \
  --cache-control "public, max-age=31536000, immutable" 2>/dev/null || true

echo "S3 sync complete."
echo ""

# ── CloudFront invalidation ───────────────────────────────────────────────
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
echo "pos-landing deployed: https://${POS_LANDING_DOMAIN}"
