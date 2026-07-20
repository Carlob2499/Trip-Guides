#!/usr/bin/env bash
# Land a finished branch: open a PR and auto-merge it immediately if the caller says the work
# already passed its gates (build + verify), or open/keep a draft PR for human triage otherwise.
# Idempotent — safe to call again on a branch that already has a PR from a prior (interrupted)
# run; it edits that PR in place rather than opening a second one.
#
# Shared by research-pass.yml (new-guide dual-pass) and modify-guide.yml (scoped edit requests)
# so the git/gh merge mechanics live in exactly one tested place instead of two copies in two
# workflow YAMLs that could quietly drift apart.
#
# Requires: GH_TOKEN in the environment (standard `gh` CLI convention — set it in the calling
# workflow step's `env:`). Requires `main` to have no branch-protection rules requiring review
# (confirmed true for this repo — see new-guide.yml's own comment) so a plain `--merge` needs no
# admin bypass.
#
# Usage: scripts/land-branch.sh <branch> <base> <title> <body-file> <passed:true|false> [announce-url]
# The optional 6th arg is the auto-publish "probation" hook (see the audit / Finding #5): when a
# guide reaches `verified` and lands with NO human in the loop, passing its live URL here makes the
# script file a visible, vetoable "🚀 just auto-published" notice with a one-line rollback path — so
# a silent self-publish becomes a self-publish someone can still catch. Absent (the modify-guide
# scoped-edit path) it's skipped: an edit to an already-live guide isn't a new publication.
# Prints exactly one line to stdout:
#   merged:<pr-number>   — landed on <base>, branch deleted
#   draft:<pr-number>    — a draft PR exists for human triage (either the caller says the work
#                          hasn't passed yet, or the auto-merge attempt hit a conflict)
# Exits non-zero only on a genuine unexpected failure (bad args, `gh` auth/API failure). A merge
# conflict is NOT treated as a script failure — it's the documented fallback path, so the caller
# doesn't need to distinguish "clean NEEDS WORK" from "conflict on merge"; both land as a draft
# PR and print the same shape.

set -euo pipefail

BRANCH="${1:?usage: land-branch.sh <branch> <base> <title> <body-file> <passed:true|false>}"
BASE="${2:?usage: land-branch.sh <branch> <base> <title> <body-file> <passed:true|false>}"
TITLE="${3:?usage: land-branch.sh <branch> <base> <title> <body-file> <passed:true|false>}"
BODY_FILE="${4:?usage: land-branch.sh <branch> <base> <title> <body-file> <passed:true|false>}"
PASSED="${5:?usage: land-branch.sh <branch> <base> <title> <body-file> <passed:true|false>}"
ANNOUNCE_URL="${6:-}"  # optional; only used on a successful auto-publish merge (see header)

# Reuse an existing PR for this branch if a prior (interrupted) run already opened one — never
# open a second PR for the same branch.
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
  # Not passing yet — make sure it reads as a draft (in case a prior run had marked it ready)
  # and stop; a human triages it from here.
  gh pr ready "$PR_NUM" --undo >/dev/null 2>&1 || true
  echo "draft:$PR_NUM"
  exit 0
fi

# Passing — try to land it for real.
gh pr ready "$PR_NUM" >/dev/null 2>&1 || true
if gh pr merge "$PR_NUM" --merge --delete-branch >/dev/null 2>&1; then
  echo "merged:$PR_NUM"
  # Auto-publish probation: the guide just went live with nobody approving it first. File a loud,
  # vetoable heads-up so that safety net isn't gone entirely — never fatal, so a notification
  # hiccup can't fail a merge that already succeeded.
  if [ -n "$ANNOUNCE_URL" ]; then
    NOTE_FILE="$(mktemp)"
    {
      printf 'A research pass reached `verified` and **auto-published this guide** — it went live with no human approval step. This notice is the safety net.\n\n'
      printf '**Live now:** %s\n\n' "$ANNOUNCE_URL"
      printf 'Give it a look. If something is off, hold or roll it back by re-adding `"draft": true` to the guide meta file (`_guide.json`, or `<slug>.json` for a flat guide) and pushing to `main` — it drops off the live site on the next deploy. If it looks good, just close this issue.\n\n'
      printf '_Auto-filed by land-branch.sh on merge of #%s._\n' "$PR_NUM"
    } > "$NOTE_FILE"
    gh issue create --title "🚀 Auto-published: $TITLE" --body-file "$NOTE_FILE" --label auto-published >/dev/null 2>&1 || true
    rm -f "$NOTE_FILE"
  fi
else
  echo "[land-branch] merge failed (likely a conflict) — leaving $BRANCH as a draft PR for human triage" >&2
  gh pr ready "$PR_NUM" --undo >/dev/null 2>&1 || true
  echo "draft:$PR_NUM"
fi
