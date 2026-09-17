#!/usr/bin/env bash
# Manual-only deployment for the dedicated Tsuru admin identity and API edge.
# Usage: bash admin-api/deploy.sh [environment] [aws-profile]
set -euo pipefail

ADMIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${ADMIN_DIR}/.." && pwd)"
ENVIRONMENT="${1:-dev}"
AWS_PROFILE="${2:-PACIFIC-PROD}"
DEPLOY_REGION="${ADMIN_API_REGION:-us-east-1}"
ROOT_DOMAIN="${ROOT_DOMAIN:-jcampos.dev}"
ADMIN_DOMAIN="${ADMIN_API_DOMAIN:-admin-api.tsuru.jcampos.dev}"

cd "${REPO_ROOT}"
python3 admin-api/generate_admin_api.py

HOSTED_ZONE_ID="$(aws route53 list-hosted-zones-by-name \
  --dns-name "${ROOT_DOMAIN}" \
  --query "HostedZones[?Name=='${ROOT_DOMAIN}.'].Id | [0]" \
  --output text --profile "${AWS_PROFILE}" | sed 's|/hostedzone/||')"
if [[ -z "${HOSTED_ZONE_ID}" || "${HOSTED_ZONE_ID}" == "None" ]]; then
  echo "Unable to resolve the Route53 hosted zone for ${ROOT_DOMAIN}" >&2
  exit 1
fi

aws cloudformation validate-template \
  --template-body file://admin-api/admin-cognito.yml \
  --profile "${AWS_PROFILE}" --region "${DEPLOY_REGION}" >/dev/null
aws cloudformation validate-template \
  --template-body file://admin-api/admin-dashboard-params.yml \
  --profile "${AWS_PROFILE}" --region "${DEPLOY_REGION}" >/dev/null
sam validate --lint --template-file admin-api/template.yml

echo "Deploying dedicated admin Cognito stack..."
aws cloudformation deploy \
  --stack-name "tsuru-${ENVIRONMENT}-admin-cognito" \
  --template-file admin-api/admin-cognito.yml \
  --parameter-overrides "Environment=${ENVIRONMENT}" \
  --no-fail-on-empty-changeset \
  --profile "${AWS_PROFILE}" \
  --region "${DEPLOY_REGION}"

echo "Deploying dedicated admin API stack..."
sam deploy \
  --template-file admin-api/template.yml \
  --config-file admin-api/samconfig.toml \
  --config-env "${ENVIRONMENT}" \
  --parameter-overrides "Environment=${ENVIRONMENT} HostedZoneId=${HOSTED_ZONE_ID} DomainName=${ADMIN_DOMAIN}" \
  --profile "${AWS_PROFILE}" \
  --region "${DEPLOY_REGION}" \
  --no-fail-on-empty-changeset

echo "Writing admin dashboard build configuration to SSM..."
aws cloudformation deploy \
  --stack-name "tsuru-${ENVIRONMENT}-admin-dashboard-params" \
  --template-file admin-api/admin-dashboard-params.yml \
  --parameter-overrides "Environment=${ENVIRONMENT}" \
  --no-fail-on-empty-changeset \
  --profile "${AWS_PROFILE}" \
  --region "${DEPLOY_REGION}"

echo "Admin API deployed at https://${ADMIN_DOMAIN}"
