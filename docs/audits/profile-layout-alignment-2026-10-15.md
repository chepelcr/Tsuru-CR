# Profile and security layout alignment

15 October 2026. Frontend commits `0c9131b` and `3af0370`.

- Security actions share one row with two equal columns; icons and labels align at the top of each action. Labels wrap within the available width.
- On desktop, the profile photo is vertically centered beside the combined name/contact grid. First name and email share a left edge; last name and username share the second column. Role aligns with the first field column.
- On mobile, the photo is centered above the fields, with the role aligned to the same left edge as the other fields. Read and edit views use the same responsive placement.
- Existing photo modal, drag/pinch/wheel controls and deletion behavior remain in place.

Style policy, TypeScript and production build pass. These are layout-only changes; no new unit tests were added.

Deployment: https://github.com/chepelcr/tsuru-pos-system/actions/runs/38782893145 — successful.

Live browser checks at 1100px confirm identical left edges for name/email, a zero-pixel difference between avatar/grid vertical centers, and security actions on the same row. At 375px, the avatar is centered above the fields and both security actions remain on one row. Read and edit views have no horizontal overflow. Screenshots: `output/profile-photo-editor/aligned-desktop.jpg` and `aligned-mobile.jpg`. No account details were changed during verification.
