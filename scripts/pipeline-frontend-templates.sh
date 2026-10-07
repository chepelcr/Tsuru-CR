#!/bin/bash
# Phase: Deploy all template storefronts — CFN stacks in parallel + S3 sync + CF invalidation
set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:-dev}"
REGION="${REGION:-us-east-1}"
FRONTEND_DOMAIN="${FRONTEND_DOMAIN:-tsuru.jcampos.dev}"
ROOT_DOMAIN="${ROOT_DOMAIN:-tsuru.jcampos.dev}"

# Template slugs (must match templates/ folder names)
TEMPLATES=(
  tsuru-demo
  tech-gadgets
  vintage-fashion
  artisan-crafts
  gourmet-foods
  fitness-hub
  pet-care
  beauty-essentials
  pollo-porteno
)

echo "=== Tsuru Frontend Deploy: Templates (${#TEMPLATES[@]} apps) ==="
echo "  Environment : $ENVIRONMENT"
echo "  Region      : $REGION"
echo "  Base domain : $FRONTEND_DOMAIN"
echo ""

# Resolve Route53 hosted zone (shared across all template stacks)
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

# ── Phase 1: Deploy all CFN stacks in parallel ────────────────────────────────
# Initial creation takes ~15 min per stack (CloudFront + ACM cert validation).
# Subsequent updates detect no infra change and return immediately.
echo "Deploying CFN stacks in parallel..."
declare -A STACK_PIDS

for TMPL in "${TEMPLATES[@]}"; do
  STACK_NAME="tsuru-${ENVIRONMENT}-frontend-${TMPL}"
  BUCKET_NAME="tsuru-${ENVIRONMENT}-${TMPL}"
  DOMAIN="${TMPL}-example.${FRONTEND_DOMAIN}"

  echo "  Starting stack: ${STACK_NAME} → https://${DOMAIN}"
  aws cloudformation deploy \
    --template-file cloudformation/frontend-site.yml \
    --stack-name "${STACK_NAME}" \
    --parameter-overrides \
      "BucketName=${BUCKET_NAME}" \
      "DomainName=${DOMAIN}" \
      "HostedZoneId=${HOSTED_ZONE_ID}" \
      "Environment=${ENVIRONMENT}" \
    --region "${REGION}" \
    --no-fail-on-empty-changeset \
    > "/tmp/cfn-${TMPL}.log" 2>&1 &

  STACK_PIDS[$TMPL]=$!
done

echo ""
echo "Waiting for all CFN stacks to finish..."
FAILED=0
for TMPL in "${TEMPLATES[@]}"; do
  PID=${STACK_PIDS[$TMPL]}
  if wait "$PID"; then
    echo "  ✓ tsuru-${ENVIRONMENT}-frontend-${TMPL}"
  else
    echo "  ✗ tsuru-${ENVIRONMENT}-frontend-${TMPL} FAILED"
    cat "/tmp/cfn-${TMPL}.log" || true
    FAILED=$((FAILED + 1))
  fi
done

if [ "$FAILED" -gt 0 ]; then
  echo ""
  echo "ERROR: $FAILED CFN stack(s) failed. Aborting."
  exit 1
fi
echo "All stacks ready."
echo ""

# ── Phase 2: S3 sync + CloudFront invalidation per template ──────────────────
for TMPL in "${TEMPLATES[@]}"; do
  STACK_NAME="tsuru-${ENVIRONMENT}-frontend-${TMPL}"
  BUCKET_NAME="tsuru-${ENVIRONMENT}-${TMPL}"
  DIST_DIR="dist/templates/${TMPL}"
  DOMAIN="${TMPL}-example.${FRONTEND_DOMAIN}"

  echo "Syncing ${TMPL}..."

  # HTML/JSON → no-cache
  aws s3 sync "${DIST_DIR}/" "s3://${BUCKET_NAME}" \
    --delete \
    --exclude "assets/*" \
    --cache-control "no-cache, no-store, must-revalidate"

  # Hashed assets → long-lived cache
  aws s3 sync "${DIST_DIR}/assets/" "s3://${BUCKET_NAME}/assets/" \
    --cache-control "public, max-age=31536000, immutable" 2>/dev/null || true

  # Invalidate CloudFront cache
  DIST_ID=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
    --output text)

  aws cloudfront create-invalidation \
    --distribution-id "${DIST_ID}" \
    --paths "/*" \
    > /dev/null

  echo "  ✓ https://${DOMAIN}"
done

echo ""
echo "All ${#TEMPLATES[@]} template storefronts deployed."
