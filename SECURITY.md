# Security Policy

This is a personal static travel-guide site (GitHub Pages + a config-gated Firebase Realtime
Database). There are no versioned releases; only `main` is deployed and supported.

**Reporting:** open a GitHub issue on this repository (or use GitHub's private vulnerability
reporting if enabled). Please include steps to reproduce. The Firebase trust model — anonymous
auth + unguessable room codes, field-size caps, not private-by-login — is documented honestly
in `src/features/firebase/README.md`.
