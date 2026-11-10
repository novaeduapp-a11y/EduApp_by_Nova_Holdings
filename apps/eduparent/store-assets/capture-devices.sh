#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS="$ROOT/store-assets"
EXPO_APP="${EXPO_APP:-/tmp/Expo Go.app}"
FLOW="$ASSETS/maestro-login-and-shots.yaml"
export PATH="${PATH}:${HOME}/.maestro/bin"
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true
export MAESTRO_CLI_NO_ANALYTICS=1

if [[ ! -d "$EXPO_APP" ]]; then
  echo "Expo Go manquant: $EXPO_APP"
  exit 1
fi

# slug|simulator name
DEVICES=(
  "iphone-6.9|iPhone 17 Pro Max"
  "iphone-6.3|iPhone 17"
  "ipad-13|iPad Pro 13-inch (M5)"
)

boot_only() {
  local name="$1"
  xcrun simctl boot "$name" 2>/dev/null || true
  open -a Simulator
  # wait until booted
  for _ in $(seq 1 60); do
    if xcrun simctl list devices | grep "$name" | grep -q Booted; then
      return 0
    fi
    sleep 1
  done
  echo "Timeout boot: $name"
  return 1
}

shutdown_others() {
  local keep="$1"
  while IFS= read -r udid; do
    [[ -z "$udid" ]] && continue
    xcrun simctl shutdown "$udid" 2>/dev/null || true
  done < <(xcrun simctl list devices | awk -v keep="$keep" '
    /Booted/ {
      line=$0
      if (index(line, keep)==0) {
        if (match(line, /\(([A-F0-9-]{36})\)/)) print substr(line, RSTART+1, RLENGTH-2)
      }
    }')
}

for entry in "${DEVICES[@]}"; do
  slug="${entry%%|*}"
  name="${entry#*|}"
  out="$ASSETS/screenshots/$slug"
  mkdir -p "$out"

  echo "======== $slug ($name) ========"
  shutdown_others "$name"
  boot_only "$name"
  sleep 2

  xcrun simctl install booted "$EXPO_APP" 2>/dev/null || \
    xcrun simctl install "$name" "$EXPO_APP"

  xcrun simctl openurl booted "exp://127.0.0.1:8081" || \
    xcrun simctl openurl "$name" "exp://127.0.0.1:8081"
  sleep 12

  tmp="$(mktemp -d)"
  maestro --device "$name" test "$FLOW" --debug-output "$tmp" 2>&1 | tail -40

  shots="$(find "$tmp" -type d -name takeScreenshot | head -1)"
  if [[ -n "$shots" ]]; then
    cp "$shots"/01-accueil.png "$out/" 2>/dev/null || true
    cp "$shots"/02-notes.png "$out/" 2>/dev/null || true
    cp "$shots"/03-absences.png "$out/" 2>/dev/null || true
    cp "$shots"/04-bulletins.png "$out/" 2>/dev/null || true
  fi

  for f in 01-accueil 02-notes 03-absences 04-bulletins; do
    if [[ -f "$out/$f.png" ]]; then
      w=$(sips -g pixelWidth "$out/$f.png" 2>/dev/null | awk '/pixelWidth/{print $2}')
      h=$(sips -g pixelHeight "$out/$f.png" 2>/dev/null | awk '/pixelHeight/{print $2}')
      echo "  OK $f ${w}x${h}"
    else
      echo "  MANQUANT $f"
    fi
  done
  rm -rf "$tmp"
done

echo "DONE"
ls -la "$ASSETS/screenshots"/*/
