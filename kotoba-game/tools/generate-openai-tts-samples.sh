#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is required." >&2
  echo "Example: OPENAI_API_KEY=... ./kotoba-game/tools/generate-openai-tts-samples.sh" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/kotoba-game/tts-samples/openai"
MODEL="gpt-4o-mini-tts"

# Five words that make it easy to compare pronunciation, warmth, and expressiveness.
declare -a ITEMS=(
  "wanwan|わんわん"
  "ringo|りんご"
  "papa|ぱぱ"
  "mama|まま"
  "densha|でんしゃ"
)

# A small first-pass set. Change this list freely after listening.
declare -a VOICES=("marin" "coral" "shimmer")

INSTRUCTIONS="Speak natural Japanese to a young child. Warm, gentle, cheerful, and clear. Say only the supplied word, once. Do not add any greeting or explanation. Avoid an exaggerated cartoon voice. Use a natural Japanese rhythm and slightly slower-than-normal pacing."

mkdir -p "$OUT"

for voice in "${VOICES[@]}"; do
  mkdir -p "$OUT/$voice"
  for item in "${ITEMS[@]}"; do
    key="${item%%|*}"
    text="${item#*|}"
    file="$OUT/$voice/$key.mp3"
    echo "Generating $voice / $text -> ${file#$ROOT/}"

    payload=$(python3 - "$MODEL" "$voice" "$text" "$INSTRUCTIONS" <<'PY'
import json, sys
model, voice, text, instructions = sys.argv[1:]
print(json.dumps({
    "model": model,
    "voice": voice,
    "input": text,
    "instructions": instructions,
    "response_format": "mp3"
}, ensure_ascii=False))
PY
)

    curl --fail --silent --show-error \
      https://api.openai.com/v1/audio/speech \
      -H "Authorization: Bearer $OPENAI_API_KEY" \
      -H "Content-Type: application/json" \
      -d "$payload" \
      --output "$file"
  done
done

echo
echo "Done. Generated samples under:"
echo "  ${OUT#$ROOT/}"
echo
echo "Quick listen on macOS:"
echo "  open '$OUT'"
