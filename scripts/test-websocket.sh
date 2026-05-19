#!/bin/bash
# ===== Websocat / WebSocket Connection Tester =====
# Tests both /ws (MeeBot chat) and /ws/rpc (JSON-RPC) endpoints
# Usage: bash scripts/test-websocket.sh [host:port]

HOST="${1:-localhost:5000}"
HTTP_URL="http://${HOST}"
WS_URL="ws://${HOST}"
BADGE_SCRIPT="$(dirname "$0")/qa-badge.js"
PASSED=0
FAILED=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}✅ PASS:${NC} $1"; ((PASSED++)); }
fail() { echo -e "  ${RED}❌ FAIL:${NC} $1"; ((FAILED++)); }
info() { echo -e "  ${YELLOW}Testing:${NC} $1"; }
header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

clear
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🔗 MeeChain WebSocket Full-Stack Test Suite  🔗         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  Host   : ${CYAN}${HOST}${NC}"
echo -e "  WS Chat: ${CYAN}${WS_URL}/ws${NC}"
echo -e "  WS RPC : ${CYAN}${WS_URL}/ws/rpc${NC}"
echo -e "  Date   : $(date)"
echo ""

# ── 1. Environment ────────────────────────────────────────────────
header "🔧 Environment Check"

info "Node.js available"
if command -v node > /dev/null 2>&1; then
  pass "node $(node -v)"
else
  fail "node not found"
fi

info "websocat binary"
if command -v websocat > /dev/null 2>&1; then
  pass "websocat $(websocat --version 2>&1 | head -1)"
else
  echo -e "  ${YELLOW}⚠️  SKIP:${NC} websocat not installed (install: pkg install websocat)"
fi

info "Server HTTP reachable"
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${HTTP_URL}/api/health" 2>/dev/null)
if [ "$CODE" = "200" ]; then
  pass "HTTP 200 from /api/health"
else
  fail "HTTP ${CODE} from /api/health — is server running?"
fi

# ── 2. /ws Chat endpoint ──────────────────────────────────────────
header "🤖 /ws — MeeBot Chat WebSocket"

info "WS upgrade handshake (101)"
WS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Upgrade: websocket" \
  -H "Connection: Upgrade" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  --max-time 5 "${HTTP_URL}/ws" 2>/dev/null)

if [ "$WS_CODE" = "101" ]; then
  pass "/ws handshake HTTP 101 Switching Protocols"
  node "$BADGE_SCRIPT" SOCKET_LINKED 2>/dev/null || true
else
  fail "/ws returned HTTP ${WS_CODE} (expected 101)"
fi

