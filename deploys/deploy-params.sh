#!/bin/bash
set -e

# ---------------------------------------------------------------------------
# deploy-params.sh — Deploy JMarkets SSM Parameter Stack
#
# Usage:
#   bash deploys/deploy-params.sh [dev|staging|prod] [OPTIONS]
#
# Options:
#   --s3-bucket        S3 bucket name for file uploads
#   --from-email       SES verified sender address
#   --frontend-url     Landing page / frontend URL
#   --dashboard-url    Dashboard / admin URL
#   --cloudfront-domain  CloudFront distribution domain
#   --api-url          Backend API URL
#   --orders-api-url   Orders service API URL
#   --sales-api-url    Sales / e-invoicing API URL
#   --data-api-url     Hacienda catalog (data) API URL
#   --events-api-url   AppSync Events endpoint for real-time notifications
#                      (browser clients). Defaults to the custom domain the
#                      sales-be appsync-events stack publishes.
#
# These are not merely recorded here: the POS build READS them from SSM at
# build time, so a missing or wrong value ships a broken frontend.
#   --region           AWS region (default: us-east-1)
#   --no-profile       Skip AWS named profile (use IAM role — for CodeBuild)
#
# Values default to the corresponding .env variables:
#   AWS_S3_BUCKET_NAME, FROM_EMAIL, FRONTEND_URL, DASHBOARD_URL, CLOUDFRONT_DOMAIN
#   VITE_API_URL (from fe/dashboard/.env), VITE_ORDERS_API_URL (from fe/dashboard/.env)
# CLI flags override those defaults.
# ---------------------------------------------------------------------------

ENVIRONMENT=${1:-dev}
shift || true

REGION="us-east-1"
USE_PROFILE=true

# Source .env file from repo root to pick up current values as defaults
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

if [ -f "$ENV_FILE" ]; then
  # Export only the vars we care about, ignoring errors for vars not present
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE" 2>/dev/null || true
  set +a
fi

# Defaults from .env (can be overridden by CLI flags below)
S3_BUCKET="${AWS_S3_BUCKET_NAME:-}"
FROM_EMAIL_VAL="${FROM_EMAIL:-}"
FRONTEND_URL_VAL="${FRONTEND_URL:-}"
DASHBOARD_URL_VAL="${DASHBOARD_URL:-}"
CLOUDFRONT_DOMAIN_VAL="${CLOUDFRONT_DOMAIN:-}"

# API URLs default from fe/dashboard/.env (VITE_ vars live there, not root .env)
DASHBOARD_ENV="$REPO_ROOT/fe/dashboard/.env"
API_URL_VAL=""
ORDERS_API_URL_VAL=""
# Default is the custom domain the sales-be appsync-events stack owns; it is a
# constant precisely so it does not have to be plumbed through from a stack
# output. Pass --events-api-url "" to build the POS without live notifications.
EVENTS_API_URL_VAL="${EVENTS_API_URL:-https://events.tsuru.jcampos.dev/event}"
SALES_API_URL_VAL="${SALES_API_URL:-https://sales-api.tsuru.jcampos.dev}"
DATA_API_URL_VAL="${DATA_API_URL:-https://data-api.tsuru.jcampos.dev}"
if [ -f "$DASHBOARD_ENV" ]; then
  API_URL_VAL=$(grep -E '^VITE_API_URL=' "$DASHBOARD_ENV" 2>/dev/null | cut -d'=' -f2-)
  ORDERS_API_URL_VAL=$(grep -E '^VITE_ORDERS_API_URL=' "$DASHBOARD_ENV" 2>/dev/null | cut -d'=' -f2-)
fi

# Parse named arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --s3-bucket)         S3_BUCKET="$2";           shift 2 ;;
    --from-email)        FROM_EMAIL_VAL="$2";       shift 2 ;;
    --frontend-url)      FRONTEND_URL_VAL="$2";     shift 2 ;;
    --dashboard-url)     DASHBOARD_URL_VAL="$2";    shift 2 ;;
    --cloudfront-domain) CLOUDFRONT_DOMAIN_VAL="$2"; shift 2 ;;
    --api-url)           API_URL_VAL="$2";           shift 2 ;;
    --orders-api-url)    ORDERS_API_URL_VAL="$2";    shift 2 ;;
    --events-api-url)    EVENTS_API_URL_VAL="$2";    shift 2 ;;
    --sales-api-url)     SALES_API_URL_VAL="$2";     shift 2 ;;
    --data-api-url)      DATA_API_URL_VAL="$2";      shift 2 ;;
    --region)            REGION="$2";               shift 2 ;;
    --no-profile)        USE_PROFILE=false;         shift ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# Validate required values
if [ -z "$S3_BUCKET" ]; then
  echo "ERROR: --s3-bucket is required (or set AWS_S3_BUCKET_NAME in .env)"
  exit 1
fi
if [ -z "$FROM_EMAIL_VAL" ]; then
  echo "ERROR: --from-email is required (or set FROM_EMAIL in .env)"
  exit 1
fi
if [ -z "$FRONTEND_URL_VAL" ]; then
  echo "ERROR: --frontend-url is required (or set FRONTEND_URL in .env)"
  exit 1
