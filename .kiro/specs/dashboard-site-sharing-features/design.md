# Design Document: Dashboard Site Sharing Features

## Overview

This design implements site sharing features for the dashboard with custom domain support: QR code generation for sharing the organization's public storefront, a button to open the site in a new tab, and custom domain management with DNS-based verification. These features integrate into the existing QuickActionsGrid component on the main dashboard page and add a new Domain Settings page.

The implementation leverages the existing organization context system (via `useOrganization` hook) to access domain configuration (customDomain, domainVerified, subdomain) and construct the site URL using priority logic: verified custom domain takes precedence over subdomain fallback. The QR code generation uses the `qrcode` library (a lightweight, well-maintained solution with no dependencies), while the modal dialog uses the existing Radix UI dialog component already in the project.

Key design decisions:
- URL priority logic: verified custom domain > subdomain fallback
- GitHub-style DNS TXT record verification for domain ownership
- Client-side QR code generation to avoid server dependencies
- Backend DNS lookup using Node.js `dns.promises.resolveTxt()` API
- Integrate seamlessly with existing QuickActionsGrid pattern
- Handle missing organization context gracefully with disabled states
- Provide download functionality using canvas-to-blob conversion
- Store verification token in database for domain ownership validation

## Architecture

### Component Structure

```
Dashboard Page
├── QuickActionsGrid
│   ├── Existing Actions (Add Product, Categories, etc.)
│   ├── QR Code Action (new)
│   └── Open Site Action (new)
│
QR Code Dialog (new component)
├── Dialog (Radix UI)
├── QR Code Canvas
├── Site URL Display
└── Download Button

Domain Settings Page (new)
├── Custom Domain Input
├── Domain Verification Status Badge
├── DNS Instructions Panel
│   ├── TXT Record Name Display
│   ├── Verification Token Display
│   ├── Copy Token Button
│   └── DNS Provider Links
├── Verify Domain Button
└── Remove Domain Button
```

### Data Flow

1. Dashboard page retrieves organization context via `useDefaultOrganization` hook
2. Organization domain configuration is extracted (customDomain, domainVerified, subdomain)
3. Site URL is constructed using priority logic:
   - If customDomain exists AND domainVerified is true: `https://{customDomain}`
   - Otherwise: `https://{subdomain}.tsuru.jcampos.dev`
   - If both unavailable: null
4. QuickActionsGrid receives actions with disabled state based on Site URL availability
5. QR code action opens dialog and generates QR code on mount using Site URL
6. Open site action directly opens new tab with constructed Site URL
7. Domain Settings page allows users to add/update custom domain
8. Backend generates verification token when custom domain is added/updated
9. User adds DNS TXT record with verification token to their domain
10. User clicks "Verify Domain" button
11. Backend performs DNS TXT lookup and validates token
12. If validation succeeds, domainVerified is set to true
13. Dashboard recalculates Site URL to use verified custom domain

### Technology Stack

- **QR Code Generation**: `qrcode` library (v1.5.4+)
  - Lightweight (no dependencies)
  - Canvas-based rendering
  - High browser compatibility
  - Supports error correction levels
- **DNS Verification**: Node.js `dns.promises` module
  - Built-in DNS resolution
  - TXT record lookup support
  - Promise-based API
- **Token Generation**: Node.js `crypto.randomBytes()`
  - Cryptographically secure random generation
  - 32+ character hex strings
- **Modal Dialog**: Existing Radix UI Dialog component
- **Icons**: Lucide React (QrCode, ExternalLink, Globe, CheckCircle, AlertCircle icons)
- **State Management**: React useState for dialog open/close state
- **Organization Context**: Existing `useOrganization` hook

## Components and Interfaces

### 0. URL Construction Utility

**Location**: `dashboard/src/utils/siteUrl.ts`

**Purpose**: Centralized logic for constructing site URL based on domain priority

