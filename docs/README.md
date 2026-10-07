# Tsuru (formerly Tsuru) - Beauty Market SaaS Platform

A multi-tenant SaaS platform for beauty product management and sales with AWS serverless infrastructure.

## Features

- **Multi-tenant Architecture**: Isolated environments for each organization
- **Product Management**: Comprehensive product catalog with categories and images
- **Authentication**: Secure user authentication via AWS Cognito
- **Admin Dashboard**: Content management system for categories and homepage
- **Responsive Design**: Beautiful UI with light/dark mode support
- **Multi-language Support**: Internationalization support with language switching
- **Cloud-Native**: Fully serverless architecture on AWS

## Tech Stack

### Frontend
- React 18+ with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (navigation)
- React Query (data fetching)
- react-i18next (internationalization)

### Backend
- Node.js 20 with Express
- Serverless (AWS Lambda)
- PostgreSQL (Supabase)
- AWS Cognito (authentication)

### Infrastructure
- **Compute**: AWS Lambda
- **API**: AWS API Gateway
- **Hosting**: S3 + CloudFront CDN
- **Database**: Supabase (PostgreSQL)
- **Authentication**: AWS Cognito
- **Email**: AWS SES
- **DNS**: Route53
- **CI/CD**: CodePipeline + CodeBuild
- **IaC**: CloudFormation

## Project Structure

```
BeautyMarket/
├── client/                    # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   ├── models/          # Data models/types
│   │   └── App.tsx          # Main app component
│   └── package.json
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # API route controllers
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access layer
│   │   ├── entities/        # Database entities
│   │   ├── types/           # TypeScript types
│   │   └── index.ts         # Server entry point
│   ├── lambda.cts           # AWS Lambda handler
│   └── package.json
├── cloudformation/           # IaC templates
│   ├── lambda.yml           # Lambda function
│   ├── api-gateway.yml      # API Gateway stack
│   ├── codepipeline.yml     # CI/CD pipeline
│   └── organization-publish-topic.yml  # SNS org events
├── deploys/                  # Deployment scripts
│   ├── deploy-all.sh        # Master orchestration
│   ├── deploy-lambda.sh
│   ├── deploy-api-gateway.sh
│   ├── deploy-sns.sh        # SNS topic
│   └── deploy-pipeline.sh
├── docs/                     # Documentation
│   ├── DEPLOYMENT.md        # Detailed deployment guide
│   └── ARCHITECTURE.md      # System architecture docs
├── migrations/              # Database migrations
├── .env.example             # Example environment variables
├── package.json             # Root package configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts          # Vite build configuration
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- AWS Account (for deployment)
- PostgreSQL 14+ (or Supabase)

### Development Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173` (frontend) and API at `http://localhost:5000`.

### Building for Production

```bash
# Build frontend
npm run build

# Build backend
npm run build:server

# Output files ready for deployment
```

## AWS Infrastructure Deployment

### Architecture Overview

The application is deployed on AWS using a serverless, multi-tenant architecture:

```
┌─────────────────────────────────────────┐
│         Client Application              │
│    (React via S3 + CloudFront)          │
└──────────────┬──────────────────────────┘
               │
         ┌─────▼─────────┐
         │  API Gateway  │
         │ (api.domain)  │
         └─────┬─────────┘
               │
         ┌─────▼──────────┐
         │  AWS Lambda    │
         │  (Node.js 20)  │
         └─────┬──────────┘
               │
    ┌──────────┼──────────┬─────────┐
    ▼          ▼          ▼         ▼
┌────────┐ ┌────────┐ ┌──────┐ ┌────────┐
│Supabase│ │Cognito │ │S3    │ │SES     │
│ (DB)   │ │(Auth)  │ │(CDN) │ │(Email) │
└────────┘ └────────┘ └──────┘ └────────┘
```

### Quick Deployment

For complete step-by-step AWS infrastructure deployment:

```bash
# 1. Ensure all prerequisites are met
# 2. Configure AWS credentials
aws configure --profile J-CAMPOS

# 3. Run master deployment script
./deploys/deploy-all.sh
```

This will deploy:
1. Cognito user authentication
2. IAM roles and S3 artifacts bucket
3. Lambda function with environment variables
4. API Gateway with custom domain
5. Static website hosting (S3 + CloudFront)
6. CodePipeline CI/CD automation

**Estimated deployment time:** 15-25 minutes

### Manual Deployment

For more control, deploy components individually:

```bash
./deploys/deploy-cognito.sh
./deploys/deploy-pipeline-roles.sh
./deploys/deploy-lambda.sh
./deploys/deploy-api-gateway.sh
./deploys/deploy-static-website.sh
./deploys/deploy-pipeline.sh
```

