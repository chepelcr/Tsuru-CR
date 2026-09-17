#!/usr/bin/env bash
# Manually deploy the identity/events prerequisites, support-be, then admin edge.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT="${1:-dev}"
AWS_PROFILE_NAME="${2:-PACIFIC-PROD}"

cd "${REPO_ROOT}"

# The normal customer gateway needs the existing platform Cognito pool.
COGNITO_POOL_ID="${COGNITO_POOL_ID:-$(aws cloudformation list-exports \
  --profile "${AWS_PROFILE_NAME}" --region "${AWS_REGION:-us-east-1}" \
  --query "Exports[?Name=='tsuru-cognito-UserPoolId'].Value | [0]" --output text)}"
if [[ -z "${COGNITO_POOL_ID}" || "${COGNITO_POOL_ID}" == "None" ]]; then
  echo "Unable to resolve the customer Cognito pool; set COGNITO_POOL_ID." >&2
  exit 1
fi

SUPPORT_HOSTED_ZONE_ID="${HOSTED_ZONE_ID:-$(aws route53 list-hosted-zones-by-name \
  --dns-name "${ROOT_DOMAIN:-jcampos.dev}" --profile "${AWS_PROFILE_NAME}" \
  --query "HostedZones[?Name=='${ROOT_DOMAIN:-jcampos.dev}.'].Id | [0]" \
  --output text | sed 's|/hostedzone/||')}"
if [[ -z "${SUPPORT_HOSTED_ZONE_ID}" || "${SUPPORT_HOSTED_ZONE_ID}" == "None" ]]; then
  echo "Unable to resolve the Route53 hosted zone; set HOSTED_ZONE_ID." >&2
  exit 1
fi

# Create the admin identity first. AppSync must trust this pool before the
# support Lambda can import the Events API ARN, while the composed admin API
# itself must wait until the support Lambda exists.
echo "Deploying the dedicated admin Cognito prerequisite..."
aws cloudformation deploy \
  --stack-name "tsuru-${ENVIRONMENT}-admin-cognito" \
  --template-file admin-api/admin-cognito.yml \
  --parameter-overrides "Environment=${ENVIRONMENT}" \
  --no-fail-on-empty-changeset \
  --profile "${AWS_PROFILE_NAME}" \
  --region "${AWS_REGION:-us-east-1}"

ADMIN_POOL_ID="$(aws cloudformation describe-stacks \
  --stack-name "tsuru-${ENVIRONMENT}-admin-cognito" \
  --profile "${AWS_PROFILE_NAME}" --region "${AWS_REGION:-us-east-1}" \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue | [0]" --output text)"
if [[ -z "${ADMIN_POOL_ID}" || "${ADMIN_POOL_ID}" == "None" ]]; then
  echo "Unable to resolve the deployed admin Cognito pool." >&2
  exit 1
fi

echo "Authorizing the admin support channel on AppSync Events..."
aws cloudformation deploy \
  --stack-name "tsuru-${ENVIRONMENT}-appsync-events" \
  --template-file be/sales-be/cloudformation/appsync-events.yml \
  --parameter-overrides \
    "Environment=${ENVIRONMENT}" \
    "UserPoolId=${COGNITO_POOL_ID}" \
    "AdminUserPoolId=${ADMIN_POOL_ID}" \
    "CustomDomainName=${APPSYNC_EVENTS_DOMAIN:-events.tsuru.jcampos.dev}" \
    "HostedZoneId=${SUPPORT_HOSTED_ZONE_ID}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset \
  --profile "${AWS_PROFILE_NAME}" \
  --region "${AWS_REGION:-us-east-1}"

COGNITO_POOL_ID="${COGNITO_POOL_ID}" \
API_DOMAIN="${SUPPORT_API_DOMAIN:-support.tsuru.jcampos.dev}" \
HOSTED_ZONE_ID="${SUPPORT_HOSTED_ZONE_ID}" \
  bash be/support-be/deploys/deploy-all.sh "${ENVIRONMENT}" "${AWS_PROFILE_NAME}"

# This repeats the Cognito deployment as a no-op, then composes support/admin
# routes and writes the local dashboard's SSM build configuration.
bash admin-api/deploy.sh "${ENVIRONMENT}" "${AWS_PROFILE_NAME}"

if [[ ! -x fe/dashboard/deploys/deploy.sh ]]; then
  echo "Missing the private dashboard checkout at fe/dashboard." >&2
  exit 1
fi
bash fe/dashboard/deploys/deploy.sh "${ENVIRONMENT}" "${AWS_PROFILE_NAME}"
