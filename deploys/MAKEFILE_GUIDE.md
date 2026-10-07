# Makefile Deployment Guide

Simple deployment using `make` commands instead of complex bash scripts.

## Prerequisites

1. **AWS SAM CLI installed**
   ```bash
   brew install aws-sam-cli
   # or
   pip install aws-sam-cli
   ```

2. **Environment variables configured**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **AWS credentials configured**
   ```bash
   aws configure --profile J-CAMPOS
   ```

## Quick Start

### Deploy Everything
```bash
make deploy-all
```

### Deploy Individual Components

**Lambda Function**
```bash
make deploy-lambda
```

**API Gateway**
```bash
make deploy-api
```

**Client Application**
```bash
make deploy-client
```

## Commands

| Command | Description |
|---------|-------------|
| `make help` | Show available commands |
| `make build` | Build Lambda function |
| `make deploy-lambda` | Deploy Lambda stack with SAM |
| `make deploy-api` | Deploy API Gateway stack |
| `make deploy-client` | Deploy client to S3 + CloudFront |
| `make deploy-all` | Deploy everything in order |
| `make clean` | Clean build artifacts |

## Environment Variables

Required in `.env`:

```bash
# Lambda Configuration
SESSION_SECRET=your-secret
NEW_DATABASE_URL=postgresql://...
AWS_CLOUDFRONT_URL=https://...
AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxx
AWS_COGNITO_CLIENT_ID=xxxxx
SES_SMTP_USERNAME=xxxxx
SES_SMTP_PASSWORD=xxxxx
```

## How It Works

### SAM Deploy
Uses AWS SAM CLI to deploy CloudFormation stacks:
- Automatically packages Lambda code
- Uploads to S3
- Deploys stack with parameters from `.env`
- No manual zip/upload needed

### Benefits Over Bash Scripts
- ✅ Simpler syntax
- ✅ Built-in dependency management
- ✅ Automatic rollback on failure
- ✅ Change sets preview
- ✅ No manual stack checking

## Customization

Edit `Makefile` to change:
- Stack names (default: `tsuru-*`)
- AWS region (default: `us-east-1`)
- AWS profile (default: `J-CAMPOS`)

```makefile
AWS_REGION ?= us-west-2
AWS_PROFILE ?= my-profile
STACK_PREFIX = myapp
```

## Troubleshooting

**SAM not found**
```bash
which sam
# Install if missing
```

**Environment variables not loaded**
```bash
# Source .env manually
export $(cat .env | xargs)
make deploy-lambda
```

**Stack already exists**
- SAM automatically updates existing stacks
- Use `--no-confirm-changeset` to skip confirmation

## Migration from Bash Scripts

Old way:
```bash
./deploys/deploy-lambda.sh
# Interactive prompts
# Manual parameter entry
# Complex error handling
```

New way:
```bash
make deploy-lambda
# Reads from .env
# One command
# SAM handles everything
```

## Next Steps

1. Deploy infrastructure: `make deploy-all`
2. Update Lambda code: `make deploy-lambda`
3. Deploy client changes: `make deploy-client`

---

**Note:** Bash scripts in `deploys/` are still available for complex scenarios, but Makefile is recommended for daily use.
