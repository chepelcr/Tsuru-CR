#!/bin/bash

# Tsuru - Lambda Deployment Script (Simple CloudFormation)
STACK_NAME="tsuru-lambda"
ENVIRONMENT=${1:-dev}
PROFILE="J-CAMPOS"
REGION="us-east-1"

echo "🚀 Tsuru Lambda Deployment (Simple CloudFormation)"
echo "   Environment: $ENVIRONMENT"

# Check AWS credentials
echo "Checking AWS credentials..."
aws sts get-caller-identity --profile $PROFILE --region $REGION
if [ $? -ne 0 ]; then
    echo "❌ AWS credentials invalid. Please run: aws configure --profile $PROFILE"
    exit 1
fi

# Build and package Lambda function
echo "📦 Building and packaging Lambda function..."
cd "$(dirname "$0")/.."
mkdir -p dist
npm run package:lambda

if [ $? -ne 0 ]; then
    echo "❌ Failed to build Lambda package"
    exit 1
fi

# Check if lambda-package.zip exists
if [ ! -f "lambda-package.zip" ]; then
    echo "❌ lambda-package.zip not found"
    exit 1
fi

echo "✅ Lambda package created: $(du -h lambda-package.zip | cut -f1)"

# Load environment variables
if [ ! -f ".env" ]; then
    echo "❌ Missing .env file with required variables"
    exit 1
fi

# Deploy lambda stack
# Note: no DatabaseURLParam — DB credentials are resolved at runtime via
# SSM (/tsuru/{env}/platform/aws/database) → Secrets Manager (tsuru/{env}/database)
echo "🚀 Deploying $STACK_NAME..."
aws cloudformation deploy \
    --template-file cloudformation/lambda.yml \
    --stack-name $STACK_NAME \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        Environment="$ENVIRONMENT" \
        FunctionNameParam="tsuru-${ENVIRONMENT}-api-handler" \
    --profile $PROFILE \
    --region $REGION

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy lambda stack"
    exit 1
fi
echo "✅ $STACK_NAME deployed successfully!"

# Update Lambda function code with the actual package
echo "🔄 Updating Lambda function code..."
aws lambda update-function-code \
    --function-name "tsuru-${ENVIRONMENT}-api-handler" \
    --zip-file fileb://lambda-package.zip \
    --region $REGION \
    --profile $PROFILE >/dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Failed to update Lambda code"
    exit 1
fi

echo "✅ Lambda code updated successfully!"
echo ""
echo "✅ Lambda deployment completed!"
echo "📝 Run ./deploys/deploy-api.sh to deploy API Gateway"
