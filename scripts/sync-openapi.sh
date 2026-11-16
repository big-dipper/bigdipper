#!/bin/sh
# Copy Little Dipper's generated API spec into the docs. Run after a Little Dipper release.
#   LD_REPO=../little-dipper sh scripts/sync-openapi.sh
set -e
LD_REPO="${LD_REPO:-../little-dipper}"
cp "$LD_REPO/docs/openapi.json" "$(dirname "$0")/../openapi/little-dipper.json"
echo "Copied the API spec for Little Dipper $(node -p "require('$LD_REPO/package.json').version")."
