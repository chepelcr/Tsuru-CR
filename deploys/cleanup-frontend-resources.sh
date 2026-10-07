#!/bin/bash
# Cleanup all frontend resources created by setup-template-bucket.js
# so the CodePipeline can create fresh CFN-managed resources.
#
# Usage: bash deploys/cleanup-frontend-resources.sh [--dry-run]
#
# What this deletes:
#   - Route53 A alias records for all 10 domains
#   - CloudFront distributions (disable → wait → delete) in parallel
#   - S3 buckets (empty then delete)
#   - ACM certificates for each domain + the old wildcard *.tsuru.jcampos.dev
#   - CloudFront OAC: tsuru-template-oac
set -euo pipefail

PROFILE="${AWS_PROFILE:-J-CAMPOS}"
REGION="${REGION:-us-east-1}"
BASE_DOMAIN="${BASE_DOMAIN:-tsuru.jcampos.dev}"
ROOT_DOMAIN="${ROOT_DOMAIN:-tsuru.jcampos.dev}"
DRY_RUN=false

for arg in "$@"; do
  [ "$arg" = "--dry-run" ] && DRY_RUN=true
done

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()   { echo -e "${GREEN}[ OK ]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERR ]${NC} $*"; }
dry()  { echo -e "${YELLOW}[DRY ]${NC} WOULD: $*"; }

AWS="aws --profile $PROFILE --region $REGION"

# ── Resource names ─────────────────────────────────────────────────────────────

TEMPLATE_SUBDOMAINS=(
  tsuru-demo-example
  tech-gadgets-example
  vintage-fashion-example
  artisan-crafts-example
  gourmet-foods-example
  fitness-hub-example
  pet-care-example
  beauty-essentials-example
  pollo-porteno-example
)

DOMAIN_DASHES="${BASE_DOMAIN//./-}"   # tsuru-tsuru-dev

# All 10 domains
declare -A DOMAIN_TO_BUCKET
for SUB in "${TEMPLATE_SUBDOMAINS[@]}"; do
  DOMAIN_TO_BUCKET["${SUB}.${BASE_DOMAIN}"]="${SUB}-${DOMAIN_DASHES}"
done
DOMAIN_TO_BUCKET["${BASE_DOMAIN}"]="${DOMAIN_DASHES}-landing"
DOMAIN_TO_BUCKET["admin.${BASE_DOMAIN}"]="admin-${DOMAIN_DASHES}"

ALL_DOMAINS=("${!DOMAIN_TO_BUCKET[@]}")

echo ""
echo "========================================================"
echo "  Tsuru Frontend Resource Cleanup"
echo "  Base domain : $BASE_DOMAIN"
echo "  Profile     : $PROFILE"
[ "$DRY_RUN" = "true" ] && echo "  Mode        : DRY RUN (no changes)"
echo "========================================================"
echo ""
echo "Domains to clean up (${#ALL_DOMAINS[@]}):"
for D in "${ALL_DOMAINS[@]}"; do
  echo "  - $D  →  bucket: ${DOMAIN_TO_BUCKET[$D]}"
done
echo ""

# ── Resolve hosted zone ────────────────────────────────────────────────────────

log "Resolving Route53 hosted zone for ${ROOT_DOMAIN}..."
HOSTED_ZONE_ID=$(${AWS} route53 list-hosted-zones \
  --query "HostedZones[?Name=='${ROOT_DOMAIN}.'].Id" \
  --output text | sed 's|/hostedzone/||')

if [ -z "$HOSTED_ZONE_ID" ]; then
  err "Could not find hosted zone for $ROOT_DOMAIN. Route53 cleanup will be skipped."
  HOSTED_ZONE_ID=""
else
  ok "HostedZoneId: $HOSTED_ZONE_ID"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Phase 1: Delete Route53 A records
# ─────────────────────────────────────────────────────────────────────────────
log "=== Phase 1: Route53 records ==="

