# Compact account photo controls and upload credentials

Follow-up on 15 October 2026.

## Changes

- Profile photo sits in an 80px column next to the first/last name fields, in read and edit modes. Removed the standalone photo row, divider and upload instructions from the personal card.
- Hover or keyboard focus reveals an edit overlay. A persistent edit badge keeps the avatar discoverable on touch screens. Clicking/tapping the avatar opens the existing crop editor; dropping a file on the avatar also opens it.
- Remove photo is inside the modal only, and is shown only when the account already has a photo. Removal is disabled while saving and closes the modal only after the server succeeds. A failure keeps the existing photo and allows retry.
- Null in the existing profile update endpoint clears the account picture and returns all avatars to initials.
- Fixed the Cognito DAO update path: it previously omitted the picture attribute entirely, so a successful response could fail to survive a profile reload. It now writes picture values and clears them using a blank value, as documented by [AWS AdminUpdateUserAttributes](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminUpdateUserAttributes.html).
- Fixed the reported InvalidAccessKeyId upload error: the S3 DAO manually copied Lambda’s temporary access key and secret but omitted AWS_SESSION_TOKEN. It now uses the SDK credential provider chain, preserving the full temporary credential set. Signed uploads retain the earlier empty-checksum fix and type/length binding.

## Validation

- Frontend: 647 tests pass, plus focused editor tests after moving deletion into the modal. TypeScript, style policy and production build pass.
- API: 224 tests pass; TypeScript and Lambda build pass. A signer test uses temporary environment credentials and verifies X-Amz-Security-Token is present. Cognito command tests verify actual picture save/clear requests; HTTP tests verify nullable removal and reject invalid URL values.
- Browser component review at 375px confirms the photo remains beside the names with no horizontal overflow. Keyboard focus exposes the edit controls, and the avatar opens the crop modal.
- API deployment d10283c: https://github.com/chepelcr/tsuru-management-be/actions/runs/38779951430 — successful. Live API probe returned HTTP 200.
- Frontend final commit d944f90: https://github.com/chepelcr/tsuru-pos-system/actions/runs/38780524020 — successful.
- Live deployed UI verified at 1100px and 375px, including the compact photo/name row, opening the editor and cancelling mobile profile editing; no horizontal overflow. Screenshot: `output/profile-photo-editor/compact-deployed.jpg`.
- No real account photo was uploaded, removed or replaced during verification. The end-to-end real-photo upload still requires a retry with a fresh signed URL after refreshing the app.
