# Code-email greeting and image activation — 2026-10-17

## Confirmed causes

Direct invocations of the live CustomMessage signup renderer in English and
Spanish left `{username}` in the HTML and did not include the supplied display
name. No real email was sent. Cognito only substitutes the username credential
placeholder for administrator-created accounts; ordinary messages must resolve
the name from the event attributes. See [AWS CustomMessage documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-message.html).

A second read-only check found Lambda's resolved image digest differed from the
image built by the previous green release workflow. The old deployment used the
same mutable `latest` URI, so an environment/cache update and warm-up had not
proved new code activation. [AWS documents that updating an ECR tag does not
automatically update Lambda](https://docs.aws.amazon.com/cli/latest/reference/lambda/update-function-code.html). This corrects the email-code activation claim in the
previous combined release record; pool-hook wiring and the other application
releases were verified independently and remain unchanged.

## Fix

- Signup, resend and password-reset templates use a complete greeting, resolved
  from given name, name or preferred username; missing names produce a neutral
  greeting. HTML escaping preserves accents, ampersands and literal backslashes.
- Code markers come from `request.codeParameter`. Administrator-created account
  messages retain both event-provided credential placeholders. Legacy template
  username variables remain supported for safe rollout and template caching.
- Build images with a commit tag. Resolve that tag using the existing scoped
  BatchGetImage permission, pin the digest in CloudFormation and verify the live
  resolved digest before reporting success. The function ARN and hook wiring stay
  unchanged; no new IAM grants or account-pool changes are required.
- Activate compatible code first without advancing the template cache revision,
  publish SES templates, then update the cache revision.

## Validation

20 tests pass, covering the actual English/Spanish templates, all supported code
triggers, escaping, fallback names, cache isolation, admin credentials, missing
build images and stale deployed images. Shell syntax, whitespace and AWS template
validation pass. Deployed direct live render checks pass as recorded below.

## Release

Email source `f5d97f5` is pushed and deployed by successful
[workflow `39063556310`](https://github.com/chepelcr/tsuru-cognito-templates/actions/runs/39063556310).

- Lambda is Active with a successful last update; its resolved digest and the
  CloudFormation ImageDigest parameter match the exact commit-tagged ECR image.
- The live template cache revision matches the published source hash.
- All 12 live English/Spanish renders pass across signup, resend, password reset,
  attribute verification and administrator-created account events. The six
  signup/resend/reset cases display the supplied escaped recipient name; ordinary
  messages contain no unresolved username/greeting variables. Code markers and
  admin credential markers retain the event-provided values.
- The deployed confirmation/welcome branch returned safely for a test event with
  no recipient, with its expected skip log. No test account or live email was
  created/sent. Actual inbox receipt remains outside this renderer check.