**Function Signature**:
```typescript
interface DomainConfig {
  customDomain?: string | null;
  domainVerified?: boolean;
  subdomain?: string | null;
}

function constructSiteUrl(config: DomainConfig): string | null {
  // Priority 1: Verified custom domain
  if (config.customDomain && config.domainVerified) {
    return `https://${config.customDomain}`;
  }
  
  // Priority 2: Subdomain fallback
  if (config.subdomain) {
    return `https://${config.subdomain}.tsuru.jcampos.dev`;
  }
  
  // No valid domain configuration
  return null;
}
```

**Key Responsibilities**:
- Implement URL priority logic
- Handle null/undefined domain values
- Return null when no valid configuration exists
- Used by all components that need Site URL

### 1. QRCodeDialog Component

**Location**: `dashboard/src/components/dashboard/QRCodeDialog.tsx`

**Purpose**: Display QR code in a modal dialog with download capability

**Props Interface**:
```typescript
interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteUrl: string;
  subdomain: string;
}
```

**Key Responsibilities**:
- Generate QR code on mount using canvas element
- Display QR code with site URL text
- Provide download functionality (PNG format)
- Handle responsive layout for mobile/desktop
- Manage canvas ref and QR code generation lifecycle

**Implementation Details**:
- Uses `useEffect` to generate QR code when dialog opens
- Canvas element with ref for QR code rendering
- Download button converts canvas to blob and triggers download
- Error correction level: 'M' (medium, 15% recovery)
- QR code size: 256x256 pixels (suitable for screen and print)
- Uses `constructSiteUrl()` utility to get URL

### 2. Dashboard Page Updates

**Location**: `dashboard/src/pages/Dashboard.tsx`

**Changes Required**:
- Import QRCodeDialog component
- Import `constructSiteUrl` utility
- Add state for QR dialog open/close
- Add two new actions to quickActions array:
  - QR Code action
  - Open Site action
- Extract domain configuration from organization context
- Construct site URL using `constructSiteUrl()` utility
- Pass disabled state to actions when Site URL is null

**New State**:
```typescript
const [qrDialogOpen, setQrDialogOpen] = useState(false);
```

**Site URL Construction**:
```typescript
const siteUrl = organization 
  ? constructSiteUrl({
      customDomain: organization.customDomain,
      domainVerified: organization.domainVerified,
      subdomain: organization.subdomain
    })
  : null;