### Deployment Documentation

For detailed deployment instructions, prerequisites, and troubleshooting:

See: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Environment Configuration

### Required Environment Variables

```env
# Database
NEW_DATABASE_URL=postgresql://user:password@host:5432/db

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Cognito
COGNITO_USER_POOL_ID=us-east-1_xxxxx
COGNITO_CLIENT_ID=your-client-id
COGNITO_CLIENT_SECRET=your-client-secret

# Frontend URLs
FRONTEND_URL=https://your-domain.com
VITE_API_URL=https://api.your-domain.com

# Email
FROM_EMAIL=noreply@your-domain.com
SES_REGION=us-east-1

# Server
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-session-secret

# Encryption
ENCRYPTION_KEY=32-character-encryption-key-here
```

For complete configuration reference, see: [.env.example](.env.example)

## Deployment Pipeline

The project uses GitHub Actions and AWS CodePipeline for CI/CD:

```
GitHub Push → CodePipeline → CodeBuild → Lambda Update → Deploy ✓
```

**Trigger:** Push to `main` branch automatically deploys new code.

## API Documentation

### Available Endpoints

```
GET    /api/health              - Health check
GET    /api/products            - List all products
GET    /api/products/:id        - Get product details
GET    /api/categories          - List categories
POST   /api/orders              - Create order
GET    /api/cms-content         - Get homepage content
```

For complete API documentation, see: `docs/API.md` (coming soon)

## Authentication

The application uses AWS Cognito for authentication:

1. **User Registration**: Users sign up through the registration form
2. **Email Verification**: Confirmation email sent automatically
3. **Login**: Users authenticate with email/password
4. **Session Management**: JWT tokens managed by Cognito

## Database

Uses Supabase (PostgreSQL) with:
- TypeORM for ORM
- Database migrations managed with Drizzle
- Connection pooling for optimal performance

### Running Migrations

```bash
# Push migrations to database
npm run db:push

# Generate new migration
npm run db:generate

# Verify migrations
npm run db:check
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (frontend + backend)
npm run dev

# Build for production
npm run build

# Build server only
npm run build:server

# Database operations
npm run db:push
npm run db:pull

# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Run tests
npm run test
```

## Project Statistics

- **Languages**: TypeScript, JavaScript, HTML, CSS
- **Components**: 40+ reusable React components
- **Pages**: 10+ distinct page layouts
- **API Endpoints**: 15+ REST endpoints
- **CloudFormation Stacks**: 6 infrastructure components
- **Deployment Scripts**: 6 automated deployment scripts

## Security

- **HTTPS/TLS**: All endpoints use SSL/TLS encryption
- **Authentication**: AWS Cognito with MFA support
- **Database**: Encrypted connections and at-rest encryption
- **Secrets**: Environment variables for sensitive data
- **CORS**: Configured for production domains
- **Rate Limiting**: API Gateway throttling enabled
- **IAM**: Least privilege access control

## Cost Estimation

**Typical monthly costs (development environment):**
- Lambda: $0.20-2.00 (free tier: 1M requests)
- API Gateway: $0-3.50 (free tier: 1M requests)
- S3: $0.50-2.00
- CloudFront: $0.50-3.00
- Cognito: $0-4.00 (free tier: 50k MAU)
- Route53: $0.50 per hosted zone
- Supabase Database: $5-50 (depending on usage)

**Total estimate: $7-65/month** (can be lower with free tier utilization)

See: [AWS Pricing Calculator](https://calculator.aws/)

## Troubleshooting

### Common Issues

**Cold Start Timeout**
- Lambda cold starts can take 5-10 seconds
- Increase Lambda memory in CloudFormation templates for faster execution

**Custom Domain Not Working**
- Verify ACM certificate validation in Route53
- Check DNS propagation status

**API Returns 403 Forbidden**
- Check API Gateway CORS configuration
- Verify Lambda execution role has required permissions

For more troubleshooting, see: [docs/DEPLOYMENT.md#troubleshooting](docs/DEPLOYMENT.md#troubleshooting)

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

## License

This project is proprietary and confidential.

## Support

For issues and questions:
- Create a GitHub issue
- Contact the development team
- Check documentation in `docs/`

## Additional Resources

- [Deployment Guide](docs/DEPLOYMENT.md)
- [AWS CloudFormation Docs](https://docs.aws.amazon.com/cloudformation/)
- [AWS Lambda Docs](https://docs.aws.amazon.com/lambda/)
- [React Docs](https://react.dev)
- [Express Docs](https://expressjs.com)
- [Supabase Docs](https://supabase.com/docs)

---

**Last Updated:** November 2024

**Project Version:** 1.0.0

**Maintained by:** Development Team
