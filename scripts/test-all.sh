#!/bin/sh
# The whole suite, once in a while, with a hard limit: a hung run is killed
# instead of being waited on for half an hour.
set -u
cd "$(dirname "$0")/../ui" || exit 1
log=/tmp/atlas-test-all.log
perl -e 'alarm 180; exec @ARGV' "$HOME/.nsh-0.4.0/bin/nsh" test >"$log" 2>&1
code=$?
rg "✗|tests:|error" "$log" | head -20
if [ $code -ne 0 ]; then
  echo "--- (exit $code; a 142 means the run was killed at 180 s)" >&2
fi
exit $code