```

### 3. QuickActionsGrid Integration

**Location**: `dashboard/src/components/dashboard/QuickActionsGrid.tsx`

**No Changes Required**: The existing component already supports:
- `disabled` prop on actions
- Icon rendering via LucideIcon
- Click handlers
- Responsive grid layout

**New Actions Configuration**:
```typescript
{
  id: 'qr-code',
  label: t('dashboard.quickActions.qrCode'),
  description: t('dashboard.quickActions.qrCodeDesc'),
  icon: QrCode,
  onClick: () => setQrDialogOpen(true),
  disabled: !siteUrl,
},
{
  id: 'open-site',
  label: t('dashboard.quickActions.openSite'),
  description: t('dashboard.quickActions.openSiteDesc'),
  icon: ExternalLink,
  onClick: () => siteUrl && window.open(siteUrl, '_blank', 'noopener,noreferrer'),
  disabled: !siteUrl,
}
```

### 4. Domain Settings Page

**Location**: `dashboard/src/pages/settings/DomainSettings.tsx`

**Purpose**: Manage custom domain configuration and verification

**Key Components**:
- Custom domain input field with validation
- Domain verification status badge (verified/not verified)
- DNS TXT record instructions panel
- Verification token display with copy button
- "Verify Domain" button to trigger DNS lookup
- "Remove Domain" button with confirmation dialog

**State Management**:
```typescript
const [customDomain, setCustomDomain] = useState('');
const [verificationToken, setVerificationToken] = useState('');
const [domainVerified, setDomainVerified] = useState(false);
const [isVerifying, setIsVerifying] = useState(false);
const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
```

**Domain Validation**:
```typescript
function validateDomain(domain: string): boolean {
  // Basic domain format validation
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  return domainRegex.test(domain);
}
```

**API Integration**:
- `PUT /api/organizations/:id/domain` - Add/update custom domain
- `POST /api/organizations/:id/domain/verify` - Verify domain ownership
- `DELETE /api/organizations/:id/domain` - Remove custom domain

### 5. Backend API Endpoints

**Location**: `server/src/controllers/OrganizationController.ts`

**New Endpoints**:

#### PUT /api/organizations/:id/domain
```typescript
async updateCustomDomain(req: Request, res: Response) {
  const { id } = req.params;
  const { customDomain } = req.body;
  
  // Validate domain format
  if (!validateDomain(customDomain)) {
    return res.status(400).json({ error: 'Invalid domain format' });
  }
  
  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Update organization
  const org = await organizationService.update(id, {
    customDomain,
    domainVerified: false,
    verificationToken
  });
  
  res.json({ organization: org, verificationToken });
}
```

#### POST /api/organizations/:id/domain/verify
```typescript
async verifyCustomDomain(req: Request, res: Response) {
  const { id } = req.params;
  const org = await organizationService.getById(id);
  
  if (!org.customDomain || !org.verificationToken) {
    return res.status(400).json({ error: 'No domain to verify' });
  }
  
  try {
    // Perform DNS TXT lookup
    const records = await dns.promises.resolveTxt(
      `_tsuru-verification.${org.customDomain}`
    );
    
    // Check if any record matches the verification token
    const verified = records.some(record => 
      record.join('') === org.verificationToken
    );
    
    if (verified) {
      await organizationService.update(id, { domainVerified: true });
      res.json({ verified: true, message: 'Domain verified successfully' });
    } else {
      res.status(400).json({ 
        verified: false, 
        error: 'Verification token mismatch',
        expected: org.verificationToken,
        found: records
      });
    }
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      res.status(400).json({ 
        verified: false, 
        error: 'DNS TXT record not found. Please add the record and wait for DNS propagation.' 
      });
    } else {
      res.status(500).json({ 
        verified: false, 
        error: 'DNS lookup failed. Please try again.' 
      });
    }
  }
}
```

#### DELETE /api/organizations/:id/domain
```typescript
async removeCustomDomain(req: Request, res: Response) {
  const { id } = req.params;
  
  const org = await organizationService.update(id, {
    customDomain: null,
    domainVerified: false,
    verificationToken: null
  });
  
  res.json({ organization: org });
}
```

### 6. Database Schema Updates

**Location**: `server/src/entities/Organization.ts`

**New Fields** (already exist in schema):
```typescript
customDomain: varchar("custom_domain", { length: 255 }).unique(),
domainVerified: boolean("domain_verified").default(false),
```

**Additional Field Needed**:
```typescript
verificationToken: varchar("verification_token", { length: 64 }),
```

## Data Models

### Organization Interface (Updated)

```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;  // Default subdomain (fallback)
  customDomain?: string;  // User's custom domain
  domainVerified?: boolean;  // Whether custom domain is verified
  verificationToken?: string;  // Token for DNS verification
  ownerId: string;
  onboardingStep?: number;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Key Fields**:
- `subdomain` - Default subdomain for fallback URL
- `customDomain` - User-configured custom domain
- `domainVerified` - Boolean indicating if custom domain ownership is verified
- `verificationToken` - Cryptographically secure token for DNS verification

### Domain Configuration Interface

```typescript
interface DomainConfig {
  customDomain?: string | null;
  domainVerified?: boolean;
  subdomain?: string | null;
}
```

### QR Code Configuration

```typescript
interface QRCodeOptions {
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';  // Use 'M' (15% recovery)
  width: number;  // 256 pixels
  margin: number;  // 4 modules (default)
  color: {
    dark: string;   // '#000000' (black)
    light: string;  // '#FFFFFF' (white)
  };
}
```

