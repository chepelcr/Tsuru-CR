# Deployment Service — Architecture Reference

> **Audience**: Infrastructure microservice team. This document describes how the main Node.js service manages content deployments and what the infrastructure microservice must implement to support it.

---

## Overview

The deployment subsystem has two distinct services:

| Service | Responsibility |
|---------|---------------|
| `PreDeploymentService` | Tracks pending content changes (products/categories/CMS) before they are published |
| `DeploymentService` | Executes the publish: uploads `config.json` to S3, records deployment history |

Neither service provisions AWS infrastructure — that is the responsibility of the **infrastructure microservice** which reacts to the `OrganizationRegistered` SNS event.

---

## PreDeploymentService

**File**: `server/src/services/PreDeploymentService.ts`

**Purpose**: Staging buffer. Accumulates content changes so the store admin can review them before pushing to the live store.

**Trigger**: Called automatically whenever a product, category, or CMS entity is created/updated/deleted via the respective service methods.

### Flow: `triggerPreDeployment(triggerType, action, entityId, entityType, changes, organizationId)`

1. Checks if an active pre-deployment record already exists for the organization (`status: 'ready'`)
   - **If exists**: merges the new change into the `changes` JSONB field, updates message to `predeployment.multiple`
   - **If not exists**: creates a new `pre_deployments` record with `status: 'ready'`
2. After creation, calls `checkAndProvisionInfrastructure(organizationId)`:
   - Reads from `organization_settings` table (owned by infra microservice)
   - If no row exists OR `infrastructure_status` is `pending`/`failed` → re-publishes the `OrganizationRegistered` SNS event (fire-and-forget)
   - If `provisioning` or `active` → no action needed

### Pre-deployments table schema

```
pre_deployments
├── id                UUID PK
├── organizationId    TEXT (FK organizations.id)
├── status            VARCHAR(20) — 'ready' | 'published'
├── triggerType       VARCHAR(20) — 'product' | 'category' | 'cms'
├── triggerAction     VARCHAR(20) — 'create' | 'update' | 'delete'
├── entityId          TEXT (nullable)
├── entityType        TEXT (nullable)
├── changes           JSONB — map of entityId → { type, action, entityType, changes, timestamp }
├── message           TEXT (i18n key, e.g. "predeployment.product.create")
├── publishedAt       TIMESTAMP (nullable)
└── buildId           VARCHAR (nullable — set when published)
```

---

## DeploymentService

**File**: `server/src/services/DeploymentService.ts`

**Purpose**: Executes the publish of staged changes. Called when the store admin clicks the "Publish" button in the dashboard.

### Flow: `publishPreDeployment(preDeploymentId, organizationId)`

1. Loads pre-deployment record by ID
2. Loads organization by ID
3. **Checks infrastructure readiness** by reading `organization_settings` table:
   - `status === pending || failed || no row` → re-publishes `OrganizationRegistered` SNS event → returns `{ success: false, error: "Infrastructure is being provisioned..." }`
   - `status === provisioning` → returns `{ success: false, error: "Infrastructure is being provisioned..." }`
   - `status === active` → continues
4. Creates a `deployment_history` record with `status: 'building'`, `buildId: build-{timestamp}`
5. **Uploads `config.json`** to the organization's S3 bucket (from `organization_settings.s3_bucket_name`):
   ```json
   { "organizationId": "<orgId>", "mode": "production" }
   ```
   - S3 key: `config.json`
   - Cache-Control: `no-cache`
6. Marks pre-deployment `status: 'published'`, sets `publishedAt` and `buildId`
7. Marks deployment history `status: 'success'`, sets `completedAt`, `deployUrl: https://{subdomain}.tsuru.jcampos.dev`

### Deployment history table schema

```
deployment_history
├── id                TEXT PK (UUID)
├── organizationId    TEXT
├── buildId           VARCHAR(100) — "build-{timestamp}"
├── status            VARCHAR(20) — 'building' | 'uploading' | 'success' | 'error'
├── message           TEXT (description of deployment)
├── startedAt         TIMESTAMP
├── completedAt       TIMESTAMP (nullable)
├── deployUrl         TEXT (nullable) — https://{subdomain}.tsuru.jcampos.dev
├── errorDetails      TEXT (nullable)
├── filesUploaded     INTEGER (default 0)
└── buildSizeKb       INTEGER (nullable)
```

