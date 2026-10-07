# Tsuru Deployment Guide

Complete guide for deploying the Tsuru platform to AWS infrastructure.

## 📋 Table of Contents

1. [Infrastructure Overview](#infrastructure-overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Order](#deployment-order)
4. [Testing Lambda & API Gateway](#testing-lambda--api-gateway)
5. [Dashboard Deployment](#dashboard-deployment)
6. [Troubleshooting](#troubleshooting)

---

## 🏗️ Infrastructure Overview

The Tsuru platform consists of multiple AWS components:

### Backend Infrastructure
- **Lambda Function**: Node.js 20.x serverless Express app (`server/`)
- **API Gateway**: REST API with custom domain (`api.tsuru.jcampos.dev`)
- **Cognito**: User authentication and management
- **RDS/Supabase**: PostgreSQL database
- **SES**: Email service for notifications

### Frontend Infrastructure
- **Dashboard** (Admin Panel): React SPA at `admin.tsuru.jcampos.dev`
- **Landing Page**: Marketing site at `tsuru.jcampos.dev`
- **Template Sites**: Multiple tenant sites at `{subdomain}.tsuru.jcampos.dev`

### Infrastructure Pattern (Similar to JCampos-Biller)
```
CloudFormation Templates (this repo):
├── lambda.yml              # Lambda function
├── api-gateway.yml         # API Gateway + custom domain
├── codepipeline.yml        # CI/CD pipeline
└── organization-publish-topic.yml  # SNS topic for org events

Managed in infra repo (Infrastructure/):
├── cognito/tsuru-cognito.yml    # User authentication
└── policies/tsuru-iam-policies.yaml  # IAM policies

Frontend deployment (no CloudFormation):
└── setup-template-bucket.js  # S3 + CloudFront for all sites
```

---

## ⚙️ Prerequisites

### 1. AWS Credentials

Create AWS profile for deployment:

```bash
aws configure --profile J-CAMPOS
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Region: us-east-1
# Output format: json
```

### 2. Environment Variables

Create `.env` file in project root with:

```bash
# AWS Configuration
AWS_REGION=us-east-1

# Hosted Zone
HOSTED_ZONE_ID=your_hosted_zone_id_here

# Note: AWS credentials and account ID are automatically retrieved from the J-CAMPOS profile

# Database
NEW_DATABASE_URL=postgresql://user:password@host:5432/database

# Session
SESSION_SECRET=your_session_secret_here

# Cognito
AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxxxx
AWS_COGNITO_CLIENT_ID=your_client_id_here

# SES SMTP
SES_SMTP_USERNAME=your_ses_username_here
SES_SMTP_PASSWORD=your_ses_password_here

# CloudFront
AWS_CLOUDFRONT_URL=https://cloudfront.dev.tsuru.io
```

### 3. Install Dependencies

```bash
# Project dependencies
npm install

# AWS SAM CLI (for Lambda deployment)
brew install aws-sam-cli

# AWS CLI
brew install awscli
```

---

## 🚀 Deployment Order

**CRITICAL**: Deploy in this exact order due to cross-stack dependencies:

### Step 1: IAM Roles & Policies

```bash
./deploys/deploy-iam.sh
```

**What it does:**
- Creates managed policy with backend permissions (Cognito, S3, SES, CloudFront, Route53)
- Creates IAM user for local development
- Displays access credentials (save them immediately!)

**Outputs:**
- Policy ARN: `tsuru-iam-dev-BackendPolicyArn`
- Access credentials for local development

### Step 2: Cognito User Pool

```bash
./deploys/deploy-cognito.sh
```

**What it does:**
- Creates User Pool for authentication
- Creates User Pool Client for frontend
- Creates Identity Pool for AWS resource access
- Configures email verification (via SES)

**Outputs:**
- User Pool ID
- User Pool Client ID
- Identity Pool ID

### Step 3: Lambda Function

```bash
./deploys/deploy-lambda.sh
```

**What it does:**
- Builds backend with SAM (`sam build`)
- Packages Express app as Lambda function
- Deploys with environment variables
- Imports IAM policy from Step 1

**Outputs:**
- Lambda Function ARN: `tsuru-lambda-LambdaArn`

**Build Process:**
```bash
# What happens during sam build:
1. Reads cloudformation/template.yaml
2. Executes Makefile (see deploys/MAKEFILE_GUIDE.md)
3. Runs npm install in .aws-sam/build
4. Copies dist/ folder to Lambda package
```

### Step 4: API Gateway

```bash
./deploys/deploy-api-gateway.sh
```

**What it does:**
- Creates REST API Gateway
- Configures Lambda proxy integration
- Sets up custom domain (`api.tsuru.jcampos.dev`)
- Creates ACM SSL certificate
- Adds Route53 DNS records

**Outputs:**
- API Gateway URL
- Custom Domain URL

### Step 5: Frontend Deployment (Templates, Landing, Dashboard)

```bash
# Build all templates and dashboard
npm run build:templates
npm run build:dashboard

# Deploy all frontend infrastructure (templates, landing page, and dashboard)
node setup-template-bucket.js
```

**What it does:**
- Creates S3 buckets for templates, landing page, and dashboard
- Creates CloudFront distributions with SSL
- Uploads built files for all frontends
- Creates Route53 DNS records
- Dashboard: `admin.tsuru.jcampos.dev`
- Landing: `tsuru.jcampos.dev`
- Templates: `{subdomain}.tsuru.jcampos.dev`

**Outputs:**
- Landing page URL: `https://tsuru.jcampos.dev`
- Dashboard URL: `https://admin.tsuru.jcampos.dev`
- Template URLs: `https://{subdomain}.tsuru.jcampos.dev`

**Quick command:**
```bash
npm run deploy:all-frontend
```

---

## 🧪 Testing Lambda & API Gateway

### 1. Test Lambda Function Locally

```bash
# Start local development server
npm run dev

# Test endpoints
curl http://localhost:5000/api/health
curl http://localhost:5000/api/organizations/check-slug/test-org
```

### 2. Test Lambda via AWS Console

1. Go to AWS Lambda Console
2. Find function: `tsuru-api-handler`
3. Click "Test" tab
4. Create test event:

```json
{
  "httpMethod": "GET",
  "path": "/api/health",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": null,
  "isBase64Encoded": false
}
```

5. Click "Test" - should return 200 OK

### 3. Test Lambda via API Gateway

```bash
# Get API Gateway URL
aws cloudformation describe-stacks \
  --stack-name tsuru-api-gateway \
  --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" \
  --output text \
  --profile J-CAMPOS

# Test health endpoint
curl https://[api-id].execute-api.us-east-1.amazonaws.com/prod/api/health

# Test with custom domain
curl https://api.tsuru.jcampos.dev/api/health
```

### 4. Test with Authentication

```bash
# Login and get JWT token
TOKEN=$(curl -X POST https://api.tsuru.jcampos.dev/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}' \
  | jq -r '.token')

# Use token in authenticated request
curl https://api.tsuru.jcampos.dev/api/users/[userId]/profile \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Update Lambda Code (After Changes)

```bash
# Quick update without full deployment
sam build --template cloudformation/template.yaml --profile J-CAMPOS

sam deploy \
  --stack-name tsuru-lambda \
  --no-confirm-changeset \
  --profile J-CAMPOS
```

### 6. View Lambda Logs

```bash
# View recent logs
aws logs tail /aws/lambda/tsuru-lambda --follow --profile J-CAMPOS

# Filter errors
aws logs tail /aws/lambda/tsuru-lambda --filter-pattern "ERROR" --profile J-CAMPOS
```

---

## 📱 Dashboard Deployment

### Build & Deploy Dashboard

The dashboard is deployed using the same script as templates and landing page:

```bash
# 1. Build dashboard
cd dashboard
npm run build
cd ..

# 2. Deploy all frontend (includes dashboard, landing, templates)
node setup-template-bucket.js

# OR use the convenient npm script
npm run deploy:all-frontend
```

### Update Dashboard Only (After Changes)

If you only want to update the dashboard without rebuilding templates:

```bash
# Rebuild dashboard
cd dashboard
npm run build
cd ..

# Redeploy (the script will skip rebuilding existing infrastructure)
node setup-template-bucket.js
```

**Note:** The setup script is idempotent - it will reuse existing buckets and CloudFront distributions, only uploading new files.

### Dashboard Environment Variables

Update `dashboard/.env.production`:

```bash
VITE_API_URL=https://api.tsuru.jcampos.dev
VITE_AWS_REGION=us-east-1
VITE_AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxxxx
VITE_AWS_COGNITO_CLIENT_ID=your_client_id_here
```

---

## 🔍 Troubleshooting

### Lambda Deployment Issues

**Error: "No such file or directory: dist/lambda.js"**
```bash
# Ensure backend is built
npm run build:lambda

# Check dist folder
ls dist/
```

**Error: "Invalid permissions on Lambda function"**
```bash
# Redeploy IAM stack
./deploys/deploy-iam.sh

# Update Lambda with new policy
./deploys/deploy-lambda.sh
```

### API Gateway Issues

**Error: "Missing Authentication Token"**
- Check that route is configured correctly
- Verify Lambda permission for API Gateway

**Error: "Internal Server Error (500)"**
- Check Lambda logs: `aws logs tail /aws/lambda/tsuru-lambda --follow`
- Verify environment variables are set correctly

### Dashboard Issues

**Error: "Dashboard build folder does not exist"**
```bash
cd dashboard
npm run build
cd ..
```

**Dashboard not deploying:**
```bash
# Ensure dashboard is built
cd dashboard && npm run build && cd ..

# Run the setup script
node setup-template-bucket.js
```

**Error: "No wildcard certificate found"**
```bash
# The setup script automatically creates wildcard cert for *.tsuru.jcampos.dev
# Just run the script and it will handle certificate creation/validation
node setup-template-bucket.js
```

**Dashboard shows blank page:**
- Check CloudFront distribution is enabled
- Verify Custom Error Responses are configured (404/403 → /index.html)
- Check browser console for errors

### DNS Issues

**Domain not resolving:**
```bash
# Check DNS propagation
dig admin.tsuru.jcampos.dev
dig api.tsuru.jcampos.dev

# Verify Route53 records
aws route53 list-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --profile J-CAMPOS
```

### CloudFront Invalidation

If changes don't appear:

```bash
# Get distribution ID
aws cloudfront list-distributions \
  --query "DistributionList.Items[?Aliases.Items[?contains(@,'admin.tsuru')]].Id" \
  --output text \
  --profile J-CAMPOS

# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id [DISTRIBUTION_ID] \
  --paths "/*" \
  --profile J-CAMPOS
```

---

## 📚 Additional Resources

### Related Files
- **Lambda Handler**: `server/lambda.ts` (Express → serverless-http wrapper)
- **API Routes**: `server/src/routes.ts`
- **Makefile**: `Makefile` (used by SAM build)
- **SAM Template**: `cloudformation/template.yaml`
- **Deployment Scripts**: `deploys/`

### Architecture Comparison

| Component | JCampos-Biller | Tsuru | Notes |
|-----------|----------------|----------|-------|
| Lambda | ✅ CloudFormation | ✅ SAM | Tsuru uses SAM (AWS::Serverless) |
| API Gateway | ✅ CloudFormation | ✅ CloudFormation | Both use REST API with custom domain |
| Dockerfile | ✅ Used | ❌ Not used | Tsuru uses SAM build with Makefile |
| Update Script | `update-lambda.sh` | `deploy-lambda.sh` | Both update Lambda code |
| Frontend | Individual scripts | ✅ `setup-template-bucket.js` | Single script for all frontends |

### Environment-Specific Stacks

All stacks use `-dev` suffix for development:
- `tsuru-iam-dev`
- `tsuru-cognito-dev`
- `tsuru-lambda`
- `tsuru-api-gateway`

For production, change stack names in deployment scripts.

---

## ✅ Deployment Checklist

Before going live:

- [ ] All environment variables set in `.env`
- [ ] IAM stack deployed successfully
- [ ] Cognito stack deployed successfully
- [ ] Lambda stack deployed and tested
- [ ] API Gateway responding correctly
- [ ] SSL certificates validated (ACM)
- [ ] DNS records created (Route53)
- [ ] Dashboard built and deployed
- [ ] CloudFront distributions enabled
- [ ] Test complete user flow (register → login → use dashboard)
- [ ] Lambda logs showing no errors
- [ ] All subdomains resolving correctly

---

**🎉 Your Tsuru platform is now deployed to AWS!**

Dashboard: `https://admin.tsuru.jcampos.dev`
API: `https://api.tsuru.jcampos.dev`
Landing: `https://tsuru.jcampos.dev`
