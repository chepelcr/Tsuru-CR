# Tsuru Deployment Scripts

This directory contains all deployment scripts for AWS infrastructure and application deployment.

## Quick Start

### Full Infrastructure Deployment

Deploy all AWS infrastructure in one command:

```bash
./deploys/deploy-all.sh
```

This will deploy (in order):
1. Cognito (Authentication)
2. Pipeline Roles (IAM + S3)
3. Lambda Function (API Backend)
4. API Gateway (REST API)
5. Static Website (S3 + CloudFront)
6. CodePipeline (CI/CD)

**Estimated time:** 15-25 minutes

## Individual Deployment Scripts

### Infrastructure Components

#### 1. Cognito Authentication
```bash
./deploys/deploy-cognito.sh
```
Creates Cognito User Pool, Client, and Identity Pool for user authentication.

**Outputs:**
- User Pool ID
- Client ID
- Identity Pool ID

#### 2. Pipeline Roles & S3 Artifacts
```bash
./deploys/deploy-pipeline-roles.sh
```
Creates IAM roles for CodePipeline and CodeBuild, plus S3 bucket for artifacts.

**Outputs:**
- CodeBuild Role ARN
- CodePipeline Role ARN
- Artifacts Bucket Name

#### 3. Lambda Function
```bash
./deploys/deploy-lambda.sh
```
Deploys Lambda function with environment variables for API backend.

**Requires:**
- Database URL (Supabase PostgreSQL)
- Session secret
- Cognito credentials
- SES SMTP credentials

**Outputs:**
- Lambda Function ARN

#### 4. API Gateway
```bash
./deploys/deploy-api-gateway.sh
```
Creates API Gateway with custom domain and Lambda integration.

**Requires:**
- Lambda Function ARN
- Route53 Hosted Zone ID

**Outputs:**
- API Gateway ID
- API Gateway URL
- Custom Domain URL

**Note:** ACM certificate validation required (5-10 minutes)

#### 5. Frontend Deployment (templates, dashboard, landing)
```bash
node setup-template-bucket.js
```
Builds and deploys all frontend apps (8 templates, dashboard, landing page) to S3 + CloudFront + Route53. No CloudFormation required — fully automated via the script.

#### 6. CodePipeline
```bash
./deploys/deploy-pipeline.sh
```
Sets up CI/CD pipeline with GitHub integration.

**Requires:**
- GitHub CodeStar Connection ARN
- GitHub Repository (owner/repo)
- Lambda Function Name

**Outputs:**
- CodePipeline Name
- CodeBuild Project Name

### Application Deployment

#### Update Lambda Code
```bash
./deploys/update-lambda.sh
```
Quickly update Lambda function code without full CloudFormation deployment.

**Use when:**
- Making code changes to API backend
- Testing new features
- Hot fixes

#### Deploy Client Application
```bash
./deploys/deploy-client.sh
```
Build and deploy React client to S3 with CloudFront invalidation.

**Use when:**
- Updating frontend code
- Deploying new features
- UI changes

### Cleanup

#### Delete All Infrastructure
```bash
./deploys/delete-all.sh
```
**⚠️ WARNING:** Deletes all AWS infrastructure. Cannot be undone!

Requires triple confirmation:
1. Type `DELETE`
2. Type `YES`
3. Type `DESTROY`

## Deployment Order

Infrastructure must be deployed in this order:

```
1. Cognito
   ↓
2. Pipeline Roles
   ↓
3. Lambda
   ↓
4. API Gateway
   ↓
5. Static Website
   ↓
6. CodePipeline
```

## Environment Variables

All scripts use these environment variables (with defaults):

```bash
AWS_REGION=us-east-1          # AWS region
AWS_PROFILE=J-CAMPOS          # AWS CLI profile
ENVIRONMENT=dev               # Environment name (dev/staging/prod)
```

Override with:
```bash
AWS_REGION=us-west-2 ./deploys/deploy-lambda.sh
```

## Configuration Files

Scripts create these files:

- `.env` - All environment variables and outputs
- `.cognito-outputs` - Cognito stack outputs
- `.pipeline-roles-outputs` - Pipeline roles stack outputs

## Prerequisites

### AWS Account Setup

1. **AWS CLI installed and configured**
   ```bash
   aws configure --profile J-CAMPOS
   ```

