#!/usr/bin/env bash
# Manually deploy the identity/events prerequisites, support-be, then admin edge.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT="${1:-dev}"
AWS_PROFILE_NAME="${2:-PACIFIC-PROD}"

cd "${REPO_ROOT}"

# The support-be image is built HERE, locally (arm64), before any control-plane
# mutation, so a broken build fails fast instead of half-way through the stacks.
# `build-image.sh` tags it `<env>-<commit>` and reuses that tag when it is
# already in ECR; it refuses a dirty be/support-be tree (ALLOW_DIRTY=1 to
# override). Pass SUPPORT_ECR_IMAGE_URI=<repo>@sha256:… to deploy an existing
# image instead.
SUPPORT_ECR_IMAGE_URI="${SUPPORT_ECR_IMAGE_URI:-}"
if [[ -z "${SUPPORT_ECR_IMAGE_URI}" ]]; then
  SUPPORT_ECR_IMAGE_URI="$(bash be/support-be/deploys/build-image.sh "${ENVIRONMENT}" "${AWS_PROFILE_NAME}")"
fi
if [[ ! "${SUPPORT_ECR_IMAGE_URI}" =~ @sha256:[a-f0-9]{64}$ ]]; then
  echo "SUPPORT_ECR_IMAGE_URI must use an immutable sha256 digest." >&2
  exit 1
fi
echo "Using support image: ${SUPPORT_ECR_IMAGE_URI}"

# The normal customer gateway needs the existing platform Cognito pool.
#
# `list-exports` paginates, and `--output text` prints the query result for EVERY
# page — so a filter that matches on page 1 of 3 yields "value\nNone\nNone".
# Command substitution strips only the trailing newline, so the unfiltered form
# produced a three-line pool id that CloudFormation accepted as a parameter and
# API Gateway then rejected with "ProviderARNs need to be valid Cognito
# Userpools". first_value keeps the first real line.
first_value() {
  awk 'NF && $0 != "None" { print; exit }'
}

COGNITO_POOL_ID="${COGNITO_POOL_ID:-$(aws cloudformation list-exports \
  --profile "${AWS_PROFILE_NAME}" --region "${AWS_REGION:-us-east-1}" \
  --query "Exports[?Name=='tsuru-cognito-UserPoolId'].Value | [0]" --output text \
  | first_value)}"
if [[ -z "${COGNITO_POOL_ID}" || "${COGNITO_POOL_ID}" == "None" ]]; then
  echo "Unable to resolve the customer Cognito pool; set COGNITO_POOL_ID." >&2
  exit 1
fi
if [[ ! "${COGNITO_POOL_ID}" =~ ^[a-z0-9-]+_[A-Za-z0-9]+$ ]]; then
  echo "Resolved an implausible Cognito pool id: ${COGNITO_POOL_ID}" >&2
  exit 1
fi

SUPPORT_HOSTED_ZONE_ID="${HOSTED_ZONE_ID:-$(aws route53 list-hosted-zones-by-name \
  --dns-name "${ROOT_DOMAIN:-jcampos.dev}" --profile "${AWS_PROFILE_NAME}" \
  --query "HostedZones[?Name=='${ROOT_DOMAIN:-jcampos.dev}.'].Id | [0]" \
  --output text | sed 's|/hostedzone/||' | first_value)}"
if [[ -z "${SUPPORT_HOSTED_ZONE_ID}" || "${SUPPORT_HOSTED_ZONE_ID}" == "None" ]]; then
  echo "Unable to resolve the Route53 hosted zone; set HOSTED_ZONE_ID." >&2
  exit 1
fi

# Create the admin identity first. AppSync must trust this pool before the
# support Lambda can import the Events API ARN, while the composed admin API
# itself must wait until the support Lambda exists.
#
# The admin stacks (identity, generated gateway, dashboard SSM config, hosting)
# are owned by the private dashboard repository at fe/dashboard — this script
# only sequences them against the support Lambda they share.
if [[ ! -x fe/dashboard/deploys/deploy-admin-cognito.sh ]]; then
  echo "Missing the private dashboard checkout at fe/dashboard." >&2
  exit 1
fi
bash fe/dashboard/deploys/deploy-admin-cognito.sh "${ENVIRONMENT}" "${AWS_PROFILE_NAME}"

ADMIN_POOL_ID="$(aws cloudformation describe-stacks \
  --stack-name "tsuru-${ENVIRONMENT}-admin-cognito" \
  --profile "${AWS_PROFILE_NAME}" --region "${AWS_REGION:-us-east-1}" \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue | [0]" \
  --output text | first_value)"
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
ECR_IMAGE_URI="${SUPPORT_ECR_IMAGE_URI}" \
  bash be/support-be/deploys/deploy-all.sh "${ENVIRONMENT}" "${AWS_PROFILE_NAME}"

# The rest of the admin control plane, in the dashboard repository's own order:
# admin Cognito (a no-op repeat), the gateway regenerated from the backend
# OpenAPI sources, the dashboard's SSM build configuration, then hosting and the
# built site.
bash fe/dashboard/deploys/deploy-all.sh "${ENVIRONMENT}" "${AWS_PROFILE_NAME}"
