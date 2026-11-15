#!/bin/sh
# The service kit lives in the Little Dipper repo, next to the protocol it must match. Until it's published as a
# package, Big Dipper keeps a copy: run this after the kit changes (LD_REPO points at a Little Dipper checkout).
set -e
LD_REPO="${LD_REPO:-../../little-dipper}"
cp "$LD_REPO/kit/protocol.ts" "$LD_REPO/kit/service.ts" src/kit/
echo "Copied the service kit from $LD_REPO/kit"
