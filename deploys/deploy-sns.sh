#!/bin/bash

# Tsuru Organization Events SNS Topic Deployment Script

set -e

# Configuration
ENVIRONMENT=${1:-dev}
STACK_NAME="tsuru-${ENVIRONMENT}-organization-events"
TEMPLATE_FILE="cloudformation/organization-publish-topic.yml"
REGION="us-east-1"
AWS_PROFILE=${AWS_PROFILE:-"J-CAMPOS"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper: upsert a key in an env file (update if exists, append if not)
upsert_env() {
  local file="$1"
  local key="$2"
  local value="$3"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    [ -s "$file" ] && [ "$(tail -c1 "$file" | wc -l)" -eq 0 ] && echo "" >> "$file"
    echo "${key}=${value}" >> "$file"
  fi
}

echo -e "${GREEN}🚀 Deploying Tsuru Organization Events SNS Topic${NC}"
echo "Stack Name:  $STACK_NAME"
echo "Region:      $REGION"
echo "Environment: $ENVIRONMENT"
echo ""

# ── Pre-flight checks ────────────────────────────────────────────────────────
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}❌ Template file not found: $TEMPLATE_FILE${NC}"
    exit 1
fi

# ── Validate CloudFormation template ─────────────────────────────────────────
echo -e "${YELLOW}🔍 Validating CloudFormation template...${NC}"
aws cloudformation validate-template \
    --template-body file://$TEMPLATE_FILE \
    --region $REGION \
    --profile $AWS_PROFILE \
    --output text --query 'Description' >/dev/null

echo -e "${GREEN}✅ Template validation successful${NC}"
echo ""

# ── Check if stack exists ─────────────────────────────────────────────────────
echo -e "${YELLOW}🔍 Checking if stack exists...${NC}"
set +e
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME --region $REGION --profile $AWS_PROFILE >/dev/null 2>&1
STACK_CHECK_EXIT_CODE=$?
set -e

if [ $STACK_CHECK_EXIT_CODE -eq 0 ]; then
    STACK_STATUS=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME --region $REGION --profile $AWS_PROFILE \
        --query 'Stacks[0].StackStatus' --output text 2>/dev/null)
    if [ "$STACK_STATUS" = "ROLLBACK_COMPLETE" ]; then
        echo -e "${YELLOW}   Stack is in ROLLBACK_COMPLETE — deleting before re-create...${NC}"
        aws cloudformation delete-stack \
            --stack-name $STACK_NAME --region $REGION --profile $AWS_PROFILE
        aws cloudformation wait stack-delete-complete \
            --stack-name $STACK_NAME --region $REGION --profile $AWS_PROFILE
        echo -e "${GREEN}   ✅ Old stack deleted${NC}"
        OPERATION="create-stack"
    else
        OPERATION="update-stack"
        echo -e "${GREEN}   Stack exists (${STACK_STATUS}) — will update${NC}"
    fi
else
    OPERATION="create-stack"
    echo -e "${GREEN}   Stack does not exist — will create${NC}"
fi
echo ""

# ── Deploy the stack ──────────────────────────────────────────────────────────
echo -e "${YELLOW}🔄 Deploying stack (${OPERATION})...${NC}"
aws cloudformation $OPERATION \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_FILE \
    --parameters \
        ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
    --region $REGION \
    --profile $AWS_PROFILE

echo -e "${GREEN}✅ Stack deployment initiated${NC}"
echo ""

# ── Wait for completion ───────────────────────────────────────────────────────
echo -e "${YELLOW}⏳ Waiting for stack to complete...${NC}"
if [ "$OPERATION" = "create-stack" ]; then
    aws cloudformation wait stack-create-complete \
        --stack-name $STACK_NAME --region $REGION --profile $AWS_PROFILE
else
    aws cloudformation wait stack-update-complete \
        --stack-name $STACK_NAME --region $REGION --profile $AWS_PROFILE
fi

echo -e "${GREEN}🎉 Stack operation completed successfully!${NC}"
echo ""

# ── Retrieve outputs ──────────────────────────────────────────────────────────
echo -e "${YELLOW}📋 Retrieving stack outputs...${NC}"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME --region $REGION --profile $AWS_PROFILE \
    --query 'Stacks[0].Outputs' --output table

get_output() {
    aws cloudformation describe-stacks \
        --stack-name $STACK_NAME --region $REGION --profile $AWS_PROFILE \
        --query "Stacks[0].Outputs[?OutputKey==\`$1\`].OutputValue" \
        --output text
}

TOPIC_ARN=$(get_output OrganizationEventsTopicArn)
TOPIC_NAME=$(get_output OrganizationEventsTopicName)

# ── Update root .env ──────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}📝 Updating root .env...${NC}"
ROOT_ENV=".env"
touch "$ROOT_ENV"
upsert_env "$ROOT_ENV" "ORGANIZATION_TOPIC_ARN" "$TOPIC_ARN"
echo -e "${GREEN}  ✅ $ROOT_ENV updated${NC}"

echo ""
echo -e "${BLUE}=== Values written ===${NC}"
echo -e "${BLUE}TOPIC_ARN:${NC}   $TOPIC_ARN"
echo -e "${BLUE}TOPIC_NAME:${NC}  $TOPIC_NAME"
echo ""
echo -e "${GREEN}✨ Organization Events SNS Topic deployed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Deploy SSM parameters (imports topic ARN via CloudFormation export):"
echo "     bash deploys/deploy-params.sh $ENVIRONMENT"
echo "  2. Redeploy Lambda: bash deploys/deploy-lambda.sh $ENVIRONMENT"
echo "  3. Infrastructure microservice: subscribe its SQS queue to this topic"
echo ""
echo -e "${YELLOW}ℹ️  Note:${NC} ORGANIZATION_TOPIC_ARN is no longer a Lambda env var."
echo "     It is stored in SSM at /tsuru/${ENVIRONMENT}/platform/sns/organization-topic-arn"
echo "     and resolved at runtime via AppConfig."
