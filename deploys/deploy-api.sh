#!/bin/bash
# Regenerate api-gateway/template.yml from Express swagger spec and deploy via SAM.
# Usage: bash deploys/deploy-api.sh [environment] [profile] [--skip-refresh]

ENVIRONMENT=${1:-dev}
PROFILE=${2:-J-CAMPOS}
SKIP_REFRESH=false

# Load domain config from .env
ROOT_DOMAIN=$(grep '^ROOT_DOMAIN=' .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
API_DOMAIN=$(grep '^API_DOMAIN=' .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
ROOT_DOMAIN=${ROOT_DOMAIN:-"tsuru.jcampos.dev"}
API_DOMAIN=${API_DOMAIN:-"api.tsuru.jcampos.dev"}

for arg in "$@"; do
  [ "$arg" = "--skip-refresh" ] && SKIP_REFRESH=true
done

echo "Deploy API Gateway — Tsuru"
echo "Environment  -> $ENVIRONMENT"
echo "Profile      -> $PROFILE"
echo ""

# ── Setup venv SAM ────────────────────────────────────────────────────────────
VENV_DIR=".venv-sam"
if [ ! -f "${VENV_DIR}/bin/sam" ] && [ ! -f "${VENV_DIR}/Scripts/sam" ] && [ ! -f "${VENV_DIR}/Scripts/sam.exe" ]; then
  echo "Installing aws-sam-cli in ${VENV_DIR}..."
  py -3 -m venv "$VENV_DIR" 2>/dev/null \
    || python3 -m venv "$VENV_DIR" 2>/dev/null \
    || python -m venv "$VENV_DIR"
  if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create venv — Python 3 not found"
    exit 1
  fi
  source "${VENV_DIR}/Scripts/activate" 2>/dev/null || source "${VENV_DIR}/bin/activate"
  pip install aws-sam-cli
  if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install aws-sam-cli"
    exit 1
  fi
  echo "SAM CLI installed successfully"
else
  source "${VENV_DIR}/Scripts/activate" 2>/dev/null || source "${VENV_DIR}/bin/activate"
fi

# ── Step 1: Refresh swagger spec from Express JSDoc annotations ───────────────
if [ "$SKIP_REFRESH" = "true" ]; then
  echo "Skipping swagger refresh (--skip-refresh)"
  if [ ! -f "swagger/tsuru.json" ]; then
    echo "ERROR: swagger/tsuru.json not found. Run: npm run generate:swagger"
    exit 1
  fi
else
  echo "Refreshing swagger spec from Express routes..."
  npm run generate:swagger
  if [ $? -ne 0 ]; then
    echo "ERROR: swagger spec generation failed"
    exit 1
  fi
  echo ""
fi

# ── Step 2: Generate api-gateway/template.yml from swagger spec ───────────────
echo "Generating api-gateway/template.yml..."
py -3 scripts/gen_api_template.py 2>/dev/null \
  || python3 scripts/gen_api_template.py 2>/dev/null \
  || python scripts/gen_api_template.py
if [ $? -ne 0 ]; then
  echo "ERROR: template generation failed"
  exit 1
fi
echo ""

# ── Step 3: Resolve Route53 Hosted Zone ID ────────────────────────────────────
echo "Resolving Route53 hosted zone for ${ROOT_DOMAIN}..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name "$ROOT_DOMAIN" \
  --query 'HostedZones[0].Id' \
  --output text \
  --profile "$PROFILE" | sed 's|/hostedzone/||')

if [ -z "$HOSTED_ZONE_ID" ] || [ "$HOSTED_ZONE_ID" = "None" ]; then
  echo "ERROR: Could not resolve hosted zone for ${ROOT_DOMAIN}"
  exit 1
fi
echo "HostedZoneId -> $HOSTED_ZONE_ID"
echo ""

# ── Step 4: SAM deploy ────────────────────────────────────────────────────────
echo "Deploying API Gateway stack (${ENVIRONMENT})..."
cd api-gateway
sam deploy \
  --config-env "${ENVIRONMENT}" \
  --profile "${PROFILE}" \
  --parameter-overrides "Environment=${ENVIRONMENT} HostedZoneId=${HOSTED_ZONE_ID} DomainName=${API_DOMAIN}" \
  --no-fail-on-empty-changeset

if [ $? -ne 0 ]; then
  echo "ERROR: SAM deploy failed"
  exit 1
fi

echo ""
echo "Done. API endpoint: https://${API_DOMAIN}"
