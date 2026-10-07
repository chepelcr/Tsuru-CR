# Tsuru AWS Infrastructure Deployment Guide

This guide covers the complete setup and deployment of the Tsuru AWS infrastructure including Cognito, Lambda, API Gateway, S3, CloudFront, and CodePipeline.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Deployment Methods](#deployment-methods)
5. [Detailed Component Deployment](#detailed-component-deployment)
6. [Configuration Reference](#configuration-reference)
7. [Post-Deployment Steps](#post-deployment-steps)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Architecture Overview

### High-Level Architecture

```
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
```

### Component Breakdown

| Component | Purpose | Technology |
|-----------|---------|-----------|
| **Cognito** | User authentication & management | AWS Cognito |
| **Lambda** | Serverless backend API | Node.js 20 runtime |
| **API Gateway** | REST API endpoint | AWS API Gateway |
| **S3** | Static website & asset storage | AWS S3 |
| **CloudFront** | Content delivery & caching | AWS CloudFront CDN |
| **CodePipeline** | CI/CD automation | AWS CodePipeline + CodeBuild |
| **Route53** | DNS management | AWS Route53 |
| **IAM** | Access control | AWS IAM Roles & Policies |

---

## Prerequisites

### 1. AWS Setup
- AWS Account with billing enabled
- IAM User with full CloudFormation, Lambda, API Gateway, S3, IAM, and CodePipeline permissions
- AWS CLI installed and configured

```bash
# Install AWS CLI (macOS)
brew install awscli

# Configure AWS CLI
aws configure --profile J-CAMPOS
```

### 2. Domain & Hosted Zone
- Domain registered (e.g., tsuru.jcampos.dev)
- Route53 hosted zone created
- Hosted Zone ID available (format: Z1234567890ABC)

```bash
# Get your hosted zone ID
aws route53 list-hosted-zones --profile J-CAMPOS
```

### 3. GitHub Setup
- GitHub repository cloned/configured
- GitHub CodeStar connection created in AWS Console
  - Go to: https://console.aws.amazon.com/codesuite/connections
  - Create new GitHub connection (requires OAuth)
  - Note the connection ARN

### 4. Local Tools
- Node.js 20+ installed
- npm or yarn installed
- jq installed for JSON parsing

```bash
# Install jq (macOS)
brew install jq
```

### 5. Environment Files
- `.env` file with database and service credentials
- Optional: `.cognito-outputs` from previous deployment

---

## Quick Start

### Automated Deployment (Recommended)

```bash
cd /Users/tsuru/WebstormProjects/BeautyMarket

# Run complete deployment
./deploys/deploy-all.sh
```

**Total time:** 15-25 minutes

### Manual Step-by-Step

```bash
# Cognito — run in infra repo: ./cognito/build-cognito.sh dev
./deploys/deploy-sns.sh
./deploys/deploy-lambda.sh
./deploys/deploy-api-gateway.sh
node setup-template-bucket.js   # frontend: templates + dashboard + landing
./deploys/deploy-pipeline.sh
```

---

## Deployment Methods

### Method 1: Automated (deploy-all.sh)

Best for first-time deployment. Single command deploys all components in correct order.

```bash
./deploys/deploy-all.sh
```

**Features:**
- Prerequisite checking
- Automatic dependency ordering
- Built-in error handling
- Detailed output

### Method 2: Individual Components

Best for targeted updates or troubleshooting.

```bash
./deploys/deploy-sns.sh                 # Step 1 — SNS org events topic
./deploys/deploy-lambda.sh              # Step 2
./deploys/deploy-api-gateway.sh         # Step 3
node setup-template-bucket.js           # Step 4 — all frontend sites
./deploys/deploy-pipeline.sh            # Step 5
```

### Method 3: Manual CloudFormation

For advanced users or CI/CD integration.

```bash
aws cloudformation create-stack \
  --stack-name tsuru-pipeline-roles \
  --template-body file://cloudformation/pipeline-roles.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --profile J-CAMPOS
```

---

## Detailed Component Deployment

### 1. Cognito Authentication

Stack: `tsuru-cognito`

```bash
./deploys/deploy-cognito.sh
```

Creates user pool, app client, and email configuration.

**Outputs:**
- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID`
- `COGNITO_CLIENT_SECRET`

### 2. Pipeline Roles & S3

Stack: `tsuru-pipeline-roles`

```bash
./deploys/deploy-pipeline-roles.sh
```

Creates IAM roles and S3 bucket for CodePipeline.

### 3. Lambda Function

Stack: `tsuru-lambda`

```bash
./deploys/deploy-lambda.sh
```

**Interactive Prompts:**
- Lambda function name
- Session secret
- Database URL
- CloudFront URL
- Cognito credentials
- SES SMTP credentials
- Deployment stage

**Outputs:**
- `LAMBDA_FUNCTION_ARN`
- `LAMBDA_FUNCTION_NAME`

### 4. API Gateway

Stack: `tsuru-api-gateway`

```bash
./deploys/deploy-api-gateway.sh
```

**Interactive Prompts:**
- Lambda ARN (auto-loaded)
- API domain name (default: api.tsuru.jcampos.dev)
- Route53 hosted zone ID
- API Gateway name

**Important:** ACM certificate requires manual validation:
1. Go to AWS Certificate Manager Console
2. Find certificate for your domain
3. Click "Create records in Route53"
4. Wait 5-10 minutes for validation

### 5. Frontend Sites (templates, dashboard, landing)

Deployed via script — no CloudFormation stack required.

```bash
node setup-template-bucket.js
```

Automatically provisions S3 + CloudFront + Route53 for all 10 sites and uploads built files.

**Post-Deployment:**

```bash
npm run build
aws s3 sync dist/ s3://$(grep CLIENT_BUCKET_NAME .env | cut -d= -f2) --delete
aws cloudfront create-invalidation \
  --distribution-id $(grep CLIENT_CLOUDFRONT_ID .env | cut -d= -f2) \
  --paths '/*'
```

### 6. CodePipeline CI/CD

Stack: `tsuru-codepipeline`

```bash
./deploys/deploy-pipeline.sh
```

**Interactive Prompts:**
- Pipeline name (default: tsuru-pipeline)
- CodeBuild project name
- GitHub CodeStar connection ARN
- GitHub repository (owner/repo)
- Lambda function name (auto-loaded)

**How it works:**
1. Developer pushes to main branch
2. GitHub triggers CodePipeline
3. CodeBuild runs buildspec.yml
4. Lambda function updates automatically

---

## Configuration Reference

### Environment Variables

All stack outputs are saved to `.env`:

```env
# Cognito
COGNITO_USER_POOL_ID=us-east-1_xxxxx
COGNITO_CLIENT_ID=your-client-id
COGNITO_CLIENT_SECRET=your-client-secret

# Lambda
LAMBDA_FUNCTION_NAME=tsuru-api-handler
LAMBDA_FUNCTION_ARN=arn:aws:lambda:us-east-1:123456789:function:...

# API Gateway
API_GATEWAY_ID=abcdef1234
API_GATEWAY_URL=https://abcdef1234.execute-api.us-east-1.amazonaws.com/dev
API_DOMAIN_NAME=https://api.tsuru.jcampos.dev

# Static Website
CLIENT_BUCKET_NAME=tsuru-website-dev-123456789
CLIENT_CLOUDFRONT_ID=E1234ABCD
CLIENT_CLOUDFRONT_URL=https://tsuru.jcampos.dev

# CodePipeline
CODEPIPELINE_NAME=tsuru-pipeline
CODEBUILD_PROJECT_NAME=tsuru-build
GITHUB_CONNECTION_ARN=arn:aws:codestar-connections:...
```

---

## Post-Deployment Steps

### 1. Validate ACM Certificates

After API Gateway and Static Website deployment:

```bash
# Go to AWS Certificate Manager Console
# https://console.aws.amazon.com/acm/home

# For each certificate:
# 1. Click certificate
# 2. Click "Create records in Route53"
# 3. Wait 5-10 minutes for validation
# 4. Verify status shows "Issued"
```

### 2. Deploy Client Application

```bash
npm run build

# Upload to S3
aws s3 sync dist/ s3://$(grep CLIENT_BUCKET_NAME .env | cut -d= -f2) --delete

# Clear CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $(grep CLIENT_CLOUDFRONT_ID .env | cut -d= -f2) \
  --paths '/*'
```

### 3. Test Endpoints

```bash
# Test API
curl https://api.tsuru.jcampos.dev/api/health

# Test Website
curl https://tsuru.jcampos.dev
```

### 4. Verify GitHub CodeStar Connection

If CodePipeline fails:
1. Go to AWS CodeSuite → Connections
2. Find GitHub connection
3. Click "Update pending connection"
4. Authorize with GitHub
5. Re-run CodePipeline deployment

### 5. First Pipeline Run

```bash
# Push code to trigger pipeline
git push origin main

# Monitor at: CodePipeline → tsuru-pipeline
```

---

## Troubleshooting

### CloudFormation Stack Failures

```bash
# Check stack events
aws cloudformation describe-stack-events \
  --stack-name tsuru-pipeline-roles \
  --region us-east-1 \
  --profile J-CAMPOS
```

**Common Issues:**
- **IAM permission error:** Ensure user has full CloudFormation permissions
- **Template validation failed:** Validate before deployment:
  ```bash
  aws cloudformation validate-template \
    --template-body file://cloudformation/pipeline-roles.yml \
    --region us-east-1 \
    --profile J-CAMPOS
  ```

### ACM Certificate Not Validating

**Check Route53 records:**
```bash
aws route53 list-resource-record-sets \
  --hosted-zone-id Z1234567890 \
  --region us-east-1 \
  --profile J-CAMPOS
```

**Solutions:**
- Verify Route53 hosted zone ID is correct
- Wait 15-30 minutes for DNS propagation
- Check that DNS records were created

### Lambda Function Not Found

```bash
# Verify Lambda exists
aws lambda get-function \
  --function-name tsuru-api-handler \
  --region us-east-1 \
  --profile J-CAMPOS
```

### CloudFront Not Serving Website

```bash
# Check S3 files
aws s3 ls s3://$(grep CLIENT_BUCKET_NAME .env | cut -d= -f2)

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id $(grep CLIENT_CLOUDFRONT_ID .env | cut -d= -f2) \
  --paths '/*'
```

### CodePipeline Not Triggering

```bash
# Manual trigger
aws codepipeline start-pipeline-execution \
  --pipeline-name tsuru-pipeline \
  --region us-east-1 \
  --profile J-CAMPOS
```

---

## Monitoring and Maintenance

### CloudWatch Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/tsuru-api-handler \
  --follow \
  --region us-east-1 \
  --profile J-CAMPOS

# View CodeBuild logs
aws logs tail /aws/codebuild/tsuru-build \
  --follow \
  --region us-east-1 \
  --profile J-CAMPOS
```

### Update Components

```bash
# Update Lambda environment variables
./deploys/deploy-lambda.sh

# Update API Gateway configuration
./deploys/deploy-api-gateway.sh

# Update website content
aws s3 sync dist/ s3://$(grep CLIENT_BUCKET_NAME .env | cut -d= -f2) --delete
aws cloudfront create-invalidation \
  --distribution-id $(grep CLIENT_CLOUDFRONT_ID .env | cut -d= -f2) \
  --paths '/*'
```

### Cost Monitoring

**Typical monthly costs (dev environment):**
- Lambda: $0.20-2.00 (free tier: 1M requests)
- API Gateway: $0-3.50 (free tier: 1M requests)
- S3: $0.50-2.00
- CloudFront: $0.50-3.00
- Route53: $0.50 per hosted zone
- **Total estimate: $2-15/month**

---

## Additional Resources

- AWS CloudFormation: https://docs.aws.amazon.com/cloudformation/
- AWS Lambda: https://docs.aws.amazon.com/lambda/
- API Gateway: https://docs.aws.amazon.com/apigateway/
- CloudFront: https://docs.aws.amazon.com/cloudfront/
- AWS CLI: https://docs.aws.amazon.com/cli/
