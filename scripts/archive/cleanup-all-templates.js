import 'dotenv/config';
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteBucketCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  ListDistributionsCommand,
  GetDistributionConfigCommand,
  UpdateDistributionCommand,
  DeleteDistributionCommand,
} from '@aws-sdk/client-cloudfront';
import {
  Route53Client,
  ListResourceRecordSetsCommand,
  ChangeResourceRecordSetsCommand,
} from '@aws-sdk/client-route-53';

const REGION = process.env.AWS_REGION || 'us-east-1';
const HOSTED_ZONE_ID = process.env.HOSTED_ZONE_ID;

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const cloudFrontClient = new CloudFrontClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const route53Client = new Route53Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Old beauty-themed buckets to delete
const OLD_BUCKETS = [
  'beauty-demo-example-tsuru-tsuru-dev',
  'bella-natural-example-tsuru-tsuru-dev',
  'glam-studio-example-tsuru-tsuru-dev',
  'royal-hair-example-tsuru-tsuru-dev',
  'skin-love-example-tsuru-tsuru-dev',
  'pro-nails-example-tsuru-tsuru-dev',
  'beauty-salon-example-tsuru-tsuru-dev',
];

// New template subdomains (to delete CloudFront and Route53)
const NEW_TEMPLATES = [
  'tsuru-demo-example',
  'tech-gadgets-example',
  'vintage-fashion-example',
  'artisan-crafts-example',
  'gourmet-foods-example',
  'fitness-hub-example',
  'pet-care-example',
];

/**
 * Delete S3 bucket (must empty first)
 */
async function deleteBucket(bucketName) {
  try {
    console.log(`  Deleting S3 bucket: ${bucketName}...`);

    // List and delete all objects
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({ Bucket: bucketName })
    );

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      console.log(`    Deleting ${listResponse.Contents.length} objects...`);
      for (const object of listResponse.Contents) {
        await s3Client.send(
          new DeleteObjectCommand({ Bucket: bucketName, Key: object.Key })
        );
      }
    }

    // Delete bucket
    await s3Client.send(new DeleteBucketCommand({ Bucket: bucketName }));
    console.log(`    ✅ Deleted bucket ${bucketName}`);
  } catch (error) {
    if (error.name === 'NoSuchBucket') {
      console.log(`    ⏭️  Bucket ${bucketName} doesn't exist - skipping`);
    } else {
      console.error(`    ❌ Failed to delete bucket ${bucketName}:`, error.message);
    }
  }
}

/**
 * Delete CloudFront distribution
 */
async function deleteDistribution(distributionId) {
  try {
    console.log(`  Processing CloudFront distribution: ${distributionId}...`);

    // Get current config
    const configResp = await cloudFrontClient.send(
      new GetDistributionConfigCommand({ Id: distributionId })
    );
    const config = configResp.DistributionConfig;
    const etag = configResp.ETag;

    // If enabled, disable it first
    if (config.Enabled) {
      config.Enabled = false;
      await cloudFrontClient.send(
        new UpdateDistributionCommand({
          Id: distributionId,
          DistributionConfig: config,
          IfMatch: etag,
        })
      );
      console.log(`    ✅ Disabled ${distributionId} (needs 15-20 min to deploy before deletion)`);
      return false; // Not deleted yet
    } else {
      // Already disabled, try to delete
      await cloudFrontClient.send(
        new DeleteDistributionCommand({ Id: distributionId, IfMatch: etag })
      );
      console.log(`    ✅ Deleted ${distributionId}`);
      return true; // Successfully deleted
    }
  } catch (error) {
    if (error.name === 'NoSuchDistribution') {
      console.log(`    ⏭️  Distribution ${distributionId} doesn't exist - skipping`);
      return true;
    } else {
      console.error(`    ❌ Failed to process distribution ${distributionId}:`, error.message);
      return false;
    }
  }
}

/**
 * Delete Route53 DNS record
 */
