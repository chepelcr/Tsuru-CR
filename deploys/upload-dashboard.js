#!/usr/bin/env node

/**
 * Quick script to upload dashboard files to S3 and invalidate CloudFront
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { fromIni } from '@aws-sdk/credential-providers';
import { config } from 'dotenv';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mime from 'mime-types';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const AWS_PROFILE = process.env.AWS_PROFILE || 'default';

// AWS Configuration
const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: fromIni({ profile: AWS_PROFILE }),
});

const cloudFrontClient = new CloudFrontClient({
  region: 'us-east-1',
  credentials: fromIni({ profile: AWS_PROFILE }),
});

const DASHBOARD_BUCKET = 'admin-tsuru-tsuru-dev';
const DASHBOARD_DISTRIBUTION_ID = 'E32CF99EJB1AO2';
const BUILD_DIR = join(__dirname, 'dist', 'dashboard');

/**
 * Recursively upload directory to S3
 */
async function uploadDirectory(localPath, s3Prefix = '') {
  const files = readdirSync(localPath);

  for (const file of files) {
    const filePath = join(localPath, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      await uploadDirectory(filePath, join(s3Prefix, file));
    } else {
      const s3Key = join(s3Prefix, file).replace(/\\/g, '/');
      const fileContent = readFileSync(filePath);
      const contentType = mime.lookup(filePath) || 'application/octet-stream';

      const cacheControl = contentType.includes('html')
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=31536000, immutable';

      await s3Client.send(
        new PutObjectCommand({
          Bucket: DASHBOARD_BUCKET,
          Key: s3Key,
          Body: fileContent,
          ContentType: contentType,
          CacheControl: cacheControl,
        })
      );

      console.log(`  ✅ Uploaded: ${s3Key}`);
    }
  }
}

/**
 * Create CloudFront invalidation
 */
async function invalidateCloudFront(distributionId) {
  const command = new CreateInvalidationCommand({
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: `dashboard-${Date.now()}`,
      Paths: {
        Quantity: 1,
        Items: ['/*'],
      },
    },
  });

  const response = await cloudFrontClient.send(command);
  return response.Invalidation.Id;
}

async function main() {
  console.log('📦 Uploading Dashboard to S3...\n');
  console.log(`   Bucket: ${DASHBOARD_BUCKET}`);
  console.log(`   Source: ${BUILD_DIR}\n`);

  await uploadDirectory(BUILD_DIR);

  console.log('\n🔄 Creating CloudFront invalidation...');
  const invalidationId = await invalidateCloudFront(DASHBOARD_DISTRIBUTION_ID);
  console.log(`   ✅ Invalidation created: ${invalidationId}`);
  console.log(`   ⏱️  Invalidation will complete in 1-5 minutes\n`);

  console.log('✅ Dashboard deployed successfully!');
  console.log(`   URL: https://admin.tsuru.jcampos.dev\n`);
}

main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});
