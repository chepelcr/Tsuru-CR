# Account and organization onboarding audit — 2026-10-16

Implemented using the ui-ux-pro-max review workflow. Released in the combined
2026-10-17 deployment; see [release evidence](combined-release-2026-10-17.md).

## Findings and fixes

| Area | Finding | Implemented change |
|---|---|---|
| Setup badges | Registration split three stages into a 2+1 rail; verification/organization flex connectors made the rail asymmetric. Labels were truncated. | Equal centered columns with wrapping labels. Account creation is Información → Clave → Verificación; organization creation starts its own sequence at 1. |
| Keyboard | Stepper intercepted Enter inside signup forms, selects and buttons. | Native forms and interactive controls retain Enter. Plain wizard inputs advance only when valid. Step changes focus the body and scroll the rail below the fixed header. |
| Form semantics | Most signup/contact/location labels had no control association; React Hook Form refs did not reach inputs. | Matching IDs/labels, error descriptions and invalid states; forwarded input refs; name/email/password autofill; proper page and subsection headings. |
| Mobile | Narrow name rows, fixed phone columns and the subdomain suffix could crowd or overflow. Organization title started beneath the fixed header. | Stacking name/location fields, shrinkable phone columns, wrapping subdomain, shared AuthLayout header clearance and dynamic viewport height. |
| Verification handoff | Backend returns `{ message, user }`, but frontend cached the whole response as the user. | Unwrap `user` before caching so email, name and role reach organization setup. |
| Verification recovery | A failed profile sync after accepted confirmation made the next attempt resubmit a consumed code. Resend success only went to an invisible notification bell. | Retry profile setup without reconfirming; show resend success inline and disable conflicting/duplicate actions. |
| Profile attributes | Optional gender was collected but never sent to Cognito. | Include the optional gender attribute alongside locale and other identity attributes. Cognito retains custom text while the database stores its canonical category, avoiding its 20-character column limit. |
| Organization drafts | Business identity was not restored, and edits made after returning to basic info were not persisted. | Restore the draft identity, save it with general settings, preserve the draft ID and validate optional contact email before advancing. |
| Identifier availability | A late response for an older identifier could enable Next for a new value. Network errors looked like an identifier already taken. | Ignore obsolete requests, require availability for the exact current value, show a distinct lookup failure and textual availability status. |
| Storefront selection | Copy implied every storefront had a matching POS theme. | Explain the separate storefront and optional POS theme mapping; allow template names to wrap. |
| Origin story | Owner requested the title beside its icon. | One aligned header row with a fixed icon and wrapping title. |
| Language flags | Separate auth/dashboard controls used small rounded remote flags. | One shared LanguageToggle with bundled rectangular 3:2 SVG flags for every POS page. Landing and admin language selectors also render unclipped rectangular local vector flags. |
| Motion | FadeIn used a class omitted by the reduced-motion override. | Include that class in the existing override. |

## Welcome email diagnosis

Read-only live checks found SES production access and sending both enabled. The
Cognito pool only had `CustomMessage` attached; it had no `PostConfirmation`
trigger. Existing welcome mail was sent by the management API only when a profile
was first synced into the database. The verification screen calls that API only
when automatic sign-in succeeds. An email confirmation can therefore succeed
without any welcome-email attempt. Additionally, the previous backend discarded
the sender's boolean failure result and logged success; once the user row existed,
that path would never try again. No matching send-failure or welcome log entries
were found by the focused live log queries; this is not evidence of inbox delivery.

AWS documents [PostConfirmation](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-post-confirmation.html)
as the hook for sending mail after signup confirmation. The prepared handler
sends a localized branded welcome on `PostConfirmation_ConfirmSignUp`, independent
of the browser session. Password resets do not send welcome mail. It uses a
verified recipient, escapes names, renders before sending, logs the SES acceptance
message ID, and logs a mail failure without rejecting successful confirmation.
Missing welcome templates have a usable fallback. The management API stops sending
welcome mail on profile reads so the two paths do not duplicate it.

Code is split across `fe/pos-system`, `fe/landing`, `fe/dashboard`, `be/management-be`, `be/cognito-templates`
and `Infrastructure`, all standalone repositories. These folders must not be
force-added to the root repository.

## Validation

