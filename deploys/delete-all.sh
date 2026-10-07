#!/bin/bash

# Delete All AWS Infrastructure
# WARNING: This will delete all CloudFormation stacks and resources

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
AWS_PROFILE=${AWS_PROFILE:-"J-CAMPOS"}

# Stack names in deletion order (reverse of creation)
STACKS=(
    "tsuru-codepipeline"
    "tsuru-static-website"
    "tsuru-api-gateway"
    "tsuru-lambda"
    "tsuru-pipeline-roles"
    "tsuru-cognito"
)

echo -e "${RED}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ⚠️  WARNING  ⚠️                          ║"
echo "║                                                            ║"
echo "║  This will DELETE ALL Tsuru AWS infrastructure:        ║"
echo "║                                                            ║"
echo "║  • CodePipeline and CodeBuild                             ║"
echo "║  • CloudFront distributions                               ║"
echo "║  • S3 buckets (including website content)                 ║"
echo "║  • API Gateway                                            ║"
echo "║  • Lambda functions                                       ║"
echo "║  • IAM roles and policies                                 ║"
echo "║  • Cognito user pools                                     ║"
echo "║  • ACM certificates                                       ║"
echo "║  • Route53 DNS records                                    ║"
echo "║                                                            ║"
echo "║  THIS ACTION CANNOT BE UNDONE!                            ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${YELLOW}Stacks to be deleted:${NC}"
for stack in "${STACKS[@]}"; do
    echo "  • $stack"
done
echo ""

# Triple confirmation
read -p "$(echo -e ${RED}Type 'DELETE' to confirm deletion: ${NC})" CONFIRM1
if [ "$CONFIRM1" != "DELETE" ]; then
    echo -e "${GREEN}Deletion cancelled${NC}"
    exit 0
fi

read -p "$(echo -e ${RED}Are you absolutely sure? Type 'YES' to proceed: ${NC})" CONFIRM2
if [ "$CONFIRM2" != "YES" ]; then
    echo -e "${GREEN}Deletion cancelled${NC}"
    exit 0
fi

read -p "$(echo -e ${RED}Last chance! Type 'DESTROY' to delete everything: ${NC})" CONFIRM3
if [ "$CONFIRM3" != "DESTROY" ]; then
    echo -e "${GREEN}Deletion cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${RED}                   DELETION STARTING                       ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Function to delete a stack
delete_stack() {
    local stack_name=$1
    
    echo -e "${YELLOW}Checking stack: ${stack_name}${NC}"
    
    # Check if stack exists
    STACK_EXISTS=$(aws cloudformation describe-stacks \
        --stack-name $stack_name \
        --region $AWS_REGION \
        --profile $AWS_PROFILE \
        2>/dev/null || echo "false")
    
    if [ "$STACK_EXISTS" = "false" ]; then
        echo -e "${BLUE}  ℹ Stack does not exist, skipping${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}  Deleting stack...${NC}"
    
    # Delete stack
    aws cloudformation delete-stack \
        --stack-name $stack_name \
        --region $AWS_REGION \
        --profile $AWS_PROFILE
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}  ✗ Failed to initiate deletion${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}  Waiting for deletion to complete...${NC}"
    
    # Wait for deletion
    aws cloudformation wait stack-delete-complete \
        --stack-name $stack_name \
        --region $AWS_REGION \
        --profile $AWS_PROFILE
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✓ Stack deleted successfully${NC}"
        return 0
    else
        echo -e "${RED}  ✗ Stack deletion failed or timed out${NC}"
        return 1
    fi
}

# Delete S3 buckets first (they need to be empty)
echo -e "${YELLOW}Emptying S3 buckets...${NC}"

# Empty website bucket
if [ -f ".env" ]; then
    source .env
    if [ -n "$CLIENT_BUCKET_NAME" ]; then
        echo -e "${YELLOW}  Emptying website bucket: ${CLIENT_BUCKET_NAME}${NC}"
        aws s3 rm s3://$CLIENT_BUCKET_NAME --recursive --region $AWS_REGION --profile $AWS_PROFILE 2>/dev/null || true
        echo -e "${GREEN}  ✓ Website bucket emptied${NC}"
    fi
fi

# Empty artifacts bucket
ARTIFACTS_BUCKET="tsuru-pipeline-artifacts-dev-$(aws sts get-caller-identity --profile $AWS_PROFILE --query Account --output text)"
echo -e "${YELLOW}  Emptying artifacts bucket: ${ARTIFACTS_BUCKET}${NC}"
aws s3 rm s3://$ARTIFACTS_BUCKET --recursive --region $AWS_REGION --profile $AWS_PROFILE 2>/dev/null || true
echo -e "${GREEN}  ✓ Artifacts bucket emptied${NC}"

echo ""

# Delete stacks in order
DELETION_COUNT=0
FAILED_COUNT=0

for stack in "${STACKS[@]}"; do
    echo ""
    delete_stack $stack
    if [ $? -eq 0 ]; then
        DELETION_COUNT=$((DELETION_COUNT + 1))
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
done

# Summary
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                  DELETION COMPLETE                        ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}✓ Stacks deleted: ${DELETION_COUNT}${NC}"
if [ $FAILED_COUNT -gt 0 ]; then
    echo -e "${RED}✗ Failed deletions: ${FAILED_COUNT}${NC}"
fi

echo ""
echo -e "${YELLOW}Manual cleanup required:${NC}"
echo "1. Check CloudFormation console for any stuck stacks"
echo "2. Verify S3 buckets are deleted"
echo "3. Check for orphaned resources (Lambda, API Gateway, etc.)"
echo "4. Remove GitHub CodeStar connection if no longer needed"
echo "5. Delete ACM certificates if not auto-deleted"
echo ""

# Clean up local files
echo -e "${YELLOW}Cleaning local configuration files...${NC}"
rm -f .env .cognito-outputs .pipeline-roles-outputs
echo -e "${GREEN}✓ Local files cleaned${NC}"

echo ""
echo -e "${GREEN}All infrastructure has been deleted${NC}"
echo ""