---

## SNS Event: OrganizationRegistered

**Published by**: `OrganizationEventPublisher` (`server/src/services/OrganizationEventPublisher.ts`)

**When published**:
1. First-time organization creation (`OrganizationService.create()`)
2. Re-trigger when deployment is attempted but `organization_settings` row is missing or `infrastructure_status` is `pending`/`failed`

**SNS Topic CFN template**: `cloudformation/organization-publish-topic.yml`

**Event envelope** (standard event-management contract):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2024-01-15T10:30:00.000Z",
  "eventType": "ORGANIZATION_REGISTERED",
  "_type": "OrganizationRegisteredEvent",
  "data": {
    "id": "org-uuid",
    "name": "My Store",
    "slug": "my-store",
    "subdomain": "my-store",
    "domain": "www.mystore.com"
  }
}
```

**MessageAttribute**: `eventType = ORGANIZATION_REGISTERED` (for SNS filter policies)

---

## organization_settings Table (owned by infra microservice)

This table is written exclusively by the infrastructure microservice. The Node.js service reads it to validate infrastructure readiness.

```sql
CREATE TABLE organization_settings (
  id                       SERIAL PRIMARY KEY,
  organization_id          VARCHAR(36) NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  s3_bucket_name           VARCHAR(100),
  cloudfront_distribution_id VARCHAR(100),
  cloudfront_domain        VARCHAR(255),
  route53_record_id        VARCHAR(100),
  acm_certificate_arn      VARCHAR(255),
  acm_validation_records   JSONB,
  infrastructure_status    VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at               TIMESTAMP NOT NULL DEFAULT now(),
  updated_at               TIMESTAMP NOT NULL DEFAULT now()
);
```

### `infrastructure_status` lifecycle

| Status | Meaning |
|--------|---------|
| `pending` | Row just created; provisioning not yet started |
| `provisioning` | Infra microservice is actively provisioning resources |
| `active` | All resources provisioned; deployment is allowed |
| `failed` | Provisioning failed; re-trigger SNS event to retry |
| `deleting` | Resources are being torn down |

---

## What the Infrastructure Microservice Must Implement

### On `OrganizationRegistered` event receipt:

1. **Create/check** an `organization_settings` row for the org (upsert by `organization_id`)
2. Set `infrastructure_status = 'provisioning'`
3. **Provision S3 bucket**: `s3_bucket_name` — conventionally `tsuru-org-{slug}`
   - The main service uploads `config.json` to this bucket
   - Must be configured for static website hosting or read by CloudFront
4. **Provision CloudFront distribution** pointing at the S3 bucket
   - Store as `cloudfront_distribution_id` and `cloudfront_domain`
5. **Create Route53 DNS** record: `{subdomain}.tsuru.jcampos.dev` → CloudFront
   - Store as `route53_record_id`
6. Set `infrastructure_status = 'active'` on success; `'failed'` on error
7. Write all resource identifiers to `organization_settings`

### ACM custom domain flow (previously in main service, now owned by infra):

These API endpoints were **removed** from the main service. The infra microservice should expose them:

| Endpoint | Previous path | Action |
|----------|--------------|--------|
| Request certificate | `POST /organizations/:id/custom-domain` | ACM certificate request for custom domain, returns DNS validation records |
| Domain status | `GET /organizations/:id/domain-status` | Returns `infrastructureStatus`, `cloudfrontDomain`, `certificateStatus`, `validationRecords` |
| Attach custom domain | `POST /organizations/:id/attach-custom-domain` | Attaches validated ACM cert to CloudFront distribution |

---

## Local Development Notes

- Set `ORGANIZATION_TOPIC_ARN` in `.env` to a real SNS topic ARN for E2E testing
- If `ORGANIZATION_TOPIC_ARN` is unset, `OrganizationEventPublisher` logs a warning and skips publish — org creation still succeeds
- The `organization_settings` table must exist in the shared database before this service starts (created by the infra microservice's migration)
