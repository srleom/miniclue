#!/bin/bash
# block-supabase.sh - Prevents execution of Supabase schema migration commands

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Check if command contains blocked Supabase patterns
if echo "$COMMAND" | grep -qE "supabase\s+(db\s+diff|migration|db\s+push|db\s+reset)"; then
  echo "Blocked: Supabase schema commands are not allowed. Edit apps/backend/supabase/schemas/schema.sql directly instead. User will execute migrations manually." >&2
  exit 2
fi

exit 0