### Site URL Format

**Priority Logic**:
1. If `customDomain` exists AND `domainVerified` is true: `https://{customDomain}`
2. Otherwise, if `subdomain` exists: `https://{subdomain}.tsuru.jcampos.dev`
3. Otherwise: `null`

**Examples**:
- Verified custom domain: `https://shop.example.com`
- Unverified custom domain (falls back): `https://mystore.tsuru.jcampos.dev`
- Subdomain only: `https://demo-shop.tsuru.jcampos.dev`

**Validation**: 
- Custom domain must match domain format regex
- Subdomain must be non-null and non-empty string

### DNS Verification Format

**TXT Record Name**: `_tsuru-verification.{customDomain}`

**TXT Record Value**: `{verificationToken}` (64-character hex string)

**Example**:
```
_tsuru-verification.shop.example.com TXT "a1b2c3d4e5f6...xyz"
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: URL Priority Logic - Verified Custom Domain

*For any* domain configuration where customDomain is non-empty AND domainVerified is true, the constructed Site_URL should equal `https://{customDomain}` exactly

**Validates: Requirements 1.1**

### Property 2: URL Priority Logic - Subdomain Fallback

*For any* domain configuration where customDomain is null OR domainVerified is false, AND subdomain is non-empty, the constructed Site_URL should equal `https://{subdomain}.tsuru.jcampos.dev`

**Validates: Requirements 1.2**

### Property 3: URL Construction Reactivity

*For any* sequence of organization context updates, when the domain configuration changes, the Site_URL should be recalculated to reflect the current priority logic

**Validates: Requirements 1.5**

### Property 4: QR Code Round-Trip Verification

*For any* valid Site_URL, when a QR code is generated for that URL, decoding that QR code should return the exact same URL

**Validates: Requirements 2.1, 2.4**

### Property 5: Component URL Consistency

*For any* domain configuration, all components (QR code generator, open site button) should use the same Site_URL as determined by the priority logic

**Validates: Requirements 2.2, 4.2**

### Property 6: Download Filename Format

*For any* subdomain string, when the download button is clicked, the generated filename should match the pattern `qr-code-{subdomain}.png` where {subdomain} is the exact subdomain value

**Validates: Requirements 3.4**

### Property 7: Open Site Security Parameters

*For any* valid site URL, when the open site action is triggered, window.open should be called with the URL as the first parameter and the string 'noopener,noreferrer' included in the features parameter

**Validates: Requirements 4.1, 4.4**

### Property 8: Action State Based on URL Availability

*For any* organization context, both site sharing actions (QR code and open site) should be enabled if and only if the Site_URL is non-null

**Validates: Requirements 5.5, 5.6**

### Property 9: Domain Format Validation

*For any* string input, the domain validation function should return true if and only if the string matches valid domain format (alphanumeric with dots and hyphens in appropriate positions)

**Validates: Requirements 7.2, 7.3**

### Property 10: Domain Save Triggers Verification Reset

*For any* valid custom domain, when it is saved to an organization, domainVerified should be set to false and a new verificationToken should be generated

**Validates: Requirements 7.6, 8.1, 12.6**

### Property 11: Verification Token Format

*For any* generated verification token, it should be a hexadecimal string of at least 32 characters

**Validates: Requirements 8.2**

### Property 12: Verification Token Persistence

*For any* organization with a custom domain, the verification token should remain constant across reads until the custom domain is changed or removed

**Validates: Requirements 8.3, 8.5**

### Property 13: DNS Record Format Display

*For any* custom domain and verification token, the displayed DNS record format should match the pattern `_tsuru-verification.{customDomain} TXT {verificationToken}`

**Validates: Requirements 9.5**

### Property 14: DNS Lookup Hostname Construction

*For any* custom domain, when domain verification is triggered, the DNS TXT lookup should be performed for the hostname `_tsuru-verification.{customDomain}`

**Validates: Requirements 10.2**