if [ -n "$HOSTED_ZONE_ID" ]; then
  for DOMAIN in "${ALL_DOMAINS[@]}"; do
    # Get the current alias target for this A record
    ALIAS=$(${AWS} route53 list-resource-record-sets \
      --hosted-zone-id "$HOSTED_ZONE_ID" \
      --query "ResourceRecordSets[?Name=='${DOMAIN}.' && Type=='A'].AliasTarget.DNSName" \
      --output text 2>/dev/null || true)

    if [ -z "$ALIAS" ] || [ "$ALIAS" = "None" ]; then
      warn "No A record found for $DOMAIN — skipping"
      continue
    fi

    log "Deleting Route53 A record: $DOMAIN → $ALIAS"
    if [ "$DRY_RUN" = "false" ]; then
      ${AWS} route53 change-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --change-batch "{
          \"Changes\": [{
            \"Action\": \"DELETE\",
            \"ResourceRecordSet\": {
              \"Name\": \"${DOMAIN}\",
              \"Type\": \"A\",
              \"AliasTarget\": {
                \"HostedZoneId\": \"Z2FDTNDATAQYW2\",
                \"DNSName\": \"${ALIAS}\",
                \"EvaluateTargetHealth\": false
              }
            }
          }]
        }" > /dev/null
      ok "Deleted A record: $DOMAIN"
    else
      dry "Delete Route53 A record: $DOMAIN"
    fi
  done
else
  warn "Skipping Route53 cleanup (no hosted zone)"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Phase 2: Disable CloudFront distributions in parallel, then wait, then delete
# ─────────────────────────────────────────────────────────────────────────────
log "=== Phase 2: CloudFront distributions ==="

declare -A DIST_ETAG_MAP    # domain → etag after disable
declare -A DIST_ID_MAP      # domain → distribution id

# Step 2a: Find and disable all distributions (parallel background jobs)
log "Discovering and disabling distributions in parallel..."
declare -A DISABLE_PIDS

for DOMAIN in "${ALL_DOMAINS[@]}"; do
  # Find distribution by alias
  DIST_ID=$(${AWS} cloudfront list-distributions \
    --query "DistributionList.Items[?Aliases.Items && contains(Aliases.Items, '${DOMAIN}')].Id" \
    --output text 2>/dev/null || true)

  if [ -z "$DIST_ID" ] || [ "$DIST_ID" = "None" ]; then
    warn "No CloudFront distribution found for $DOMAIN — skipping"
    continue
  fi

  DIST_ID_MAP[$DOMAIN]="$DIST_ID"
  log "Found distribution $DIST_ID for $DOMAIN"

  if [ "$DRY_RUN" = "true" ]; then
    dry "Disable + delete distribution $DIST_ID ($DOMAIN)"
    continue
  fi

  # Disable in background
  (
    # Get current config
    CONFIG_JSON=$(${AWS} cloudfront get-distribution-config --id "$DIST_ID")
    ETAG=$(echo "$CONFIG_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['ETag'])")
    CONFIG=$(echo "$CONFIG_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin)['DistributionConfig']; d['Enabled']=False; print(json.dumps(d))")

    ${AWS} cloudfront update-distribution \
      --id "$DIST_ID" \
      --if-match "$ETAG" \
      --distribution-config "$CONFIG" > /tmp/cf-disable-${DIST_ID}.json
    echo "disabled" > /tmp/cf-status-${DIST_ID}.txt
  ) &
  DISABLE_PIDS[$DOMAIN]=$!
done

