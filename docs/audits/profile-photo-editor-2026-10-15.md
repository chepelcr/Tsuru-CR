# Profile photo editor and upload signing fix

Implemented and deployed on 15 October 2026 through the repositories’ GitHub deployment workflows.

## Behavior

- Add/change photo opens an accessible modal before file selection. A file can also be dropped on the profile photo area or inside the modal.
- JPG, PNG and WebP files up to 5 MB show a circular preview with one-finger dragging and two-finger pinch zoom. Desktop uses left-click dragging and mouse-wheel zoom. Keyboard arrows, +/− and Home provide movement, zoom and reset without visible adjustment buttons or sliders.
- Save exports the visible crop as a 512 × 512 PNG and then uses the existing upload-and-profile persistence flow. Cancel makes no upload. A failed save retains the crop for retry; saving prevents duplicate submissions and dismissal.
- Spanish and English labels, validation and feedback are included. Object URLs are released when replacing, cancelling or unmounting the editor.

## Upload failure

The installed AWS SDK automatically added `x-amz-checksum-crc32=AAAAAA==` to a bodyless presigned PUT. This is the checksum of an empty file; a browser sending a real photo cannot satisfy it. The signing DAO now uses a separate client with `requestChecksumCalculation: WHEN_REQUIRED` for presigned uploads. Ordinary server uploads retain automatic checksums. Presigned requests explicitly sign Content-Type and continue to bind the supplied Content-Length.

An actual SDK signing regression test verifies that the empty-body checksum is absent and type/length are signed. It does not mock the signer.

## Verification

- Frontend: 643 tests pass; style policy, TypeScript and production build pass.
- Platform API: 217 tests pass; TypeScript and Lambda build pass.
- Crop tests cover landscape/portrait centering, boundary clamping, export geometry and MIME type. Editor tests cover choose/drop, cancellation, invalid and unreadable files, keyboard positioning, two-pointer pinch geometry and limits, pointer cancellation, mouse drag/wheel controls, retained crops on retry, and duplicate submission protection.
- Browser: pointer dragging and zoom verified. At a measured 375 × 812 viewport the full modal and actions fit, with no horizontal overflow. At shorter desktop/landscape heights the modal scrolls to keep its controls reachable.
- Screenshot: `output/profile-photo-editor/deployed-gestures.jpg` (live deployed editor in the existing account, sample fixture; cancelled without saving). Real browser canvas export produces a 512 × 512 image; desktop wheel zoom and click-drag were also verified on the live site.
- Frontend commit `ac2be79`: https://github.com/chepelcr/tsuru-pos-system/actions/runs/38777930691 — successful.
- API commit `9ea6169`: https://github.com/chepelcr/tsuru-management-be/actions/runs/38776887635 — successful. The live API probe returned HTTP 200.
- GitHub’s OIDC credentials enabled both deployments despite invalid local AWS credentials. A real account photo upload/save was not performed; the live editor test was cancelled before upload.
