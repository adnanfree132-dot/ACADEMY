#!/usr/bin/env bash
# Cloudflare Pages build: screens always, API worker only from main.
set -euo pipefail
npx vite build

branch="${CF_PAGES_BRANCH:-main}"
if [[ "$branch" != "main" ]]; then
  echo "Skipping API worker deploy on branch $branch"
  exit 0
fi

(cd server && npm ci && npx prisma generate)
npx wrangler deploy --config server/wrangler.toml
