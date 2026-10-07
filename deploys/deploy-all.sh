#!/bin/bash

# Master Deployment Script
# Orchestrates all AWS infrastructure deployments in correct sequence

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Banner
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║        Tsuru AWS Infrastructure Master Deploy           ║"
echo "║                                                            ║"
echo "║ This script will deploy all AWS infrastructure components: ║"
echo "║  1. Cognito (Authentication)                              ║"
echo "║  2. Pipeline Roles (IAM + S3)                             ║"
echo "║  3. Lambda Function (API Backend)                         ║"
echo "║  4. API Gateway (REST API)                                ║"
echo "║  5. Static Website (S3 + CloudFront)                      ║"
echo "║  6. CodePipeline (CI/CD)                                  ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${YELLOW}Prerequisites:${NC}"
echo "✓ AWS CLI configured with appropriate credentials"
echo "✓ Permissions to create CloudFormation stacks"
echo "✓ Permissions to create IAM roles and policies"
echo "✓ GitHub CodeStar connection already created in AWS Console"
echo "✓ Route53 hosted zone configured for tsuru.jcampos.dev"
echo ""

# Confirmation
read -p "$(echo -e ${YELLOW}Proceed with full infrastructure deployment? \(y/N\): ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}                   DEPLOYMENT STARTING                     ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

# Track deployment progress
DEPLOYMENT_START=$(date +%s)
DEPLOYMENTS_COMPLETED=0
DEPLOYMENTS_TOTAL=6

# Function to deploy a component
deploy_component() {
    local step_number=$1
    local component_name=$2
    local script_name=$3

    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}Step $step_number/$DEPLOYMENTS_TOTAL: $component_name${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""

    if [ -f "$script_name" ]; then
        bash "$script_name"

        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✓ $component_name deployment completed${NC}"
            DEPLOYMENTS_COMPLETED=$((DEPLOYMENTS_COMPLETED + 1))
        else
            echo ""
            echo -e "${RED}✗ $component_name deployment failed${NC}"
            echo -e "${YELLOW}Manual deployment required for subsequent steps${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Error: Script not found: $script_name${NC}"
        exit 1
    fi
}

# Step 1: Cognito
deploy_component 1 "Cognito Authentication" "$SCRIPT_DIR/deploy-cognito.sh"

# Step 2: Pipeline Roles
deploy_component 2 "Pipeline Roles & S3 Artifacts" "$SCRIPT_DIR/deploy-pipeline-roles.sh"

# Step 3: Lambda
deploy_component 3 "Lambda Function (SAM)" "$SCRIPT_DIR/deploy-lambda.sh"

# Step 4: API Gateway
deploy_component 4 "API Gateway with Custom Domain" "$SCRIPT_DIR/deploy-api-gateway.sh"

# Step 5: Client Application (S3 + CloudFront + Upload)
deploy_component 5 "Client Application" "$SCRIPT_DIR/deploy-client.sh"

# Step 6: CodePipeline
deploy_component 6 "CodePipeline CI/CD" "$SCRIPT_DIR/deploy-pipeline.sh"

# Calculate deployment time
DEPLOYMENT_END=$(date +%s)
DEPLOYMENT_TIME=$((DEPLOYMENT_END - DEPLOYMENT_START))
DEPLOYMENT_MINUTES=$((DEPLOYMENT_TIME / 60))
DEPLOYMENT_SECONDS=$((DEPLOYMENT_TIME % 60))

# Final Summary
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                  DEPLOYMENT COMPLETE!                     ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}✓ All ${DEPLOYMENTS_COMPLETED}/${DEPLOYMENTS_TOTAL} infrastructure components deployed${NC}"
echo -e "${BLUE}Total deployment time: ${DEPLOYMENT_MINUTES}m ${DEPLOYMENT_SECONDS}s${NC}"
echo ""

echo -e "${YELLOW}=== Important Next Steps ===${NC}"
echo ""

echo -e "${BLUE}1. ACM Certificate Validation:${NC}"
echo "   • Go to AWS Certificate Manager Console"
echo "   • For each certificate (API Gateway + Static Website):"
echo "     - Click 'Create records in Route53' to auto-validate"
echo "     - Wait 5-10 minutes for validation"
echo "   • Custom domains will work once validated"
echo ""

echo -e "${BLUE}2. GitHub CodeStar Connection:${NC}"
echo "   • Verify the GitHub connection is authorized"
echo "   • You may need to re-authenticate in CodePipeline Console"
echo ""

echo -e "${BLUE}3. Deploy Client Application:${NC}"
echo "   npm run build"
echo "   aws s3 sync dist/ s3://\$(grep CLIENT_BUCKET_NAME .env | cut -d= -f2) --delete"
echo "   aws cloudfront create-invalidation --distribution-id \$(grep CLIENT_CLOUDFRONT_ID .env | cut -d= -f2) --paths '/*'"
echo ""

echo -e "${BLUE}4. Verify Deployments:${NC}"
echo "   • CloudFormation → Stacks (verify all in CREATE_COMPLETE state)"
echo "   • API Gateway → APIs (test the /api/* endpoints)"
echo "   • CloudFront → Distributions (verify custom domains working)"
echo "   • CodePipeline → Pipelines (monitor for first run)"
echo ""

echo -e "${YELLOW}=== Environment Variables ===${NC}"
echo "Your .env file has been updated with all necessary values:"
echo "• Cognito credentials"
echo "• Lambda function ARN"
echo "• API Gateway URLs"
echo "• CloudFront distribution IDs"
echo "• S3 bucket names"
echo "• CodePipeline and CodeBuild names"
echo ""

echo -e "${YELLOW}=== Configuration Files ===${NC}"
if [ -f ".cognito-outputs" ]; then
    echo "✓ .cognito-outputs (Cognito stack outputs)"
fi
if [ -f ".pipeline-roles-outputs" ]; then
    echo "✓ .pipeline-roles-outputs (Pipeline roles stack outputs)"
fi
echo "✓ .env (All environment variables)"
echo ""

echo -e "${YELLOW}=== Architecture Overview ===${NC}"
cat << 'EOF'

┌────────────────────────────────────────────────────────────────┐
│                    Tsuru Architecture                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  GitHub                    CodePipeline                        │
│    ↓                           ↓                               │
│  [main branch]  →  [CodeBuild] →  [Lambda Update]              │
│                                      ↓                         │
│                              tsuru-api-handler               │
│                              (Node.js 20)                       │
│                                      ↓                         │
│                    ┌──────────────────┴──────────────────┐     │
│                    ↓                                    ↓      │
│              [API Gateway]                     [Supabase]      │
│          api.tsuru.jcampos.dev           PostgreSQL         │
│                    ↓                                           │
│        REST API for Client & Organizations                     │
│                                                                │
│         [Cognito] ↔ [User Authentication]                      │
│         [S3]      ↔ [Multi-tenant storage]                     │
│         [CloudFront] ↔ [CDN for orgs]                          │
│                                                                │
│                      [Static Website]                         │
│                 tsuru.jcampos.dev                       │
│                   [S3 + CloudFront]                           │
│                      React App                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘

EOF

echo -e "${GREEN}=== Success! ===${NC}"
echo ""
echo "Your AWS infrastructure is ready. You can now:"
echo "1. Push code to GitHub main branch to trigger deployments"
echo "2. Access your API at: https://api.tsuru.jcampos.dev/api/*"
echo "3. Access your website at: https://tsuru.jcampos.dev"
echo "4. Manage organizations with automatic infrastructure provisioning"
echo ""
echo "For troubleshooting, see: docs/DEPLOYMENT.md"
echo ""
