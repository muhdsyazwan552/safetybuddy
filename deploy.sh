#!/usr/bin/env bash
#
# Safety Buddy – deploy script (run ON THE SERVER, from the project folder)
#
#   bash deploy.sh                 normal deploy
#   bash deploy.sh --skip-build    don't run npm (assets uploaded separately)
#   bash deploy.sh --no-migrate    don't run database migrations
#   bash deploy.sh --branch=main   branch to deploy (default: main)
#
# Needs: git, php, composer.  npm/Node is needed unless you use --skip-build.

set -Eeuo pipefail

BRANCH="main"
SKIP_BUILD=0
RUN_MIGRATE=1
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=1 ;;
    --no-migrate) RUN_MIGRATE=0 ;;
    --branch=*)   BRANCH="${arg#*=}" ;;
    -h|--help)    sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

PHP="${PHP_BIN:-php}"
COMPOSER="${COMPOSER_BIN:-composer}"
cd "$(dirname "$0")"

say()  { printf '\n\033[1;33m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mDEPLOY FAILED: %s\033[0m\n' "$*" >&2; }

# if anything goes wrong, always bring the site back online
MAINT=0
on_error() {
  fail "see the error above (line $1)"
  if [ "$MAINT" = 1 ]; then "$PHP" artisan up || true; fi
}
trap 'on_error $LINENO' ERR

# explicit failure: report, bring the site back online, stop
die() {
  fail "$*"
  if [ "$MAINT" = 1 ]; then "$PHP" artisan up || true; fi
  exit 1
}

START=$(date +%s)
[ -f artisan ] || { fail "artisan not found – run this from the project root"; exit 1; }
[ -f .env ]    || { fail ".env is missing – create it first (cp .env.example .env && php artisan key:generate)"; exit 1; }

say "Maintenance mode ON"
"$PHP" artisan down --retry=30 --refresh=15 || true
MAINT=1

say "Pulling latest code ($BRANCH)"
git fetch --prune origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

say "Installing PHP dependencies"
"$COMPOSER" install --no-dev --prefer-dist --optimize-autoloader --no-interaction

if [ "$SKIP_BUILD" = 0 ]; then
  if command -v npm >/dev/null 2>&1; then
    say "Installing JS dependencies + building assets"
    if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi
    npm run build
  else
    die "npm was not found. Install Node.js on the server, or build locally, upload public/build and run: bash deploy.sh --skip-build"
  fi
else
  say "Skipping asset build (--skip-build)"
fi

# a leftover Vite dev-server flag makes the site load assets from localhost:5173
if [ -f public/hot ]; then
  say "Removing stale public/hot (dev server flag)"
  rm -f public/hot
fi

if [ ! -f public/build/manifest.json ] && [ ! -f public/build/.vite/manifest.json ]; then
  die "public/build/manifest.json is missing – the frontend was not built"
fi

if [ "$RUN_MIGRATE" = 1 ]; then
  say "Running database migrations"
  "$PHP" artisan migrate --force
fi

say "Linking storage + refreshing caches"
"$PHP" artisan storage:link >/dev/null 2>&1 || true
"$PHP" artisan optimize:clear
"$PHP" artisan config:cache
"$PHP" artisan route:cache
"$PHP" artisan view:cache
"$PHP" artisan queue:restart >/dev/null 2>&1 || true

say "Maintenance mode OFF"
"$PHP" artisan up
MAINT=0

printf '\n\033[1;32mDeploy finished in %ss\033[0m  (%s @ %s)\n' "$(( $(date +%s) - START ))" "$BRANCH" "$(git rev-parse --short HEAD)"
