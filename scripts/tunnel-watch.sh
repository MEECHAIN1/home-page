#!/bin/bash
# ===== Cloudflare Tunnel Watchdog =====
# Auto-reconnects if tunnel drops, shows live status

set -o pipefail

BINARY="$(cd "$(dirname "$0")/.." && pwd)/cloudflared"
MAX_WAIT=30     # max seconds between retries
ATTEMPT=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

if [ -z "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
  echo -e "${RED}❌ CLOUDFLARE_TUNNEL_TOKEN not set${NC}"
  exit 1
fi

# Download binary if missing
if [ ! -f "$BINARY" ]; then
  echo -e "${YELLOW}⬇️  Downloading cloudflared...${NC}"
  curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
    -o "$BINARY" && chmod +x "$BINARY"
fi

banner() {
  clear
  echo -e "${CYAN}"
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║         🌐 Cloudflare Tunnel Watchdog 🌐             ║"
  echo "║         rpc.meechain.live → localhost:5000           ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

while true; do
  ATTEMPT=$((ATTEMPT + 1))
  STARTED_AT=$(date '+%Y-%m-%d %H:%M:%S')

  banner
  echo -e "  ${WHITE}Attempt   :${NC} ${CYAN}#${ATTEMPT}${NC}"
  echo -e "  ${WHITE}Started   :${NC} $STARTED_AT"
  echo -e "  ${WHITE}Binary    :${NC} $BINARY"
  echo -e "  ${WHITE}Protocol  :${NC} HTTP/2 (TCP)"
  echo -e "  ${WHITE}Target    :${NC} http://localhost:5000"
  echo ""
  echo -e "  ${GREEN}▶ Connecting to Cloudflare edge...${NC}"
  echo -e "  ${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Run tunnel with stability flags:
  # --retries 0          = unlimited connection retries per session
  # --grace-period       = wait before shutdown so in-flight requests finish
  # --heartbeat-interval = send heartbeats to keep edge connections alive
  # --heartbeat-count    = reconnect after this many missed heartbeats
  "$BINARY" tunnel \
    --no-autoupdate \
    --protocol http2 \
    --retries 0 \
    --grace-period 30s \
    --heartbeat-interval 10s \
    --heartbeat-count 5 \
    run --token "$CLOUDFLARE_TUNNEL_TOKEN"

  EXIT_CODE=$?
  STOPPED_AT=$(date '+%Y-%m-%d %H:%M:%S')

  echo ""
  echo -e "  ${RED}⚠️  Tunnel exited (code: $EXIT_CODE) at $STOPPED_AT${NC}"

  # Exponential back-off: 2s, 4s, 8s, 16s … capped at MAX_WAIT
  WAIT=$(( 2 ** (ATTEMPT < 5 ? ATTEMPT : 5) ))
  if [ $WAIT -gt $MAX_WAIT ]; then WAIT=$MAX_WAIT; fi

  echo -e "  ${YELLOW}🔄 Reconnecting in ${WAIT}s... (attempt #$((ATTEMPT+1)))${NC}"
  sleep $WAIT
done
