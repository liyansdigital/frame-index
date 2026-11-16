# Security Policy

## Scope

FRAME INDEX is a static, front-end project: a Video.js v10 skin and a demonstration page. It has **no backend, no accounts, no database and no credential handling**. The demo streams a public video from Mux using a public playback ID — that ID is not a secret and is safe to share.

Realistic security reports therefore concern things like: a dependency vulnerability with a reachable impact in the built demo, an XSS vector in the skin or demo code, or a compromised asset in the build chain.

## Reporting a vulnerability

Please **do not** open a public issue for a suspected vulnerability.

- Preferred: use GitHub's private vulnerability reporting on this repository (Security → "Report a vulnerability"), if enabled.
- Otherwise, contact the maintainer through the profile at https://github.com/liyansdigital and ask for a private channel before sending details.

Include: a description of the issue, the affected file or dependency, steps to reproduce, and the impact you believe it has.

## Response

This is a maintainer-run project; expect an acknowledgement within a few days. Confirmed issues will be fixed on `main` and noted in `CHANGELOG.md`. Please give the maintainer a reasonable window to ship a fix before disclosing publicly.

## Supported versions

Only the latest state of the `main` branch is supported. There are no maintained release branches.
