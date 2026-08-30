#!/usr/bin/env bash
# Land a finished research/change branch through the same protected-main checks required of normal
# engineering PRs. The caller's guide evidence gate remains authoritative; before an auto-merge we
# additionally synchronize the current base into the branch, rerun build + network verify on that
# final integrated head, explicitly dispatch unattended Required/freeze checks, wait for security
# checks, and refuse if either head or base moves. Branch protection is the final atomic guard.
#
# Idempotent: reuse an existing PR rather than opening duplicates. A caller-declared gate failure
# or a mergeability conflict remains a draft PR. Auth/permission/check/base-drift failures are loud
# hard failures; executeLanding owns durable re-quarantine for passed auto-landings.
#
# Usage: scripts/land-branch.sh <branch> <base> <title> <body-file> <passed:true|false> [announce-url] [slug]
# The optional slug argument overrides the workflow's inherited SLUG environment variable.
# Prints exactly one final line:
#   merged:<pr-number> announce=<ok|failed|skipped>
#   draft:<pr-number>

set -euo pipefail

BRANCH="${1:?usage: land-branch.sh <branch> <base> <title> <body-file> <passed:true|false>}"
BASE="${2:?usage: land-branch.sh <branch> <base> <title> <body-file> <passed:true|false>}"
TITLE="${3:?usage: land-branch.sh <branch> <base> <title> <body-file> <passed:true|false>}"
BODY_FILE="${4:?usage: land-branch.sh <branch> <base> <title> <body-file> <passed:true|false>}"
PASSED="${5:?usage: land-branch.sh <branch> <base> <title> <body-file> <passed:true|false>}"
ANNOUNCE_URL="${6:-}"
LANDING_SLUG="${7:-${SLUG:-}}"
REPO="${GITHUB_REPOSITORY:-}"

PR_NUM="$(gh pr view "$BRANCH" --json number -q .number 2>/dev/null || true)"
if [ -z "$PR_NUM" ]; then
  if [ "$PASSED" = "true" ]; then
    gh pr create --base "$BASE" --head "$BRANCH" --title "$TITLE" --body-file "$BODY_FILE" >/dev/null
  else
    gh pr create --draft --base "$BASE" --head "$BRANCH" --title "$TITLE" --body-file "$BODY_FILE" >/dev/null
  fi
  PR_NUM="$(gh pr view "$BRANCH" --json number -q .number)"
else
  gh pr edit "$PR_NUM" --title "$TITLE" --body-file "$BODY_FILE" >/dev/null
fi

if [ "$PASSED" != "true" ]; then
  gh pr ready "$PR_NUM" --undo >/dev/null 2>&1 || true
  echo "draft:$PR_NUM"
  exit 0
fi

if [ -z "$LANDING_SLUG" ]; then
  echo "[land-branch] a passing auto-landing requires the guide slug so final integrated evidence can be rerun" >&2
  exit 1
fi
if [ -z "$REPO" ]; then
  echo "[land-branch] GITHUB_REPOSITORY is required for protected unattended landing" >&2
  exit 1
fi

gh pr ready "$PR_NUM" >/dev/null 2>&1 || true

# Make the branch itself contain the current base before final publication evidence. This is what
# allows strict/up-to-date branch protection to work after issue #130 is activated. Conflict is the
# existing safe draft fallback; do not mutate the branch when the integration cannot be resolved.
git fetch origin "$BASE" >/dev/null
BASE_SHA="$(git rev-parse "origin/$BASE")"
BEFORE_HEAD="$(git rev-parse HEAD)"
if ! git merge-base --is-ancestor "$BASE_SHA" HEAD; then
  MERGE_BASE_ERR="$(mktemp)"
  if ! git merge --no-edit "origin/$BASE" 2>"$MERGE_BASE_ERR"; then
    MERGE_ERR="$(cat "$MERGE_BASE_ERR")"
    rm -f "$MERGE_BASE_ERR"
    git merge --abort >/dev/null 2>&1 || true
    if echo "$MERGE_ERR" | grep -qiE "conflict|automatic merge failed"; then
      echo "[land-branch] current $BASE conflicts with $BRANCH — leaving PR #$PR_NUM for human triage" >&2
      gh pr ready "$PR_NUM" --undo >/dev/null 2>&1 || true
      echo "draft:$PR_NUM"
      exit 0
    fi
    echo "[land-branch] failed to synchronize $BASE before final evidence:" >&2
    echo "$MERGE_ERR" >&2
    exit 1
  fi