### Property 15: DNS Verification Success Condition

*For any* organization with a custom domain, when the DNS TXT record value matches the stored verification token exactly, domainVerified should be set to true

**Validates: Requirements 10.3**

### Property 16: DNS Verification Failure Handling

*For any* organization with a custom domain, when the DNS TXT record is not found OR the value does not match the verification token, domainVerified should remain false and an error message should be displayed

**Validates: Requirements 10.4**

### Property 17: Domain Verification Status Display

*For any* organization with a custom domain, the Domain Settings page should display the current verification status (verified or not verified) based on the domainVerified field

**Validates: Requirements 11.1**

### Property 18: Domain Removal Cleanup

*For any* organization with a custom domain, when the domain is removed, both customDomain and domainVerified should be set to null/false

**Validates: Requirements 12.3**

### Property 19: URL Fallback After Domain Removal

*For any* organization with both custom domain and subdomain, when the custom domain is removed, the Site_URL should revert to using the subdomain format

**Validates: Requirements 12.4**

## Error Handling

### Missing Organization Context

**Scenario**: User accesses dashboard before organization data loads or when organization has no valid domain configuration

**Handling**:
- Both actions disabled via `disabled` prop
- QuickActionsGrid displays disabled visual state (reduced opacity, no hover effects)
- No error thrown - graceful degradation
- Actions remain in DOM but non-interactive

### No Valid Domain Configuration

**Scenario**: Organization has no subdomain and no verified custom domain

**Handling**:
- `constructSiteUrl()` returns null
- Both site sharing actions disabled
- QR code dialog shows error message if somehow opened
- Open site button remains disabled
- No errors thrown

### QR Code Generation Failure

**Scenario**: QR code library fails to generate code (e.g., invalid URL format)

**Handling**:
- Catch error in useEffect
- Display error message in dialog: "Failed to generate QR code"
- Log error to console for debugging
- Close button remains functional
- Download button disabled when generation fails

### Download Failure

**Scenario**: Canvas-to-blob conversion fails or download trigger fails

**Handling**:
- Catch error in download handler
- Display toast notification: "Failed to download QR code"
- Log error to console
- Dialog remains open for retry
- Fallback: User can screenshot the QR code

### Invalid Custom Domain Format

**Scenario**: User enters invalid domain format in Domain Settings

**Handling**:
- Client-side validation rejects invalid format
- Display error message: "Invalid domain format. Please enter a valid domain (e.g., shop.example.com)"
- Prevent API call until valid format entered
- Save button disabled for invalid input

### DNS Lookup Network Error

**Scenario**: DNS lookup fails due to network connectivity issues

**Handling**:
- Catch network error in backend
- Return 500 status with error message
- Frontend displays: "DNS lookup failed. Please check your connection and try again."
- Log error for debugging
- Verification status remains unchanged

### DNS TXT Record Not Found

**Scenario**: User hasn't added TXT record or DNS hasn't propagated

**Handling**:
- Backend catches ENOTFOUND or ENODATA error
- Return 400 status with descriptive error
- Frontend displays: "DNS TXT record not found. Please add the record and wait for DNS propagation (can take up to 48 hours)."
- Show troubleshooting tips
- Verification status remains false

### DNS TXT Record Value Mismatch

**Scenario**: TXT record exists but value doesn't match verification token

**Handling**:
- Backend compares record value to stored token
- Return 400 status with expected and actual values
- Frontend displays: "Verification token mismatch. Expected: {expected}, Found: {found}"
- Provide copy button to copy correct token
- Verification status remains false

### DNS Lookup Timeout

**Scenario**: DNS lookup takes too long and times out

**Handling**:
- Backend DNS operation times out
- Return 500 status with timeout message
- Frontend displays: "DNS lookup timed out. DNS propagation may still be in progress. Please try again in a few minutes."
- Verification status remains unchanged

### Custom Domain Already in Use

**Scenario**: User tries to add a domain already claimed by another organization

