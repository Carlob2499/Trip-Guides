#!/usr/bin/env bash
# Run a command while teeing combined stdout/stderr to a durable log, without letting `tee`
# hide the producer's exit status. Keep this generic so every headless agent stage shares the
# same failure semantics.
set -u

if [ "$#" -lt 2 ]; then
  echo "usage: run-logged-command.sh <log-file> <command> [args...]" >&2
  exit 64
fi

LOG_FILE=$1
shift

set +e
"$@" 2>&1 | tee "$LOG_FILE"
PIPE_STATUSES=("${PIPESTATUS[@]}")
set -e

COMMAND_STATUS=${PIPE_STATUSES[0]:-1}
TEE_STATUS=${PIPE_STATUSES[1]:-1}

# Prefer the producer's status when both fail: that is the stage's primary execution truth.
if [ "$COMMAND_STATUS" -ne 0 ]; then
  exit "$COMMAND_STATUS"
fi
if [ "$TEE_STATUS" -ne 0 ]; then
  exit "$TEE_STATUS"
fi
exit 0
