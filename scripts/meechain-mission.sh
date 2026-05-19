#!/bin/bash
# ===== MeeChain Mission Control — Full Badge Automation Flow =====
# Runs all test suites, detects earned badges, renders the badge board.
# Usage:
#   bash scripts/meechain-mission.sh                      (localhost:5000)
#   bash scripts/meechain-mission.sh rpc.meechain.live   (production)
#   bash scripts/meechain-mission.sh localhost:5000 --quiet

TARGET="${1:-localhost:5000}"
QUIET="${2:-}"
DIR="$(cd "$(dirname "$0")" && pwd)"
RESULTS_FILE="/tmp/meechain-badge-results.json"
LOG_QA="/tmp/meechain-qa.log"
LOG_WS="/tmp/meechain-ws.log"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; WHITE='\033[1;37m'; NC='\033[0m'

# ── Helpers ───────────────────────────────────────────────────────
step() { echo -e "\n${CYAN}▶  $1${NC}"; }
ok()   { echo -e "   ${GREEN}✅  $1${NC}"; }
warn() { echo -e "   ${YELLOW}⚠️   $1${NC}"; }
info() { echo -e "   ${WHITE}$1${NC}"; }

badge_found() {
  local badge="$1"; local log="$2"
  grep -qF "$badge" "$log" 2>/dev/null
}

# ── Banner ────────────────────────────────────────────────────────
clear
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       🚀  MeeChain Mission Control  🚀                      ║"
echo "║       Full Badge Automation Flow                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  Target : ${CYAN}${TARGET}${NC}"
echo -e "  Time   : $(date)"
echo -e "  Logs   : ${YELLOW}${LOG_QA}${NC}  ${YELLOW}${LOG_WS}${NC}"

# ── Phase 1: QA Production Test ───────────────────────────────────
step "Phase 1 — QA Production Test (test-production.sh)"
info "Running against: ${TARGET}"

if [ -f "$DIR/test-production.sh" ]; then
  bash "$DIR/test-production.sh" "$TARGET" 2>&1 | tee "$LOG_QA" | \
    ([ "$QUIET" = "--quiet" ] && grep -E "PASS|FAIL|badge|QA_GUARDIAN|DEBUG_SLAYER|NETWORK|SECURITY|API_MASTER|SPEED" || cat)
  QA_EXIT=${PIPESTATUS[0]}
  ok "Phase 1 complete (exit $QA_EXIT)"
else
  warn "test-production.sh not found — skipping"
  QA_EXIT=1
  echo "" > "$LOG_QA"
fi

# ── Phase 2: WebSocket Test ───────────────────────────────────────
step "Phase 2 — WebSocket Full-Stack Test (test-websocket.sh)"
info "Running against: ${TARGET}"

if [ -f "$DIR/test-websocket.sh" ]; then
  bash "$DIR/test-websocket.sh" "$TARGET" 2>&1 | tee "$LOG_WS" | \
    ([ "$QUIET" = "--quiet" ] && grep -E "PASS|FAIL|SOCKET|TUNNEL|WS_" || cat)
  WS_EXIT=${PIPESTATUS[0]}
  ok "Phase 2 complete (exit $WS_EXIT)"
else
  warn "test-websocket.sh not found — skipping"
  WS_EXIT=1
  echo "" > "$LOG_WS"
fi

# ── Phase 3: Collect badge results ───────────────────────────────
step "Phase 3 — Collecting badge results"

# Note: qa-badge.js prints badge names with SPACES (e.g. "QA GUARDIAN")
# Check QA badges from Phase 1 log
R_QA_GUARDIAN=false;     badge_found "QA GUARDIAN"      "$LOG_QA" && R_QA_GUARDIAN=true
R_DEBUG_SLAYER=false;    badge_found "DEBUG SLAYER"      "$LOG_QA" && R_DEBUG_SLAYER=true
R_NETWORK_WATCHER=false; badge_found "NETWORK WATCHER"  "$LOG_QA" && R_NETWORK_WATCHER=true
R_SECURITY_KEEPER=false; badge_found "SECURITY KEEPER"  "$LOG_QA" && R_SECURITY_KEEPER=true
R_API_MASTER=false;      badge_found "API MASTER"        "$LOG_QA" && R_API_MASTER=true
R_SPEED_RUNNER=false;    badge_found "SPEED RUNNER"      "$LOG_QA" && R_SPEED_RUNNER=true