async function deleteDNSRecord(subdomain, cloudFrontDomain) {
  try {
    const domainName = `${subdomain}.tsuru.jcampos.dev.`;
    console.log(`  Deleting DNS record: ${domainName}...`);

    await route53Client.send(
      new ChangeResourceRecordSetsCommand({
        HostedZoneId: HOSTED_ZONE_ID,
        ChangeBatch: {
          Comment: `Cleanup: Delete ${domainName}`,
          Changes: [
            {
              Action: 'DELETE',
              ResourceRecordSet: {
                Name: domainName,
                Type: 'A',
                AliasTarget: {
                  HostedZoneId: 'Z2FDTNDATAQYW2', // CloudFront hosted zone ID
                  DNSName: cloudFrontDomain,
                  EvaluateTargetHealth: false,
                },
              },
            },
          ],
        },
      })
    );
    console.log(`    ✅ Deleted DNS record ${domainName}`);
  } catch (error) {
    if (error.name === 'InvalidChangeBatch') {
      console.log(`    ⏭️  DNS record doesn't exist - skipping`);
    } else {
      console.error(`    ❌ Failed to delete DNS record:`, error.message);
    }
  }
}

/**
 * Main cleanup function
 */
async function cleanup() {
  console.log('🧹 Comprehensive Template Cleanup\n');
  console.log('This will:\n');
  console.log('  1. Delete old beauty-themed S3 buckets (7 buckets)');
  console.log('  2. Delete/disable CloudFront distributions for new templates (7 distributions)');
  console.log('  3. Delete Route53 DNS records for new templates (7 records)\n');

  // Step 1: Delete old beauty-themed S3 buckets
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Step 1: Deleting old beauty-themed S3 buckets\n');

  for (const bucket of OLD_BUCKETS) {
    await deleteBucket(bucket);
  }

  // Step 2: Get and delete Route53 records for new templates
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Step 2: Getting Route53 DNS records for new templates\n');

  const dnsRecords = {};

  if (HOSTED_ZONE_ID) {
    try {
      const recordsResp = await route53Client.send(
        new ListResourceRecordSetsCommand({ HostedZoneId: HOSTED_ZONE_ID })
      );

      for (const record of recordsResp.ResourceRecordSets || []) {
        if (record.Type === 'A' && record.AliasTarget) {
          for (const subdomain of NEW_TEMPLATES) {
            if (record.Name === `${subdomain}.tsuru.jcampos.dev.`) {
              dnsRecords[subdomain] = record.AliasTarget.DNSName;
              await deleteDNSRecord(subdomain, record.AliasTarget.DNSName);
            }
          }
        }
      }
    } catch (error) {
      console.error('  ❌ Failed to list DNS records:', error.message);
    }
  } else {
    console.log('  ⚠️  HOSTED_ZONE_ID not set, skipping DNS cleanup');
  }

  // Step 3: Delete CloudFront distributions for new templates
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Step 3: Deleting CloudFront distributions for new templates\n');

  try {
    const listResp = await cloudFrontClient.send(new ListDistributionsCommand({}));
    const allDistributions = listResp.DistributionList?.Items || [];

    let disabledCount = 0;
    let deletedCount = 0;

    for (const dist of allDistributions) {
      // Check if this distribution is for one of the new templates
      const isNewTemplate = NEW_TEMPLATES.some(subdomain =>
        dist.Comment?.includes(`${subdomain}.tsuru.jcampos.dev`)
      );

      if (isNewTemplate) {
        const deleted = await deleteDistribution(dist.Id);
        if (deleted) {
          deletedCount++;
        } else {
          disabledCount++;
        }
      }
    }

    console.log(`\n  Summary: ${deletedCount} deleted, ${disabledCount} disabled (pending deletion)`);

    if (disabledCount > 0) {
      console.log(`\n  ⏰ ${disabledCount} distributions were disabled and need 15-20 minutes to deploy.`);
      console.log(`     Run this script again later to complete deletion.`);
    }
  } catch (error) {
    console.error('  ❌ Failed to process CloudFront distributions:', error.message);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Cleanup completed!\n');
  console.log('You can now run setup-template-bucket.js to deploy fresh infrastructure.\n');
}

cleanup();
