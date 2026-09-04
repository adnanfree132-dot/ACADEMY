#!/usr/bin/env bash
# Expose local Express :5000 on a public Cloudflare quick tunnel,
# then point the academy-api Worker at that origin.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${HOME}/.grok/long-running-background-tasks"
mkdir -p "$DIR"
BIN="${DIR}/cloudflared"
LOG="${DIR}/api_tunnel_$$.log"
ORIGIN_FILE="${DIR}/api_origin.url"
WORKER_CONFIG="${ROOT}/workers/academy-api/wrangler.toml"

if [[ ! -x "$BIN" ]]; then
  echo "cloudflared missing at $BIN" >&2
  exit 1
fi

if ! curl -fsS -m 3 "http://127.0.0.1:5000/health" >/dev/null; then
  echo "Express is not running on :5000" >&2
  exit 1
fi

"$BIN" tunnel --no-autoupdate --url http://127.0.0.1:5000 >"$LOG" 2>&1 &
CFPID=$!
echo "$CFPID" > "${DIR}/api_tunnel.pid"
echo "cloudflared pid $CFPID log $LOG"

URL=""
for i in $(seq 1 40); do
  if ! kill -0 "$CFPID" 2>/dev/null; then
    echo "cloudflared exited" >&2
    tail -40 "$LOG" >&2
    exit 1
  fi
  URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | tail -1 || true)"
  if [[ -n "$URL" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "$URL" ]]; then
  echo "did not get trycloudflare URL" >&2
  tail -40 "$LOG" >&2
  exit 1
fi

printf '%s\n' "$URL" > "$ORIGIN_FILE"
printf '%s' "$URL" | npx --yes wrangler secret put API_ORIGIN --config "$WORKER_CONFIG" >/dev/null
echo "API_ORIGIN updated for academy-api worker"

wait "$CFPID"
