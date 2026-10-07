# Implementation Plan: Dashboard Site Sharing Features

## Overview

This implementation adds site sharing features with custom domain support to the dashboard: QR code generation for sharing the organization's public storefront, a button to open the site in a new tab, and custom domain management with DNS-based verification. The implementation uses TypeScript/React with the existing QuickActionsGrid component pattern, integrates the `qrcode` library for client-side QR generation, leverages existing Radix UI dialog components, and implements GitHub-style DNS TXT record verification for domain ownership.

Key features:
- URL priority logic: verified custom domain > subdomain fallback
- DNS TXT record verification for domain ownership
- Domain Settings page for managing custom domains
- Backend API endpoints for domain management and verification
- Expanded property-based tests covering all 19 correctness properties

## Tasks

- [x] 1. Database migration for verificationToken field
  - Add `verificationToken` field to organizations table: `varchar("verification_token", { length: 64 })`
  - Create and run migration script
  - Update Organization TypeScript type to include verificationToken field
  - _Requirements: 8.1, 8.3, 8.5_

- [x] 2. Install dependencies and set up utilities
  - Install `qrcode` library (v1.5.4+) and its TypeScript types
  - Install `fast-check` for property-based testing
  - Verify Radix UI Dialog is available in dependencies
  - Verify Node.js `dns.promises` module is available (built-in)
  - _Requirements: 2.1, 2.5_

- [ ] 3. Create URL construction utility
  - [x] 3.1 Create utility file and implement priority logic
    - Create `dashboard/src/utils/siteUrl.ts`
    - Define `DomainConfig` interface with customDomain, domainVerified, subdomain fields
    - Implement `constructSiteUrl()` function with priority logic: verified custom domain > subdomain fallback
    - Handle null/undefined domain values gracefully
    - Return null when no valid configuration exists
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 3.2 Write property test for URL priority logic - verified custom domain
    - **Property 1: URL Priority Logic - Verified Custom Domain**
    - **Validates: Requirements 1.1**
    - Generate random valid custom domains with domainVerified=true, verify URL equals https://{customDomain}
  
  - [ ]* 3.3 Write property test for URL priority logic - subdomain fallback
    - **Property 2: URL Priority Logic - Subdomain Fallback**
    - **Validates: Requirements 1.2**
    - Generate random configs with unverified/null custom domain, verify URL uses subdomain format

- [ ] 4. Create QRCodeDialog component
  - [x] 4.1 Create component file and basic structure
    - Create `dashboard/src/components/dashboard/QRCodeDialog.tsx`
    - Define `QRCodeDialogProps` interface with open, onOpenChange, siteUrl, subdomain props
    - Set up Dialog component from Radix UI with responsive layout
    - _Requirements: 3.1, 3.6_
  
  - [x] 4.2 Implement QR code generation logic
    - Add canvas element with ref for QR code rendering
    - Implement useEffect to generate QR code when dialog opens using siteUrl prop
    - Configure QR code options: error correction level 'M', size 256x256
    - Handle QR code generation errors with error message display
    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  
  - [x] 4.3 Add URL display and download functionality
    - Display site URL as text below QR code
    - Implement download button with canvas-to-blob conversion
    - Generate filename in format `qr-code-{subdomain}.png`
    - Handle download errors with toast notification
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ]* 4.4 Write property test for QR code round-trip verification
    - **Property 4: QR Code Round-Trip Verification**
    - **Validates: Requirements 2.1, 2.4**
    - Generate random valid Site URLs, create QR codes, decode and verify URL matches
  
  - [ ]* 4.5 Write property test for download filename format
    - **Property 6: Download Filename Format**
    - **Validates: Requirements 3.4**
    - Generate random subdomains, mock download, verify filename pattern

- [ ] 5. Update Dashboard page with URL priority logic
  - [x] 5.1 Update Dashboard component with new state and URL construction
    - Import QRCodeDialog, QrCode, and ExternalLink icons
    - Import `constructSiteUrl` utility
    - Add state for QR dialog open/close: `const [qrDialogOpen, setQrDialogOpen] = useState(false)`
    - Extract customDomain, domainVerified, subdomain from organization context
    - Construct site URL using `constructSiteUrl()` utility
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 5.2 Add QR code and open site actions to quickActions array
    - Add QR code action with QrCode icon, opens dialog, disabled when siteUrl is null
    - Add open site action with ExternalLink icon, opens new tab with noopener/noreferrer, disabled when siteUrl is null
    - Position actions appropriately in the grid
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.5, 5.6_
  
  - [x] 5.3 Render QRCodeDialog component
    - Add QRCodeDialog component to Dashboard JSX
    - Pass qrDialogOpen, setQrDialogOpen, siteUrl, and subdomain props
    - Ensure dialog handles null siteUrl gracefully
    - _Requirements: 3.1, 5.1, 5.2, 6.1, 6.2_
  
  - [ ]* 5.4 Write property test for URL construction reactivity
    - **Property 3: URL Construction Reactivity**
    - **Validates: Requirements 1.5**
    - Generate sequence of organization context updates, verify Site_URL recalculates correctly
  
  - [ ]* 5.5 Write property test for component URL consistency
    - **Property 5: Component URL Consistency**
    - **Validates: Requirements 2.2, 4.2**
    - Generate random domain configs, verify all components use same Site_URL
  
  - [ ]* 5.6 Write property test for action state based on URL availability
    - **Property 8: Action State Based on URL Availability**
    - **Validates: Requirements 5.5, 5.6**
    - Generate random organization contexts, verify both actions disabled when Site_URL is null