**Handling**:
- Database unique constraint prevents duplicate
- Backend catches constraint violation
- Return 400 status with error message
- Frontend displays: "This domain is already in use by another organization"
- Input remains editable for correction

### Window.open Blocked

**Scenario**: Browser blocks popup/new tab (popup blocker)

**Handling**:
- No error handling needed - browser shows native popup blocked notification
- User can allow popups and retry
- Action remains enabled and functional

## Testing Strategy

### Unit Testing Approach

Unit tests will focus on specific examples, edge cases, and component integration:

**URL Construction Utility**:
- Verified custom domain returns custom domain URL
- Unverified custom domain falls back to subdomain
- Null custom domain uses subdomain
- Both null returns null
- Empty strings treated as null

**QRCodeDialog Component**:
- Renders with provided props
- Displays site URL text
- Download button exists and is clickable
- Close button dismisses dialog
- Canvas element is present in DOM
- Error message shown when URL is null

**Dashboard Integration**:
- QR code action appears in QuickActionsGrid
- Open site action appears in QuickActionsGrid
- Correct icons used (QrCode, ExternalLink)
- Actions have descriptive labels
- Actions disabled when Site_URL is null
- Actions enabled when Site_URL is valid

**Domain Settings Page**:
- Custom domain input field renders
- Verification status badge displays correctly
- DNS instructions panel shows when domain unverified
- DNS instructions hidden when domain verified
- Copy button copies token to clipboard
- Verify button triggers DNS lookup
- Remove button shows confirmation dialog
- Domain validation rejects invalid formats

**Backend API Endpoints**:
- PUT /domain validates domain format
- PUT /domain generates verification token
- PUT /domain sets domainVerified to false
- POST /domain/verify performs DNS lookup
- POST /domain/verify validates token match
- POST /domain/verify sets domainVerified on success
- DELETE /domain clears domain fields

**Edge Cases**:
- Custom domain is null: falls back to subdomain
- Custom domain exists but domainVerified is false: falls back to subdomain
- Subdomain is null: Site_URL is null
- Both custom domain and subdomain null: Site_URL is null
- Organization context is null: actions disabled
- QR code generation fails: error message displayed
- Download fails: toast notification shown
- DNS lookup fails: appropriate error message
- DNS record not found: helpful troubleshooting message
- DNS record value mismatch: shows expected vs actual
- Invalid domain format: validation error displayed

### Property-Based Testing Approach

Property tests will verify universal behaviors across all inputs using **fast-check** (JavaScript property-based testing library):

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property reference
- Tag format: `Feature: dashboard-site-sharing-features, Property {number}: {property_text}`

**Property Test Implementations**:

1. **QR Code Round-Trip** (Property 1)
   - Generate random valid subdomains (alphanumeric, hyphens, 3-63 chars)
   - Construct URL from subdomain
   - Generate QR code
   - Decode QR code using QR reader library
   - Assert decoded URL matches original URL

2. **URL Construction Format** (Property 2)
   - Generate random valid subdomains
   - Construct URL using component logic
   - Assert URL matches regex: `^https://[a-z0-9-]+\.tsuru\.tsuru\.dev$`
   - Assert subdomain portion matches input exactly

3. **Dialog URL Display** (Property 3)
   - Generate random site URLs
   - Render QRCodeDialog with URL
   - Query rendered content for URL text
   - Assert URL text is present and matches input

4. **Download Filename Format** (Property 4)
   - Generate random subdomains
   - Mock download trigger
   - Simulate download button click
   - Assert filename matches pattern: `qr-code-{subdomain}.png`

5. **Open Site Security Parameters** (Property 5)
   - Generate random valid site URLs
   - Mock window.open
   - Trigger open site action
   - Assert window.open called with correct URL
   - Assert features parameter includes 'noopener' and 'noreferrer'

6. **Action State Based on Subdomain** (Property 6)
   - Generate random organization contexts (with/without subdomain)
   - Render Dashboard with context
   - Query action disabled states
   - Assert both actions disabled when subdomain missing
   - Assert both actions enabled when subdomain present

