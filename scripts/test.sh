#!/bin/sh
# One filtered test run: seven seconds instead of the whole suite's minutes.
# The filter is a part of a test's name; a bare call is refused on purpose.
set -u
if [ $# -lt 1 ] || [ -z "$1" ]; then
  echo 'usage: scripts/test.sh "<part of a test'"'"'s name>"' >&2
  exit 2
fi
cd "$(dirname "$0")/../ui" || exit 1
log=/tmp/atlas-test.log
# macOS has no `timeout`: alarm in perl is the one that exists everywhere here.
perl -e 'alarm 120; exec @ARGV' "$HOME/.nsh-0.4.0/bin/nsh" test --filter "$1" >"$log" 2>&1
code=$?
rg "✗|tests:|error" "$log" | head -20
if [ $code -ne 0 ]; then
  echo "--- (exit $code; a 142 means the run was killed at 120 s)" >&2
fi
exit $code