fi
if [ -z "$DASHBOARD_URL_VAL" ]; then
  echo "ERROR: --dashboard-url is required (or set DASHBOARD_URL in .env)"
  exit 1
fi
if [ -z "$CLOUDFRONT_DOMAIN_VAL" ]; then
  echo "ERROR: --cloudfront-domain is required (or set CLOUDFRONT_DOMAIN in .env)"
  exit 1
fi
if [ -z "$API_URL_VAL" ]; then
  echo "ERROR: --api-url is required (or set VITE_API_URL in fe/dashboard/.env)"
  exit 1
fi
if [ -z "$ORDERS_API_URL_VAL" ]; then
  echo "ERROR: --orders-api-url is required (or set VITE_ORDERS_API_URL in fe/dashboard/.env)"
  exit 1
fi

PROFILE_ARG=""
if [ "$USE_PROFILE" = true ]; then
  PROFILE="J-CAMPOS"
  PROFILE_ARG="--profile $PROFILE"
fi

# Must match the DEPLOYED stack. This said "jmarkets-ssm-params" long after the
# live stack was named for the `platform` namespace it writes, so running the
# script would try to CREATE a second stack over parameter names the first one
# already owns — which fails, rolls back, and tells you nothing useful.
PARAMS_STACK="tsuru-${ENVIRONMENT}-platform-ssm-params"
TEMPLATE_FILE="$REPO_ROOT/cloudformation/params.yml"

echo "======================================================"
echo " Deploying JMarkets SSM Parameters"
echo "======================================================"
echo " Stack:            $PARAMS_STACK"
echo " Environment:      $ENVIRONMENT"
echo " Region:           $REGION"
echo " S3 Bucket:        $S3_BUCKET"
echo " From Email:       $FROM_EMAIL_VAL"
echo " Frontend URL:     $FRONTEND_URL_VAL"
echo " Dashboard URL:    $DASHBOARD_URL_VAL"
echo " CloudFront Domain: $CLOUDFRONT_DOMAIN_VAL"
echo " API URL:          $API_URL_VAL"
echo " Orders API URL:   $ORDERS_API_URL_VAL"
echo " Sales API URL:    $SALES_API_URL_VAL"
echo " Data API URL:     $DATA_API_URL_VAL"
echo " Events API URL:   ${EVENTS_API_URL_VAL:-<none — POS builds without live notifications>}"
echo " SSM Base Path:    /tsuru/${ENVIRONMENT}/jmarkets"
echo "======================================================"

# shellcheck disable=SC2086
aws cloudformation deploy \
  --stack-name "$PARAMS_STACK" \
  --template-file "$TEMPLATE_FILE" \
  --region "$REGION" \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    "Environment=${ENVIRONMENT}" \
    "S3Bucket=${S3_BUCKET}" \
    "FromEmail=${FROM_EMAIL_VAL}" \
    "FrontendUrl=${FRONTEND_URL_VAL}" \
    "DashboardUrl=${DASHBOARD_URL_VAL}" \
    "CloudfrontDomain=${CLOUDFRONT_DOMAIN_VAL}" \
    "ApiUrl=${API_URL_VAL}" \
    "OrdersApiUrl=${ORDERS_API_URL_VAL}" \
    "EventsApiUrl=${EVENTS_API_URL_VAL}" \
    "SalesApiUrl=${SALES_API_URL_VAL}" \
    "DataApiUrl=${DATA_API_URL_VAL}" \
  $PROFILE_ARG

echo ""
echo "✅ SSM parameters deployed successfully."
echo "   Base path: /tsuru/${ENVIRONMENT}/jmarkets"
echo ""
echo "   Parameters created/updated:"
echo "   - /tsuru/${ENVIRONMENT}/jmarkets/aws/stage"
echo "   - /tsuru/${ENVIRONMENT}/jmarkets/aws/region"
echo "   - /tsuru/${ENVIRONMENT}/jmarkets/aws/database  → tsuru/${ENVIRONMENT}/database"
echo "   - /tsuru/${ENVIRONMENT}/jmarkets/cognito/user-pool-id   (from jmarkets-cognito stack)"
echo "   - /tsuru/${ENVIRONMENT}/jmarkets/cognito/client-id      (from jmarkets-cognito stack)"
echo "   - /tsuru/${ENVIRONMENT}/jmarkets/sns/organization-topic-arn  (from organization-publish-topic stack)"
echo "   - /tsuru/${ENVIRONMENT}/jmarkets/dashboard/url          → ${DASHBOARD_URL_VAL}"
echo "   - /tsuru/${ENVIRONMENT}/jmarkets/s3/bucket              → ${S3_BUCKET}"
echo "   - /tsuru/${ENVIRONMENT}/jmarkets/email/from             → ${FROM_EMAIL_VAL}"
echo "   - /tsuru/${ENVIRONMENT}/jmarkets/frontend/url           → ${FRONTEND_URL_VAL}"
echo "   - /tsuru/${ENVIRONMENT}/jmarkets/cloudfront/domain      → ${CLOUDFRONT_DOMAIN_VAL}
   - /tsuru/${ENVIRONMENT}/jmarkets/api/url               → ${API_URL_VAL}
   - /tsuru/${ENVIRONMENT}/jmarkets/api/orders-url        → ${ORDERS_API_URL_VAL}"
