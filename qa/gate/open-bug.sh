#!/usr/bin/env bash
# Opens a GitHub issue for a gate failure, or comments on the existing open one so repeats do not pile up.
# Usage: open-bug.sh "<stage name>" <report.md>
# Needs: gh CLI, GH_TOKEN, and the standard GITHUB_* variables from Actions.
set -euo pipefail

STAGE="${1:?stage name required}"
REPORT="${2:-report.md}"
TITLE="QA gate BLOCK: ${STAGE}"
RUN_URL="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"

BODY="$(mktemp)"
{
  echo "Commit \`${GITHUB_SHA}\` on \`${GITHUB_REF_NAME}\`. [Run, traces and screenshots](${RUN_URL})"
  echo
  if [ -f "$REPORT" ]; then cat "$REPORT"; else echo "The gate produced no report. Check the run log."; fi
} > "$BODY"

# Exact-title match among open issues.
EXISTING="$(gh issue list --state open --search "\"${TITLE}\" in:title" --json number,title \
  --jq "[.[] | select(.title == \"${TITLE}\")][0].number // empty")"

if [ -n "$EXISTING" ]; then
  gh issue comment "$EXISTING" --body-file "$BODY"
  echo "Updated existing issue #${EXISTING}"
else
  gh issue create --title "$TITLE" --body-file "$BODY"
fi