info "WS chat message flow (Node.js client)"
WS_CHAT_RESULT=$(timeout 12 node -e "
const { WebSocket } = require('ws');
const ws = new WebSocket('${WS_URL}/ws');
let chunks = 0; let replied = false;
ws.on('open', () => {
  ws.send(JSON.stringify({ type:'chat', message:'สวัสดี', sessionId:'qa-test' }));
});
ws.on('message', (d) => {
  const m = JSON.parse(d);
  if (m.type === 'delta') chunks++;
  if (m.type === 'done') { replied = true; console.log('DONE:'+chunks); ws.close(); }
  if (m.type === 'error') { console.log('AI_ERR:'+m.error); ws.close(); }
});
ws.on('error', (e) => { console.log('WS_ERR:'+e.message); });
setTimeout(() => { if (!replied) console.log('TIMEOUT'); ws.close(); }, 10000);
" 2>/dev/null || echo "TIMEOUT")

if echo "$WS_CHAT_RESULT" | grep -q "DONE:"; then
  CHUNKS=$(echo "$WS_CHAT_RESULT" | grep -o 'DONE:[0-9]*' | cut -d: -f2)
  pass "/ws chat streaming — ${CHUNKS} delta chunks received"
  node "$BADGE_SCRIPT" WS_GUARDIAN 2>/dev/null || true
elif echo "$WS_CHAT_RESULT" | grep -q "AI_ERR:"; then
  pass "/ws connected (AI error — check OpenAI key, WS transport OK)"
else
  fail "/ws chat failed: ${WS_CHAT_RESULT}"
fi

# ── 3. /ws/rpc JSON-RPC endpoint ─────────────────────────────────
header "⛓️  /ws/rpc — JSON-RPC over WebSocket"

info "WS upgrade handshake /ws/rpc (101)"
RPC_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Upgrade: websocket" \
  -H "Connection: Upgrade" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  --max-time 5 "${HTTP_URL}/ws/rpc" 2>/dev/null)

if [ "$RPC_CODE" = "101" ]; then
  pass "/ws/rpc handshake HTTP 101 Switching Protocols"
else
  fail "/ws/rpc returned HTTP ${RPC_CODE} (expected 101)"
fi

info "eth_chainId → 0x344e (13390)"
CHAIN_RESULT=$(timeout 5 node -e "
const { WebSocket } = require('ws');
const ws = new WebSocket('${WS_URL}/ws/rpc');
ws.on('open', () => ws.send(JSON.stringify({ jsonrpc:'2.0', id:1, method:'eth_chainId', params:[] })));
ws.on('message', (d) => { const r=JSON.parse(d); console.log(r.result||r.error); ws.close(); });
ws.on('error', e => { console.log('ERR:'+e.message); });
setTimeout(() => ws.close(), 4000);
" 2>/dev/null || echo "TIMEOUT")

if echo "$CHAIN_RESULT" | grep -qi "0x344e"; then
  pass "eth_chainId = ${CHAIN_RESULT} (MeeChain 13390 ✓)"
else
  fail "eth_chainId unexpected: ${CHAIN_RESULT}"
fi

info "mee_chainStats (blockNumber, gasPrice)"
STATS_RESULT=$(timeout 5 node -e "
const { WebSocket } = require('ws');
const ws = new WebSocket('${WS_URL}/ws/rpc');
ws.on('open', () => ws.send(JSON.stringify({ jsonrpc:'2.0', id:1, method:'mee_chainStats', params:[] })));
ws.on('message', (d) => {
  const r=JSON.parse(d);
  if (r.result) console.log('OK:'+r.result.chainId+':'+r.result.blockNumber);
  else console.log('ERR:'+JSON.stringify(r.error));
  ws.close();
});
ws.on('error', e => { console.log('ERR:'+e.message); });
setTimeout(() => ws.close(), 4000);
" 2>/dev/null || echo "TIMEOUT")

if echo "$STATS_RESULT" | grep -q "OK:"; then
  INFO=$(echo "$STATS_RESULT" | sed 's/OK://') 
  pass "mee_chainStats — chainId:blockNumber = ${INFO}"
else
  fail "mee_chainStats failed: ${STATS_RESULT}"
fi

info "mee_recentTx (ledger transactions)"
TX_RESULT=$(timeout 5 node -e "
const { WebSocket } = require('ws');
const ws = new WebSocket('${WS_URL}/ws/rpc');
ws.on('open', () => ws.send(JSON.stringify({ jsonrpc:'2.0', id:1, method:'mee_recentTx', params:[] })));
ws.on('message', (d) => {
  const r=JSON.parse(d);
  if (Array.isArray(r.result)) console.log('OK:'+r.result.length);
  else console.log('ERR');
  ws.close();
});
ws.on('error', e => { console.log('ERR'); });
setTimeout(() => ws.close(), 4000);
" 2>/dev/null || echo "TIMEOUT")

if echo "$TX_RESULT" | grep -q "OK:"; then
  COUNT=$(echo "$TX_RESULT" | sed 's/OK://')
  pass "mee_recentTx — ${COUNT} transactions returned"
else
  fail "mee_recentTx failed: ${TX_RESULT}"
fi

info "mee_ledgerBalance (demo address)"
BAL_RESULT=$(timeout 5 node -e "
const { WebSocket } = require('ws');
const ws = new WebSocket('${WS_URL}/ws/rpc');
ws.on('open', () => ws.send(JSON.stringify({ jsonrpc:'2.0', id:1, method:'mee_ledgerBalance', params:['0x0000000000000000000000000000000000000001'] })));
ws.on('message', (d) => {
  const r=JSON.parse(d);
  if (r.result) console.log('OK:'+r.result.balance);
  else console.log('ERR');
  ws.close();
});
ws.on('error', e => { console.log('ERR'); });
setTimeout(() => ws.close(), 4000);
" 2>/dev/null || echo "TIMEOUT")

if echo "$BAL_RESULT" | grep -q "OK:"; then
  BAL=$(echo "$BAL_RESULT" | sed 's/OK://')
  pass "mee_ledgerBalance — ${BAL} MEE"
else
  fail "mee_ledgerBalance failed: ${BAL_RESULT}"
fi

info "Unknown method returns -32601"
ERR_RESULT=$(timeout 5 node -e "
const { WebSocket } = require('ws');
const ws = new WebSocket('${WS_URL}/ws/rpc');
ws.on('open', () => ws.send(JSON.stringify({ jsonrpc:'2.0', id:1, method:'fake_method', params:[] })));
ws.on('message', (d) => {
  const r=JSON.parse(d);
  console.log(r.error ? 'ERR:'+r.error.code : 'NO_ERR');
  ws.close();
});
ws.on('error', e => { console.log('FAIL'); });
setTimeout(() => ws.close(), 4000);
" 2>/dev/null || echo "TIMEOUT")

if echo "$ERR_RESULT" | grep -q "ERR:-32601"; then
  pass "Unknown method returns JSON-RPC error -32601 (Method not found)"
else
  fail "Error handling unexpected: ${ERR_RESULT}"
fi

# ── 4. Websocat cheat sheet ───────────────────────────────────────
header "📋 Websocat Quick Reference"

echo -e "  ${WHITE}Install (Termux):${NC}"
echo -e "    ${CYAN}pkg install websocat${NC}"
echo ""
echo -e "  ${WHITE}Connect to MeeChain WS Chat:${NC}"
echo -e "    ${CYAN}websocat ${WS_URL}/ws${NC}"
echo -e "    ${CYAN}# แล้วพิมพ์: {\"type\":\"chat\",\"message\":\"สวัสดี\",\"sessionId\":\"myid\"}${NC}"
echo ""
echo -e "  ${WHITE}Connect to MeeChain WS RPC:${NC}"
echo -e "    ${CYAN}websocat ${WS_URL}/ws/rpc${NC}"
echo -e "    ${CYAN}# แล้วพิมพ์: {\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_chainId\",\"params\":[]}${NC}"
echo ""
echo -e "  ${WHITE}ผ่าน Cloudflare Tunnel:${NC}"
echo -e "    ${CYAN}websocat wss://rpc.meechain.live/ws/rpc${NC}"
echo ""
echo -e "  ${WHITE}Binary mode + EOF guard (stable bridge):${NC}"
echo -e "    ${CYAN}websocat --binary -E ws-l:127.0.0.1:8080 tcp:127.0.0.1:5678${NC}"
echo ""
echo -e "  ${WHITE}JSON-RPC methods available:${NC}"
echo -e "    ${YELLOW}eth_chainId${NC}        chain ID"
echo -e "    ${YELLOW}eth_blockNumber${NC}    block number"
echo -e "    ${YELLOW}eth_gasPrice${NC}       gas price"
echo -e "    ${YELLOW}eth_getBalance${NC}     [address]"
echo -e "    ${YELLOW}mee_tokenBalance${NC}   [address]"
echo -e "    ${YELLOW}mee_nftBalance${NC}     [address]"
echo -e "    ${YELLOW}mee_stakingInfo${NC}    staking pool"
echo -e "    ${YELLOW}mee_ledgerBalance${NC}  [address]"
echo -e "    ${YELLOW}mee_chainStats${NC}     block + gas"
echo -e "    ${YELLOW}mee_recentTx${NC}       last 10 txs"

# ── 5. Summary ────────────────────────────────────────────────────
header "📊 Summary"
TOTAL=$((PASSED + FAILED))
echo -e "  ${WHITE}Passed :${NC} ${GREEN}$PASSED${NC}  ${WHITE}Failed :${NC} ${RED}$FAILED${NC}  ${WHITE}Total :${NC} ${BLUE}$TOTAL${NC}"
echo ""

if [ "$FAILED" -eq 0 ]; then
  node "$BADGE_SCRIPT" TUNNEL_MASTER "$PASSED" "$FAILED" "$TOTAL" 2>/dev/null || true
  exit 0
else
  node "$BADGE_SCRIPT" SOCKET_SLAYER "$PASSED" "$FAILED" "$TOTAL" 2>/dev/null || true
  echo -e "  ${YELLOW}Tips:${NC}"
  echo "    • Server รันอยู่?     curl http://localhost:5000/api/health"
  echo "    • WS ทดสอบตรง:       node -e \"const {WebSocket}=require('ws'); const w=new WebSocket('ws://localhost:5000/ws/rpc'); w.on('open',()=>console.log('OK'))\""
  echo "    • ติดตั้ง websocat:   pkg install websocat (Termux)"
  echo ""
  exit 1
fi