2. **Required AWS Permissions:**
   - CloudFormation (full access)
   - IAM (create roles and policies)
   - Lambda (create and update functions)
   - API Gateway (create APIs)
   - S3 (create and manage buckets)
   - CloudFront (create distributions)
   - Route53 (manage DNS records)
   - ACM (create certificates)
   - Cognito (create user pools)
   - CodePipeline (create pipelines)
   - CodeBuild (create projects)

3. **Route53 Hosted Zone**
   - Domain: `tsuru.jcampos.dev`
   - Get Hosted Zone ID from Route53 console

4. **GitHub CodeStar Connection**
   - Create in AWS Console: CodePipeline → Settings → Connections
   - Authorize GitHub access
   - Copy Connection ARN

5. **SES Email Verification**
   - Verify email address in SES console
   - Get SMTP credentials
   - Note: SES starts in sandbox mode (verify recipients)

### Local Development Setup

1. **Node.js 20+**
   ```bash
   node --version  # Should be v20.x.x
   ```

2. **Dependencies installed**
   ```bash
   npm install
   ```

3. **Database (Supabase)**
   - Create Supabase project
   - Get PostgreSQL connection string
   - Run migrations: `npm run db:push`

## Common Issues

### ACM Certificate Validation Pending

**Problem:** Custom domain not working after deployment

**Solution:**
1. Go to AWS Certificate Manager console
2. Find certificate for your domain
3. Click "Create records in Route53"
4. Wait 5-10 minutes for validation

### Lambda Update Failed

**Problem:** `update-lambda.sh` fails with permission error

**Solution:**
1. Check Lambda function name in `.env`
2. Verify IAM permissions for Lambda
3. Ensure function exists: `aws lambda get-function --function-name <name>`

### CodePipeline Not Triggering

**Problem:** Push to GitHub doesn't trigger pipeline

**Solution:**
1. Check GitHub connection status in CodePipeline console
2. Re-authorize connection if needed
3. Verify repository and branch name in pipeline configuration

### S3 Bucket Already Exists

**Problem:** Stack creation fails with bucket name conflict

**Solution:**
1. Bucket names must be globally unique
2. Update bucket name in CloudFormation template
3. Or delete existing bucket if it's yours

## Monitoring

### CloudFormation Stacks
```bash
aws cloudformation describe-stacks --profile J-CAMPOS
```

### Lambda Logs
```bash
aws logs tail /aws/lambda/tsuru-api-handler --follow --profile J-CAMPOS
```

### CodePipeline Status
```bash
aws codepipeline get-pipeline-state --name tsuru-pipeline --profile J-CAMPOS
```

### CloudFront Invalidation Status
```bash
aws cloudfront get-invalidation --distribution-id <ID> --id <INVALIDATION_ID> --profile J-CAMPOS
```

## Cost Optimization

### Development Environment

- Use `dev` environment parameter
- Lambda: 512MB memory (adjust based on needs)
- CloudFront: PriceClass_100 (North America + Europe)
- S3: Standard storage class
- API Gateway: No reserved capacity

### Production Environment

- Use `prod` environment parameter
- Lambda: Increase memory for better performance
- CloudFront: PriceClass_All for global distribution
- S3: Consider Intelligent-Tiering
- API Gateway: Consider reserved capacity

## Security Best Practices

1. **Never commit `.env` files**
   - Already in `.gitignore`
   - Contains sensitive credentials

2. **Rotate credentials regularly**
   - Database passwords
   - Session secrets
   - SES SMTP credentials

3. **Use least privilege IAM roles**
   - Review IAM policies in CloudFormation templates
   - Remove unnecessary permissions

4. **Enable MFA for AWS account**
   - Especially for production deployments

5. **Monitor CloudTrail logs**
   - Track all API calls
   - Set up alerts for suspicious activity

## Troubleshooting

### Get Stack Events
```bash
aws cloudformation describe-stack-events --stack-name <stack-name> --profile J-CAMPOS
```

### Validate Template
```bash
aws cloudformation validate-template --template-body file://cloudformation/<template>.yml --profile J-CAMPOS
```

### Check Lambda Configuration
```bash
aws lambda get-function-configuration --function-name tsuru-api-handler --profile J-CAMPOS
```

### Test API Gateway
```bash
curl https://api.tsuru.jcampos.dev/api/health
```

## Support

For issues:
1. Check CloudFormation stack events
2. Review CloudWatch logs
3. Verify all prerequisites are met
4. Check AWS service quotas
5. Consult AWS documentation

## Additional Resources

- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)

---

**Last Updated:** December 2024
**Maintained by:** Development Team