- [x] 6. Add translation keys for all features
  - Add `dashboard.quickActions.qrCode` translation key
  - Add `dashboard.quickActions.qrCodeDesc` translation key
  - Add `dashboard.quickActions.openSite` translation key
  - Add `dashboard.quickActions.openSiteDesc` translation key
  - Add `settings.domain.*` translation keys for Domain Settings page
  - Add error message translations for QR generation and DNS verification failures
  - Add Spanish translations for all new keys
  - _Requirements: 5.3, 5.4_

- [ ] 7. Checkpoint - Verify core site sharing functionality
  - Ensure all tests pass, ask the user if questions arise.
  - Manually test QR code generation in browser
  - Verify actions appear in QuickActionsGrid
  - Test URL priority logic with different domain configurations
  - Test disabled states when no valid domain configuration exists

- [ ] 8. Implement backend domain validation utility
  - [ ] 8.1 Create domain validation function
    - Create `server/src/utils/domainValidation.ts`
    - Implement `validateDomain()` function with regex validation
    - Export function for use in controllers
    - _Requirements: 7.2, 7.3_
  
  - [ ]* 8.2 Write property test for domain format validation
    - **Property 9: Domain Format Validation**
    - **Validates: Requirements 7.2, 7.3**
    - Generate random strings (valid and invalid domains), verify validation function returns correct boolean

- [ ] 9. Implement backend API endpoints for domain management
  - [ ] 9.1 Add PUT /api/organizations/:id/domain endpoint
    - Add endpoint to OrganizationController
    - Validate domain format using validation utility
    - Generate verification token using crypto.randomBytes(32).toString('hex')
    - Update organization with customDomain, domainVerified=false, verificationToken
    - Return organization and verificationToken in response
    - _Requirements: 7.1, 7.4, 7.5, 7.6, 8.1, 8.2_
  
  - [ ] 9.2 Add POST /api/organizations/:id/domain/verify endpoint
    - Add endpoint to OrganizationController
    - Retrieve organization and verify customDomain and verificationToken exist
    - Perform DNS TXT lookup for `_tsuru-verification.{customDomain}` using dns.promises.resolveTxt()
    - Check if any TXT record matches verificationToken
    - If match: set domainVerified=true, return success
    - If no match: return error with expected and found values
    - Handle DNS errors (ENOTFOUND, ENODATA, timeout) with appropriate error messages
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 13.1, 13.2, 13.3, 13.4_
  
  - [ ] 9.3 Add DELETE /api/organizations/:id/domain endpoint
    - Add endpoint to OrganizationController
    - Update organization to set customDomain=null, domainVerified=false, verificationToken=null
    - Return updated organization in response
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ]* 9.4 Write property test for domain save triggers verification reset
    - **Property 10: Domain Save Triggers Verification Reset**
    - **Validates: Requirements 7.6, 8.1, 12.6**
    - Generate random valid custom domains, save to organization, verify domainVerified=false and verificationToken generated
  
  - [ ]* 9.5 Write property test for verification token format
    - **Property 11: Verification Token Format**
    - **Validates: Requirements 8.2**
    - Generate many verification tokens, verify each is hexadecimal string of at least 32 characters
  
  - [ ]* 9.6 Write property test for verification token persistence
    - **Property 12: Verification Token Persistence**
    - **Validates: Requirements 8.3, 8.5**
    - Generate random custom domain, save and get token, retrieve organization multiple times, verify token remains constant