# Wait for all disable operations
if [ "$DRY_RUN" = "false" ]; then
  for DOMAIN in "${!DISABLE_PIDS[@]}"; do
    PID=${DISABLE_PIDS[$DOMAIN]}
    DIST_ID=${DIST_ID_MAP[$DOMAIN]}
    if wait "$PID"; then
      ok "Disabled distribution $DIST_ID ($DOMAIN)"
    else
      err "Failed to disable distribution $DIST_ID ($DOMAIN) — will retry deletion anyway"
    fi
  done
  echo ""

  # Step 2b: Wait for all distributions to reach Deployed state, then delete
  log "Waiting for distributions to finish deploying (this takes 5–15 min per distribution)..."
  log "All distributions disabled in parallel — polling status now..."

  for DOMAIN in "${!DIST_ID_MAP[@]}"; do
    DIST_ID=${DIST_ID_MAP[$DOMAIN]}
    log "  Polling $DIST_ID ($DOMAIN)..."
    for i in $(seq 1 60); do
      STATUS=$(${AWS} cloudfront get-distribution \
        --id "$DIST_ID" \
        --query "Distribution.Status" \
        --output text 2>/dev/null || echo "Unknown")
      [ "$STATUS" = "Deployed" ] && break
      echo "    Status: $STATUS — waiting 15s (attempt $i/60)..."
      sleep 15
    done

    # Delete
    ETAG=$(${AWS} cloudfront get-distribution-config \
      --id "$DIST_ID" \
      --query "ETag" --output text)
    ${AWS} cloudfront delete-distribution \
      --id "$DIST_ID" \
      --if-match "$ETAG"
    ok "Deleted distribution $DIST_ID ($DOMAIN)"
  done

  # Delete shared OAC (tsuru-template-oac) if it exists
  OAC_ID=$(${AWS} cloudfront list-origin-access-controls \
    --query "OriginAccessControlList.Items[?Name=='tsuru-template-oac'].Id" \
    --output text 2>/dev/null || true)
  if [ -n "$OAC_ID" ] && [ "$OAC_ID" != "None" ]; then
    OAC_ETAG=$(${AWS} cloudfront get-origin-access-control \
      --id "$OAC_ID" --query "ETag" --output text)
    ${AWS} cloudfront delete-origin-access-control \
      --id "$OAC_ID" --if-match "$OAC_ETAG"
    ok "Deleted shared OAC tsuru-template-oac ($OAC_ID)"
  else
    warn "OAC tsuru-template-oac not found — skipping"
  fi
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Phase 3: Empty and delete S3 buckets
# ─────────────────────────────────────────────────────────────────────────────
log "=== Phase 3: S3 buckets ==="

for DOMAIN in "${ALL_DOMAINS[@]}"; do
  BUCKET="${DOMAIN_TO_BUCKET[$DOMAIN]}"

  # Check bucket exists
  if ! ${AWS} s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
    warn "Bucket $BUCKET does not exist — skipping"
    continue
  fi

  log "Emptying bucket: $BUCKET"
  if [ "$DRY_RUN" = "false" ]; then
    # Delete all current objects
    ${AWS} s3 rm "s3://${BUCKET}" --recursive --quiet || true
    # Delete all versioned objects and delete markers (in case versioning is enabled)
    ${AWS} s3api list-object-versions --bucket "$BUCKET" \
      --query '[Versions,DeleteMarkers][].[Key,VersionId]' \
      --output text 2>/dev/null \
      | while read -r KEY VER; do
          [ -z "$KEY" ] || [ -z "$VER" ] && continue
          ${AWS} s3api delete-object --bucket "$BUCKET" --key "$KEY" --version-id "$VER" > /dev/null 2>&1 || true
        done
    ${AWS} s3api delete-bucket --bucket "$BUCKET"
    ok "Deleted bucket $BUCKET"
  else
    dry "Empty + delete bucket $BUCKET"
  fi
done
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Phase 4: Delete ACM certificates
# ─────────────────────────────────────────────────────────────────────────────
log "=== Phase 4: ACM certificates ==="

# All candidate domain names: exact domains + old wildcard
CERT_DOMAINS=("${ALL_DOMAINS[@]}" "*.${BASE_DOMAIN}")

for DOMAIN in "${CERT_DOMAINS[@]}"; do
  CERT_ARN=$(${AWS} acm list-certificates \
    --region us-east-1 \
    --query "CertificateSummaryList[?DomainName=='${DOMAIN}'].CertificateArn" \
    --output text 2>/dev/null || true)

  if [ -z "$CERT_ARN" ] || [ "$CERT_ARN" = "None" ]; then
    warn "No ACM cert found for $DOMAIN — skipping"
    continue
  fi

  log "Deleting ACM certificate for $DOMAIN ($CERT_ARN)"
  if [ "$DRY_RUN" = "false" ]; then
    ${AWS} acm delete-certificate \
      --certificate-arn "$CERT_ARN" \
      --region us-east-1 2>/dev/null \
      && ok "Deleted cert for $DOMAIN" \
      || warn "Could not delete cert for $DOMAIN (may still be in use — delete manually after distributions are gone)"
  else
    dry "Delete ACM cert $CERT_ARN ($DOMAIN)"
  fi
done
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
echo "========================================================"
if [ "$DRY_RUN" = "true" ]; then
  echo -e "${YELLOW}  DRY RUN complete — no changes made.${NC}"
  echo "  Re-run without --dry-run to apply."
else
  echo -e "${GREEN}  Cleanup complete.${NC}"
  echo "  You can now run the CodePipeline to create fresh CFN-managed resources."
fi
echo "========================================================"
