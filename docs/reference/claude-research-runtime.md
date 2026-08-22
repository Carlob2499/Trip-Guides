# Claude research runtime safety

Operational safety rules for WayPoint research sessions. These rules describe execution hazards,
not research-quality shortcuts. Source-quality and evidence requirements remain unchanged.

## 1. Security-challenge stop rule

Claude's embedded browser must **never** attempt to complete or interact with:

- CAPTCHA or Cloudflare Turnstile challenges;
- "Verify you are human" / bot-verification interstitials;
- account login flows used only to access a research page;
- MFA, passkeys, device confirmation, or other security verification;
- any page that asks the research agent to authenticate before continuing.

A reproducible crash was observed when an interactive Claude browser session opened Kuromon and
entered login/security-verification flow. Treat the challenge itself as an environment boundary.
Do not reopen the challenge to prove the crash again.

When a challenge appears:

1. Stop browser interaction with that origin immediately.
2. Record the origin as `blocked` where the evidence schema supports `source.access`.
3. Do not promote a search-result preview to verification.
4. Seek another legitimate primary/operator/reference source.
5. If no replacement verifies the claim, keep it explicitly unverified or omit it according to
   the normal evidence rules.

A blocked authority is an honest access fact, not permission to bypass the site's controls.

## 2. Prefer non-interactive retrieval

For ordinary research, prefer native `WebSearch` / `WebFetch` and direct official/operator pages.
The embedded browser is not required merely because a normal fetch is inconvenient. Never turn a
research task into an account-authentication task.

## 3. Separate execution planes when diagnosing failures

Always identify which plane failed:

- **interactive Claude / Remote Control**: local bridge, embedded browser, local CLI session;
- **headless Claude Code in GitHub Actions**: Pass A, Pass B, reconcile, critic;
- **deterministic workflow/control plane**: collection, validators, retry routing, landing.

Do not infer that one plane failed because another did.

## 4. Headless partial output is not successful output

If the Claude CLI exits nonzero, hits a usage/session limit, is cancelled, or otherwise terminates
before the stage completes, its workspace is partial attempt evidence only. The workflow must not
run the normal successful collection/verification path and then reclassify the interruption as a
content gate failure.

## 5. Research may continue after a blocked source

A security challenge does not fail the entire research pass. Mark the source blocked, preserve the
lead if useful, find an alternative authority, and continue. The stopping rule remains evidence
saturation plus the normal risk/verification budget, not "keep attacking the blocked site until it
opens."