7. **Context Reactivity** (Property 7)
   - Start with organization context without subdomain
   - Render Dashboard
   - Assert actions disabled
   - Update context to include valid subdomain
   - Assert actions enabled

**Test Libraries**:
- **fast-check**: Property-based testing framework
- **@testing-library/react**: Component rendering and queries
- **vitest**: Test runner (already in project)
- **jsdom**: DOM environment for tests

### Integration Testing

Integration tests will verify the complete user workflows:

1. **QR Code Generation Workflow**:
   - User clicks QR code action
   - Dialog opens with QR code
   - User clicks download
   - File downloads with correct name

2. **Open Site Workflow**:
   - User clicks open site action
   - New tab opens with correct URL
   - Security parameters applied

3. **Disabled State Workflow**:
   - Dashboard loads without subdomain
   - Actions are disabled
   - User cannot interact with actions
   - No errors thrown

### Manual Testing Checklist

- [ ] QR code scans correctly on mobile devices
- [ ] Downloaded QR code prints clearly
- [ ] Dialog is responsive on mobile screens
- [ ] Disabled actions show appropriate visual feedback
- [ ] Tooltips display on disabled actions (if implemented)
- [ ] New tab opens correctly in different browsers
- [ ] QR code displays correctly in light/dark themes

1. **URL Priority Logic - Verified Custom Domain** (Property 1)
   - Generate random valid custom domains
   - Set domainVerified to true
   - Construct URL using utility
   - Assert URL equals `https://{customDomain}`

2. **URL Priority Logic - Subdomain Fallback** (Property 2)
   - Generate random subdomains and custom domains
   - Set domainVerified to false OR customDomain to null
   - Construct URL using utility
   - Assert URL equals `https://{subdomain}.tsuru.jcampos.dev`

3. **URL Construction Reactivity** (Property 3)
   - Generate sequence of organization context updates
   - Render Dashboard with each context
   - Assert Site_URL updates according to priority logic

4. **QR Code Round-Trip** (Property 4)
   - Generate random valid Site URLs
   - Generate QR code
   - Decode QR code using QR reader library
   - Assert decoded URL matches original URL

5. **Component URL Consistency** (Property 5)
   - Generate random domain configurations
   - Render all components (QR dialog, open site button)
   - Extract URL used by each component
   - Assert all components use same URL

6. **Download Filename Format** (Property 6)
   - Generate random subdomains
   - Mock download trigger
   - Simulate download button click
   - Assert filename matches pattern: `qr-code-{subdomain}.png`

7. **Open Site Security Parameters** (Property 7)
   - Generate random valid site URLs
   - Mock window.open
   - Trigger open site action
   - Assert window.open called with correct URL
   - Assert features parameter includes 'noopener' and 'noreferrer'

8. **Action State Based on URL Availability** (Property 8)
   - Generate random organization contexts (with/without valid domain config)
   - Render Dashboard with context
   - Query action disabled states
   - Assert both actions disabled when Site_URL is null
   - Assert both actions enabled when Site_URL is non-null

9. **Domain Format Validation** (Property 9)
   - Generate random strings (valid and invalid domains)
   - Run validation function
   - Assert valid domains return true
   - Assert invalid domains return false

10. **Domain Save Triggers Verification Reset** (Property 10)
    - Generate random valid custom domains
    - Save domain to organization
    - Assert domainVerified is false
    - Assert verificationToken is generated and non-empty

11. **Verification Token Format** (Property 11)
    - Generate many verification tokens
    - Assert each token is hexadecimal string
    - Assert each token is at least 32 characters

12. **Verification Token Persistence** (Property 12)
    - Generate random custom domain
    - Save domain and get token
    - Retrieve organization multiple times
    - Assert token remains constant across reads