- Full POS suite: **89 files, 763 tests passed**. Type/style checks and production build passed. Focused checks were rerun after subsequent layout/header edits.
- Management UserService: **11 tests passed**, including verified-Cognito enforcement and no duplicate profile-triggered welcome. Type check passed.
- Cognito handler: **9 tests passed**, including signup-only welcome, locale, HTML escaping, missing-template fallback, send failure, original code placeholders and keep-warm behavior.
- Landing and admin flag changes: type checks and production builds passed; landing public-import and static-output checks passed.
- Both changed CloudFormation templates passed AWS `validate-template` (read-only; no deployment).
- Browser checks used the real registration page and an isolated organization preview with local mocked mutations/catalogs. No test account, organization, upload or email was created on live services.
- At an observed 375 CSS-pixel viewport, registration and all organization stages fit without horizontal overflow. Number centers match their columns. Organization step transitions place the rail at ~80px beneath a ~53px fixed header. All contact/location controls have labels. Enter advances personal details to credentials and focuses the password input. The origin icon and title share a row with centers matching within 0.01px.

## Follow-up fixes — 2026-10-17

- Account creation shares one three-stage definition between registration and verification. Spanish step 1 is **Información**. Verification uses six individually labeled digit boxes, forward focus, backspace/arrows, mobile autofill and full-code paste into any box. The sixth digit triggers verification once; a synchronous guard prevents overlapping confirmation/resend requests. Invalid codes stay editable without an automatic retry loop; password reset retains its single input.
- Initial fiscal setup keeps its unnumbered welcome, then uses **Hacienda info → Contact & residence → Review** with the shared stepper. Review lists all activities that will be saved. Identification edits clear previous Hacienda identity immediately, obsolete results cannot repopulate it, and failed lookups can be retried. Optional email and field limits are validated; phone countries use ISO 188 rather than dial prefix 506. Save updates the cache before refresh so the saved summary appears immediately.
- The verification handoff caches the nested user, including names, username and tutorial completion state. An integration regression covers a new account followed by a late organization/permission response and confirms the welcome tutorial appears on its first overview visit. Organization completion publishes the completed organization into the owner's membership cache, preserves embedded details and awaits refresh before navigation.
- Profile cards remain **50/50**, per the final owner correction. Last name and username align against the right edge of the personal-information content, including edit controls; stacked mobile fields retain left alignment. Browser measurements show both desktop cards at 514px and right-aligned text.
- Signup and contact settings now share `WhatsAppField`, with an independent country selector. New values persist as an international `+`-prefixed number in the existing column. Legacy local values retain their phone-country fallback until edited. The public contact mapper recognizes international WhatsApp numbers and avoids adding the regular phone prefix again; no database migration is required. Deploy this mapper with the POS field.
- Responsive controls wrap when necessary so the complete dialing prefix stays visible. Browser previews used local mocked services; no live signup, organization, fiscal save, profile edit or email was submitted.

Final combined validation: **100 POS files / 837 tests passed**, including the signup/tutorial, membership-cache, six-box OTP, fiscal save/review and WhatsApp regressions. **24 management API files / 235 tests passed**. POS style/type checks and production build, management type check and whitespace checks passed. Screenshots are saved under `output/onboarding-audit-2026-10-16/`, including `profile-50-50.jpg`, `account-steps.jpg`, `fiscal-steps.jpg` and `whatsapp-country.jpg`.

## Rollout record and remaining acceptance

1. Deploy the cognito-templates handler, its scoped SES SendEmail permission and ten SES templates.
2. Deploy the management API change removing the old profile-triggered welcome sender, and wire the pool's `CognitoPostConfirmationFunctionArn` to the same email Lambda in the coordinated rollout. Do not remove the old sender in isolation. Preserve the existing CustomMessage and pool/client/domain settings.
3. Deploy POS and landing through their existing Pages workflows, and admin through its existing hosting workflow.
4. With an authorized test signup, verify confirmation without automatic sign-in produces one welcome email with the `/organizations/new` link. Confirm password reset produces no welcome email, and inspect SES/bounce logs if mail is absent.

The handler, templates and PostConfirmation hook are deployed. Live inbox
delivery has not been tested. A
logged SES acceptance is not a guarantee of inbox delivery. The handler currently
logs delivery failures without a durable retry queue; adding such a queue is a
separate reliability enhancement.

Release follow-up: all rollout deployments above completed successfully under TSR-371. Only the authorized live signup/inbox acceptance in item 4 remains.
