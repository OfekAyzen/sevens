#!/usr/bin/env bash
# PostToolUse hook: keep the tree type-clean while Claude works.
#
# Reads the hook payload on stdin, and only does work when a TypeScript file
# under src/ or tests/ actually changed. On a type error it exits 2, which feeds
# stderr straight back to Claude as something to fix — so a mistake is corrected
# in the same turn instead of surviving until someone runs the gate by hand.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

payload="$(cat)"
file="$(printf '%s' "$payload" | node -e '
  let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
    try{const j=JSON.parse(s);process.stdout.write(j?.tool_input?.file_path??"")}catch{}
  })' 2>/dev/null)"

case "$file" in
  *src/*.ts|*src/*.tsx|*tests/*.ts|*tests/*.tsx) ;;
  *) exit 0 ;;
esac

# Autofix trivia silently; never fail the turn over formatting.
npx oxlint --fix "$file" >/dev/null 2>&1 || true

if ! out="$(npx tsc --noEmit -p tsconfig.app.json 2>&1)"; then
  echo "Type errors introduced — fix these before continuing:" >&2
  printf '%s\n' "$out" | head -30 >&2
  exit 2
fi
exit 0