13. **DNS Record Format Display** (Property 13)
    - Generate random custom domains and tokens
    - Render DNS instructions
    - Extract displayed DNS record format
    - Assert format matches `_tsuru-verification.{customDomain} TXT {token}`

14. **DNS Lookup Hostname Construction** (Property 14)
    - Generate random custom domains
    - Mock DNS lookup function
    - Trigger domain verification
    - Assert DNS lookup called with `_tsuru-verification.{customDomain}`

15. **DNS Verification Success Condition** (Property 15)
    - Generate random custom domains and tokens
    - Mock DNS response with matching token
    - Trigger verification
    - Assert domainVerified set to true

16. **DNS Verification Failure Handling** (Property 16)
    - Generate random custom domains and tokens
    - Mock DNS response with non-matching token OR no record
    - Trigger verification
    - Assert domainVerified remains false
    - Assert error message displayed

17. **Domain Verification Status Display** (Property 17)
    - Generate random organizations with custom domains
    - Set domainVerified to random boolean
    - Render Domain Settings page
    - Assert displayed status matches domainVerified value

18. **Domain Removal Cleanup** (Property 18)
    - Generate random organizations with custom domains
    - Trigger domain removal
    - Assert customDomain set to null
    - Assert domainVerified set to false

19. **URL Fallback After Domain Removal** (Property 19)
    - Generate random organizations with both custom domain and subdomain
    - Construct initial URL (should use custom domain if verified)
    - Remove custom domain
    - Construct new URL
    - Assert new URL uses subdomain format

**Test Libraries**:
- **fast-check**: Property-based testing framework
- **@testing-library/react**: Component rendering and queries
- **vitest**: Test runner (already in project)
- **jsdom**: DOM environment for tests
- **msw**: Mock Service Worker for API mocking

### Integration Testing

Integration tests will verify the complete user workflows:

1. **QR Code Generation Workflow**:
   - User clicks QR code action
   - Dialog opens with QR code
   - QR code encodes correct URL based on domain priority
   - User clicks download
   - File downloads with correct name

2. **Open Site Workflow**:
   - User clicks open site action
   - New tab opens with correct URL based on domain priority
   - Security parameters applied

3. **Custom Domain Addition Workflow**:
   - User navigates to Domain Settings
   - User enters custom domain
   - Domain is validated
   - User saves domain
   - Verification token is generated
   - DNS instructions displayed
   - domainVerified is false

4. **Domain Verification Workflow**:
   - User adds DNS TXT record
   - User clicks "Verify Domain"
   - Backend performs DNS lookup
   - If record matches: domainVerified set to true, success message shown
   - If record doesn't match: error message with troubleshooting shown

5. **Domain Removal Workflow**:
   - User clicks "Remove Domain"
   - Confirmation dialog appears
   - User confirms
   - Domain fields cleared
   - Site URL reverts to subdomain

6. **URL Priority Workflow**:
   - Organization has subdomain only: Site URL uses subdomain
   - User adds custom domain: Site URL still uses subdomain (not verified)
   - User verifies domain: Site URL switches to custom domain
   - User removes domain: Site URL reverts to subdomain

7. **Disabled State Workflow**:
   - Dashboard loads without valid domain configuration
   - Actions are disabled
   - User cannot interact with actions
   - No errors thrown

### Manual Testing Checklist

- [ ] QR code scans correctly on mobile devices
- [ ] Downloaded QR code prints clearly
- [ ] Dialog is responsive on mobile screens
- [ ] Disabled actions show appropriate visual feedback
- [ ] New tab opens correctly in different browsers
- [ ] QR code displays correctly in light/dark themes
- [ ] Custom domain input validates correctly
- [ ] DNS instructions are clear and accurate
- [ ] Verification token can be copied to clipboard
- [ ] DNS verification works with real DNS records
- [ ] Error messages are helpful and actionable
- [ ] Domain removal confirmation prevents accidental deletion
- [ ] URL priority logic works correctly in all scenarios
- [ ] Site URL updates immediately after domain verification
