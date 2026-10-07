/**
 * Generate OpenAPI spec from Express JSDoc annotations.
 *
 * Modes:
 *   (default)  → swagger/tsuru.json   — source of truth for API Gateway template
 *   --dist     → dist/swagger-spec.json  — bundled into Lambda package for runtime swagger UI
 *
 * Usage:
 *   node scripts/generate-swagger-spec.cjs          # API Gateway mode
 *   node scripts/generate-swagger-spec.cjs --dist   # Lambda dist mode
 */
const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const distMode = process.argv.includes('--dist');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Tsuru API Documentation',
      version: '1.0.0',
      description: 'Multi-tenant marketplace platform API with CMS, authentication, RBAC, and auto-deployment',
      contact: {
        name: 'Tsuru Support',
        url: 'https://tsuru.jcampos.dev'
      }
    },
    servers: [
      {
        url: 'https://api.tsuru.jcampos.dev',
        description: 'Production API'
      },
      {
        url: 'http://localhost:5000',
        description: 'Development API'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string', nullable: true },
            lastName: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['admin', 'user'], default: 'admin' },
            isActive: { type: 'boolean', default: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', minimum: 0 },
            categoryId: { type: 'string', format: 'uuid' },
            imageUrl: { type: 'string', nullable: true },
            isActive: { type: 'boolean', default: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            backgroundColor: { type: 'string' },
            buttonColor: { type: 'string' },
            image1Url: { type: 'string', nullable: true },
            image2Url: { type: 'string', nullable: true },
            isActive: { type: 'boolean', default: true },
            sortOrder: { type: 'number', default: 0 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            customerName: { type: 'string' },
            customerPhone: { type: 'string' },
            provincia: { type: 'string' },
            canton: { type: 'string' },
            distrito: { type: 'string' },
            address: { type: 'string' },
            deliveryMethod: { type: 'string', enum: ['correos', 'uber-flash', 'personal'] },
            items: { type: 'string' },
            total: { type: 'number', minimum: 0 },
            status: { type: 'string', default: 'pending' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  apis: [
    path.join(rootDir, 'server/src/controllers/*.ts'),
    path.join(rootDir, 'server/src/controllers/*.js')
  ]
};

const specs = swaggerJsdoc(options);
const specJson = JSON.stringify(specs, null, 2);

if (distMode) {
  // Lambda dist mode: output to dist/swagger-spec.json (bundled into lambda-package.zip)
  const distDir = path.join(rootDir, 'dist');
  fs.mkdirSync(distDir, { recursive: true });
  const outputPath = path.join(distDir, 'swagger-spec.json');
  fs.writeFileSync(outputPath, specJson);
  console.log('✅ Swagger spec generated at:', outputPath);
} else {
  // API Gateway mode (default): output to swagger/tsuru.json
  const swaggerDir = path.join(rootDir, 'swagger');
  fs.mkdirSync(swaggerDir, { recursive: true });
  const outputPath = path.join(swaggerDir, 'tsuru.json');
  fs.writeFileSync(outputPath, specJson);
  console.log('✅ Swagger spec generated at:', outputPath);
}

console.log('📊 Paths found:', Object.keys(specs.paths || {}).length);