fi
HEAD_SHA="$(git rev-parse HEAD)"
if [ "$HEAD_SHA" != "$BEFORE_HEAD" ]; then
  git push origin "HEAD:$BRANCH" >/dev/null
fi

# Base synchronization happened after the caller's original landing gate. Re-run both parts on the
# exact integrated head so publication never relies on evidence from a pre-integration tree.
if ! npm run build; then
  echo "[land-branch] final integrated build failed; refusing auto-merge" >&2
  exit 1
fi
if ! npm run verify -- --slug "$LANDING_SLUG" --network; then
  echo "[land-branch] final integrated network verification failed; refusing auto-merge" >&2
  exit 1
fi

# Explicit unattended checks are mandatory: GITHUB_TOKEN-created PRs cannot be trusted to emit
# recursive pull_request events. The helper pins both the exact head and exact base, dispatches the
# repo-owned Required/freeze gates, waits for platform Analyze checks, and rejects drift.
node scripts/protected-pr-gate.mjs \
  --repo "$REPO" --pr "$PR_NUM" --branch "$BRANCH" --head-sha "$HEAD_SHA" \
  --base "$BASE" --base-sha "$BASE_SHA"

MERGE_ERR_FILE="$(mktemp)"
if gh pr merge "$PR_NUM" --merge --delete-branch --match-head-commit "$HEAD_SHA" >/dev/null 2>"$MERGE_ERR_FILE"; then
  rm -f "$MERGE_ERR_FILE"
  ANNOUNCE="skipped"
  if [ -n "$ANNOUNCE_URL" ]; then
    NOTE_FILE="$(mktemp)"
    {
      printf 'A research pass passed its evidence gate and **auto-published this guide** — it merged with no human approval step. This notice is the safety net.\n\n'
      printf '**Will be live on the next deploy:** %s\n\n' "$ANNOUNCE_URL"
      printf 'Give it a look. If something is off, hold or roll it back by re-adding `"draft": true` to the guide meta file (`_guide.json`, or `<slug>.json` for a flat guide) and pushing to `main` — it drops off the live site on the next deploy. If it looks good, just close this issue.\n\n'
      printf '_Auto-filed by land-branch.sh on merge of #%s._\n' "$PR_NUM"
    } > "$NOTE_FILE"
    if gh issue create --title "🚀 Auto-published: $TITLE" --body-file "$NOTE_FILE" --label auto-published >/dev/null 2>&1; then
      ANNOUNCE="ok"
    else
      ANNOUNCE="failed"
      echo "[land-branch] MERGE #$PR_NUM SUCCEEDED but the auto-published safety notice FAILED to file — file it by hand (label: auto-published)." >&2
    fi
    rm -f "$NOTE_FILE"
  fi
  echo "merged:$PR_NUM announce=$ANNOUNCE"
else
  MERGE_ERR="$(cat "$MERGE_ERR_FILE")"
  rm -f "$MERGE_ERR_FILE"
  if echo "$MERGE_ERR" | grep -qiE "not mergeable|conflict"; then
    echo "[land-branch] merge failed (mergeability conflict) — leaving $BRANCH as a draft PR for human triage" >&2
    gh pr ready "$PR_NUM" --undo >/dev/null 2>&1 || true
    echo "draft:$PR_NUM"
  else
    echo "[land-branch] gh pr merge failed for a reason OTHER than a mergeability conflict — not silently downgrading to draft-PR triage:" >&2
    echo "$MERGE_ERR" >&2
    exit 1
  fi
fi