# Check WS badges from Phase 2 log
R_SOCKET_LINKED=false;   badge_found "SOCKET LINKED"    "$LOG_WS" && R_SOCKET_LINKED=true
R_WS_GUARDIAN=false;     badge_found "WS GUARDIAN"      "$LOG_WS" && R_WS_GUARDIAN=true
R_TUNNEL_MASTER=false;   badge_found "TUNNEL MASTER"    "$LOG_WS" && R_TUNNEL_MASTER=true
R_SOCKET_SLAYER=false;   badge_found "SOCKET SLAYER"    "$LOG_WS" && R_SOCKET_SLAYER=true

# Write JSON results
cat > "$RESULTS_FILE" <<ENDJSON
{
  "QA_GUARDIAN":     $R_QA_GUARDIAN,
  "DEBUG_SLAYER":    $R_DEBUG_SLAYER,
  "NETWORK_WATCHER": $R_NETWORK_WATCHER,
  "SECURITY_KEEPER": $R_SECURITY_KEEPER,
  "API_MASTER":      $R_API_MASTER,
  "SPEED_RUNNER":    $R_SPEED_RUNNER,
  "SOCKET_LINKED":   $R_SOCKET_LINKED,
  "WS_GUARDIAN":     $R_WS_GUARDIAN,
  "TUNNEL_MASTER":   $R_TUNNEL_MASTER,
  "SOCKET_SLAYER":   $R_SOCKET_SLAYER,
  "_meta": {
    "target":    "${TARGET}",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "qa_exit":   $QA_EXIT,
    "ws_exit":   $WS_EXIT
  }
}
ENDJSON

ok "Results saved → ${RESULTS_FILE}"
info "$(cat "$RESULTS_FILE" | grep -v '_meta' | grep 'true' | wc -l | tr -d ' ') badges earned this run"

# ── Phase 4: Render Badge Board ───────────────────────────────────
step "Phase 4 — Badge Board"
echo ""
node "$DIR/badge-board.js" --results "$RESULTS_FILE"

# ── Phase 5: Mission Summary ──────────────────────────────────────
EARNED=$(cat "$RESULTS_FILE" | grep -v '_meta' | grep '"true"' | wc -l)
EARNED=$(cat "$RESULTS_FILE" | grep -E ':\s+true' | wc -l | tr -d ' ')

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${WHITE}Mission Result${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$QA_EXIT" -eq 0 ] && [ "$WS_EXIT" -eq 0 ]; then
  echo -e "  ${GREEN}🎉 ALL SYSTEMS GO — ทุก phase ผ่านหมด! ${NC}"
  echo -e "  ${GREEN}   MeeChain stack is production-ready 🚀${NC}"
elif [ "$QA_EXIT" -eq 0 ]; then
  echo -e "  ${YELLOW}⚠️  QA OK · WS มีปัญหาบางส่วน${NC}"
  echo -e "     ตรวจสอบ WS server / Cloudflare tunnel"
elif [ "$WS_EXIT" -eq 0 ]; then
  echo -e "  ${YELLOW}⚠️  WS OK · QA มีปัญหาบางส่วน${NC}"
  echo -e "     ตรวจสอบ API endpoints / SSL / DNS"
else
  echo -e "  ${RED}❌ Both phases have failures${NC}"
  echo -e "     ตรวจสอบ server: curl http://${TARGET}/api/health"
fi

echo ""
echo -e "  ${WHITE}Quick re-run:${NC}"
echo -e "    ${CYAN}bash scripts/meechain-mission.sh ${TARGET}${NC}"
echo -e "    ${CYAN}bash scripts/meechain-mission.sh ${TARGET} --quiet${NC}  ${YELLOW}# compact output${NC}"
echo ""
echo -e "  ${WHITE}View board only (no tests):${NC}"
echo -e "    ${CYAN}node scripts/badge-board.js --results ${RESULTS_FILE}${NC}"
echo ""
