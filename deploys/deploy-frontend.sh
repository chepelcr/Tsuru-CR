
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

AWS_PROFILE=${AWS_PROFILE:-"J-CAMPOS"}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Tsuru Frontend Deploy${NC}"
echo -e "${GREEN}  Base domain: tsuru.jcampos.dev${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Ensure we're in the project root (script lives in deploys/)
cd "$(dirname "$0")/.."

# Check required env vars
if [ -z "$NEW_DATABASE_URL" ] && [ ! -f ".env" ]; then
  echo -e "${RED}❌ .env file not found and NEW_DATABASE_URL is not set${NC}"
  echo "   Create a .env file with NEW_DATABASE_URL"
  exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
  echo -e "${RED}❌ AWS CLI not found. Install it first.${NC}"
  exit 1
fi

# Check AWS profile
echo "Checking AWS credentials (profile: $AWS_PROFILE)..."
if ! aws sts get-caller-identity --profile $AWS_PROFILE &> /dev/null; then
  echo -e "${RED}❌ AWS profile $AWS_PROFILE not found or credentials invalid${NC}"
  echo "   Run: aws configure --profile $AWS_PROFILE"
  exit 1
fi
echo -e "${GREEN}✅ AWS credentials valid${NC}"
echo ""

# Resolve hosted zone ID (same approach as deploy-api-gateway.sh)
echo -e "${YELLOW}Fetching Route53 Hosted Zone ID...${NC}"
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name "tsuru.jcampos.dev" \
  --query "HostedZones[0].Id" \
  --output text \
  --profile $AWS_PROFILE | cut -d'/' -f3)

if [ -z "$HOSTED_ZONE_ID" ] || [ "$HOSTED_ZONE_ID" = "None" ]; then
  echo -e "${RED}❌ Could not find hosted zone for tsuru.jcampos.dev${NC}"
  echo "   Set HOSTED_ZONE_ID manually in .env and re-run"
  exit 1
fi
echo -e "${GREEN}✅ Found Hosted Zone ID: ${HOSTED_ZONE_ID}${NC}"
echo ""

# Write HOSTED_ZONE_ID to .env so setup-template-bucket.js can use it
if grep -q "^HOSTED_ZONE_ID=" .env 2>/dev/null; then
  sed -i "s|^HOSTED_ZONE_ID=.*|HOSTED_ZONE_ID=$HOSTED_ZONE_ID|" .env
  echo -e "${BLUE}Updated HOSTED_ZONE_ID in .env${NC}"
else
  [ -s .env ] && [ "$(tail -c1 .env | wc -l)" -eq 0 ] && echo "" >> .env
  echo "HOSTED_ZONE_ID=$HOSTED_ZONE_ID" >> .env
  echo -e "${BLUE}Added HOSTED_ZONE_ID to .env${NC}"
fi
echo ""

# Run the deployment script
echo -e "${YELLOW}Starting deployment...${NC}"
echo ""
node setup-template-bucket.js

EXIT_CODE=$?
echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}  Deployment complete!${NC}"
  echo -e "${GREEN}========================================${NC}"
else
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}  Deployment failed (exit code: $EXIT_CODE)${NC}"
  echo -e "${RED}========================================${NC}"
fi

exit $EXIT_CODE
