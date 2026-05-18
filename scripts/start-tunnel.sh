#!/bin/bash
# ===== Cloudflare Tunnel Starter =====
# Uses cloudflared binary (no Docker required)
# Set CLOUDFLARE_TUNNEL_TOKEN in Replit Secrets before running

if [ -z "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
  echo "❌ CLOUDFLARE_TUNNEL_TOKEN is not set."
  echo "   Add it in Replit Secrets panel first."
  exit 1
fi

BINARY="$(dirname "$0")/../cloudflared"
if [ ! -f "$BINARY" ]; then
  echo "⬇️  cloudflared binary not found — downloading..."
  curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
    -o "$BINARY" && chmod +x "$BINARY"
fi

echo "🚀 Starting Cloudflare tunnel..."
echo "   Binary : $BINARY"
echo "   Token  : ${CLOUDFLARE_TUNNEL_TOKEN:0:20}..."
echo ""

"$BINARY" tunnel --no-autoupdate run --token "$CLOUDFLARE_TUNNEL_TOKEN"