- [ ] 10. Create Domain Settings page
  - [ ] 10.1 Create page file and basic structure
    - Create `dashboard/src/pages/settings/DomainSettings.tsx`
    - Set up state for customDomain, verificationToken, domainVerified, isVerifying, showRemoveConfirm
    - Fetch organization data and populate state on mount
    - _Requirements: 7.1, 11.1_
  
  - [ ] 10.2 Implement custom domain input and validation
    - Add input field for custom domain with validation
    - Implement client-side domain format validation
    - Display validation error messages for invalid formats
    - Add save button that calls PUT /api/organizations/:id/domain
    - Handle API response and update state with verificationToken
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 10.3 Implement DNS verification instructions panel
    - Display DNS TXT record name: `_tsuru-verification.{customDomain}`
    - Display DNS TXT record value: verificationToken
    - Show expected DNS record format: `_tsuru-verification.{customDomain} TXT {verificationToken}`
    - Add copy button to copy verificationToken to clipboard
    - Provide links to common DNS provider documentation
    - Show panel only when domainVerified is false
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ] 10.4 Implement domain verification button and status display
    - Add "Verify Domain" button that calls POST /api/organizations/:id/domain/verify
    - Display verification status badge (verified/not verified) based on domainVerified
    - Show success message when verification succeeds
    - Show error messages with troubleshooting guidance when verification fails
    - Handle DNS lookup errors (not found, mismatch, timeout, network error)
    - Display loading state during verification
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ] 10.5 Implement domain removal functionality
    - Add "Remove Domain" button that shows confirmation dialog
    - Implement confirmation dialog with clear warning message
    - Call DELETE /api/organizations/:id/domain on confirmation
    - Update state to clear customDomain, domainVerified, verificationToken
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ]* 10.6 Write property test for DNS record format display
    - **Property 13: DNS Record Format Display**
    - **Validates: Requirements 9.5**
    - Generate random custom domains and tokens, render DNS instructions, verify format matches pattern
  
  - [ ]* 10.7 Write property test for DNS lookup hostname construction
    - **Property 14: DNS Lookup Hostname Construction**
    - **Validates: Requirements 10.2**
    - Generate random custom domains, mock DNS lookup, trigger verification, verify hostname is correct
  
  - [ ]* 10.8 Write property test for DNS verification success condition
    - **Property 15: DNS Verification Success Condition**
    - **Validates: Requirements 10.3**
    - Generate random domains and tokens, mock DNS response with matching token, verify domainVerified=true
  
  - [ ]* 10.9 Write property test for DNS verification failure handling
    - **Property 16: DNS Verification Failure Handling**
    - **Validates: Requirements 10.4**
    - Generate random domains and tokens, mock DNS response with mismatch/not found, verify domainVerified=false and error shown
  
  - [ ]* 10.10 Write property test for domain verification status display
    - **Property 17: Domain Verification Status Display**
    - **Validates: Requirements 11.1**
    - Generate random organizations with custom domains, set random domainVerified, verify displayed status matches
  
  - [ ]* 10.11 Write property test for domain removal cleanup
    - **Property 18: Domain Removal Cleanup**
    - **Validates: Requirements 12.3**
    - Generate random organizations with custom domains, trigger removal, verify fields cleared
  
  - [ ]* 10.12 Write property test for URL fallback after domain removal
    - **Property 19: URL Fallback After Domain Removal**
    - **Validates: Requirements 12.4**
    - Generate organizations with both domains, construct URL, remove custom domain, verify URL reverts to subdomain

- [ ] 11. Add Domain Settings page to navigation
  - Add route for Domain Settings page in router configuration
  - Add navigation link in settings menu
  - Ensure proper authentication and authorization
  - _Requirements: 7.1_

- [ ] 12. Checkpoint - Verify domain management functionality
  - Ensure all tests pass, ask the user if questions arise.
  - Manually test custom domain addition and validation
  - Test DNS verification with real DNS records (if possible)
  - Verify error handling for all DNS failure scenarios
  - Test domain removal workflow
  - Verify URL priority logic updates correctly after domain changes

- [ ] 13. Add comprehensive property-based tests for open site security
  - [ ]* 13.1 Write property test for open site security parameters
    - **Property 7: Open Site Security Parameters**
    - **Validates: Requirements 4.1, 4.4**
    - Generate random URLs, mock window.open, verify security parameters include noopener and noreferrer

- [ ] 14. Add unit tests for edge cases and error handling
  - [ ]* 14.1 Test QRCodeDialog error handling
    - Test QR generation failure displays error message
    - Test download failure shows toast notification
    - Test dialog close button functionality
    - Test null siteUrl handling
  
  - [ ]* 14.2 Test Dashboard integration edge cases
    - Test with null organization context
    - Test with undefined subdomain
    - Test with empty string subdomain
    - Test with unverified custom domain (should use subdomain)
    - Test with verified custom domain (should use custom domain)
    - Test actions remain disabled appropriately
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 14.3 Test Domain Settings page edge cases
    - Test invalid domain format validation
    - Test DNS lookup network errors
    - Test DNS TXT record not found
    - Test DNS TXT record value mismatch
    - Test DNS lookup timeout
    - Test custom domain already in use error
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 15. Final checkpoint and validation
  - Ensure all tests pass, ask the user if questions arise.
  - Verify QR codes scan correctly on mobile devices
  - Test responsive layout on mobile and desktop
  - Verify light/dark theme compatibility
  - Check accessibility of all dialogs and buttons
  - Test complete domain verification workflow end-to-end
  - Verify URL priority logic works correctly in all scenarios
  - Test that Site URL updates immediately after domain verification

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The design uses TypeScript with React and existing project patterns
- QR code generation is client-side using the `qrcode` library
- DNS verification uses Node.js built-in `dns.promises` module
- Property tests use `fast-check` library with minimum 100 iterations
- All tasks reference specific requirements for traceability
- The implementation integrates seamlessly with existing QuickActionsGrid component
- Backend changes required for domain management and DNS verification
- Database migration required for verificationToken field
- 19 correctness properties expanded from original 7 properties
