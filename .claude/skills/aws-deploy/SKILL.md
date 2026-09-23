---
name: aws-deploy
description: CloudFormation stack ordering and deployment runbook for the Tsuru monorepo infrastructure. Use when deploying or re-deploying AWS infrastructure from this repo (IAM, Cognito, Lambda/SAM, API Gateway, frontend S3+CloudFront, CodePipeline), when a stack fails on a missing cross-stack import, or when asked in what order the stacks must go. Covers the mandatory stack order and its cross-stack dependencies, where IAM policies actually live, and the CI/CD flow.
---

# AWS deployment runbook

> Migrated out of the root CLAUDE.md so it loads only when deploying.
> **Verify before trusting the file names below** — several CloudFormation templates
> named here are not currently present in `cloudformation/`.


### CloudFormation Stack Order

**CRITICAL**: Stacks must be deployed in this exact order due to cross-stack dependencies:

1. **IAM** (`cloudformation/iam.yml`) - **Deploy FIRST**
   - Managed policy with all backend permissions (Cognito, S3, SES, CloudFront, etc.)
   - IAM user for local development (`strawberry-be-{env}`)
   - Access keys for development
   - Outputs: Policy ARN (imported by Lambda), Access credentials
   - **Usage**: `./deploys/deploy-iam.sh`
   - **Note**: Displays access credentials ONCE - save immediately!

2. **Cognito** (`cloudformation/cognito.yml`)
   - User Pool, User Pool Client, Identity Pool
   - SES email configuration for verification emails
   - Outputs: UserPoolId, UserPoolClientId used by Lambda

3. **Pipeline Roles** (`cloudformation/pipeline-roles.yml`)
   - CodeBuild role, CodePipeline role, S3 artifacts bucket
   - Outputs: Role ARNs used by CodePipeline stack

4. **Lambda** (`cloudformation/template.yaml` - SAM format)
   - Node.js 20.x Lambda function for API backend
   - Imports managed policy ARN from IAM stack (or uses inline policies)
   - Requires Cognito outputs, database URL, SES credentials
   - Outputs: Lambda ARN used by API Gateway

5. **API Gateway** (`cloudformation/api-gateway.yml`)
   - REST API with Lambda proxy integration
   - JWT authorizer validates Cognito tokens
   - ACM certificate + custom domain (api.tsuru.jcampos.dev)
   - Route53 DNS records

6. **Frontend Deployment** (`setup-template-bucket.js`)
   - Programmatically provisions S3 + CloudFront + Route53 for all sites
   - Covers: 8 templates, dashboard, landing page
   - Run: `node deploys/setup-template-bucket.js`

7. **CodePipeline** (`cloudformation/codepipeline.yml`)
   - GitHub integration via CodeStar Connection
   - CodeBuild for automated Lambda updates
   - Triggered on push to main branch

### Deployment Scripts

**Master orchestrator**: `./deploys/deploy-all.sh` runs backend stacks sequentially with validation.

**IAM Policy Management**:
- IAM policies are managed in the shared infra repo (`Infrastructure/policies/tsuru-iam-policies.yaml`)
- Lambda function imports the same managed policy ARN (shared permissions)
- Policy includes: Cognito (with `ListUsers`), S3, SES, CloudFront, Route53, Secrets Manager
- See `cloudformation/IAM_DEPLOYMENT.md` for detailed deployment guide

**Individual deployment**: Each stack has its own script (`deploy-cognito.sh`, `deploy-lambda.sh`, etc.)

**CI/CD Flow**:
```
Git push to main
  → GitHub webhook triggers CodePipeline
  → CodeBuild runs buildspec.yml
    → npm ci
    → sam build
    → sam deploy
  → Lambda function updated
```
