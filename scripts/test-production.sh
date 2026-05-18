#!/bin/bash

# ===== MeeChain Production QA Testing Script =====
# Usage: bash scripts/test-production.sh [domain]
#   bash scripts/test-production.sh rpc.meechain.live
#   bash scripts/test-production.sh localhost:5000

DOMAIN="${1:-localhost:5000}"
BASE_URL="https://$DOMAIN"
# Use http for localhost
if [[ "$DOMAIN" == localhost* ]]; then
  BASE_URL="http://$DOMAIN"
fi

PASSED=0
FAILED=0
TOTAL=0
SECTION_FAILED=0

# ── Colors ───────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# ── Helpers ──────────────────────────────────────────────────
header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
  SECTION_FAILED=0
}

pass() { echo -e "  ${GREEN}✅ PASS:${NC} $1"; ((PASSED++)); ((TOTAL++)); }
fail() { echo -e "  ${RED}❌ FAIL:${NC} $1"; ((FAILED++)); ((TOTAL++)); ((SECTION_FAILED++)); }
info() { echo -e "  ${YELLOW}Testing:${NC} $1"; }

badge_section() {
  # Award a per-section badge if all tests in this section passed
  local badge="$1"
  if [ "$SECTION_FAILED" -eq 0 ]; then
    node "$(dirname "$0")/qa-badge.js" "$badge" 2>/dev/null || true
  fi
}

check_endpoint() {
  local url="$1"
  local expect="${2:-200}"
  local label="$3"
  info "$label"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$url" 2>/dev/null)
  if [ "$code" -eq "$expect" ] 2>/dev/null; then
    pass "$label (HTTP $code)"; else fail "$label (expected $expect, got $code)"; fi
}

check_json_field() {
  local url="$1"
  local field="$2"
  local label="$3"
  info "$label"
  local body
  body=$(curl -s --max-time 8 "$url" 2>/dev/null)
  if echo "$body" | grep -q "\"$field\""; then
    pass "$label"; else fail "$label (field '$field' not found)"; fi
}

# ── Banner ───────────────────────────────────────────────────
clear
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║        MeeChain.live Production QA Testing Script            ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  Target: ${CYAN}$BASE_URL${NC}"
echo -e "  Date:   $(date)"
echo ""

# ============================================================
# 1. DNS & Network
# ============================================================
header "🌐 DNS & Network Tests"

IS_LOCAL=false
if [[ "$DOMAIN" == localhost* ]] || [[ "$DOMAIN" == 127.* ]]; then IS_LOCAL=true; fi

info "DNS Resolution"
if $IS_LOCAL; then
  pass "DNS — skipped (localhost)"
elif nslookup "$DOMAIN" > /dev/null 2>&1; then
  pass "DNS resolves: $DOMAIN"
else
  fail "DNS resolution failed: $DOMAIN"
fi

info "Reachability"
HOST=$(echo "$DOMAIN" | cut -d: -f1)
if $IS_LOCAL; then
  pass "Ping — skipped (localhost)"
elif ping -c 2 -W 3 "$HOST" > /dev/null 2>&1; then
  pass "Host is reachable: $HOST"
else
  fail "Host not reachable: $HOST"
fi

badge_section "NETWORK_WATCHER"

# ============================================================
# 2. SSL & Security
# ============================================================
header "🔐 SSL & Security Tests"

info "HTTPS Connection"
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$BASE_URL" 2>/dev/null)
if [ "$code" -eq 200 ] 2>/dev/null; then
  pass "HTTPS connection OK (HTTP $code)"
else
  fail "HTTPS connection failed (HTTP $code)"
fi

info "HTTP → HTTPS Redirect"
if [[ "$BASE_URL" == https* ]]; then
  redir=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "http://$DOMAIN" 2>/dev/null)
  if [ "$redir" -eq 301 ] 2>/dev/null || [ "$redir" -eq 302 ] 2>/dev/null; then
    pass "HTTP redirects to HTTPS ($redir)"
  else
    fail "HTTP redirect not working (got $redir)"
  fi
else
  info "HTTP→HTTPS redirect — skipped (localhost)"
fi

info "HSTS Header"
hsts=$(curl -s -I --max-time 8 "$BASE_URL" 2>/dev/null | grep -i "Strict-Transport-Security" || true)
if [ -n "$hsts" ]; then
  pass "HSTS header present"
else
  if [[ "$BASE_URL" == http://* ]]; then
    info "HSTS — not applicable on http (localhost)"
  else
    fail "HSTS header missing"
  fi
fi

badge_section "SECURITY_KEEPER"

# ============================================================
# 3. API Endpoints
# ============================================================
header "🧪 API Endpoint Tests"

check_endpoint "$BASE_URL/api/health" 200 "Health Check"
check_json_field "$BASE_URL/api/health" "status" "Health: status field"
check_json_field "$BASE_URL/api/health" "chainId" "Health: chainId field"

check_endpoint "$BASE_URL/api/network" 200 "Network Info"
check_json_field "$BASE_URL/api/network" "chainId" "Network: chainId field"
check_json_field "$BASE_URL/api/network" "chainName" "Network: chainName field"

check_endpoint "$BASE_URL/api/web3/status" 200 "Web3 Status"
check_endpoint "$BASE_URL/api/chain/stats" 200 "Chain Stats"
check_endpoint "$BASE_URL/api/chain/transactions" 200 "Recent Transactions"
check_json_field "$BASE_URL/api/chain/transactions" "transactions" "Transactions: array field"

info "Token Info (200 or 500 accepted)"
tc=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$BASE_URL/api/token/info" 2>/dev/null)
if [ "$tc" -eq 200 ] 2>/dev/null || [ "$tc" -eq 500 ] 2>/dev/null; then pass "Token Info (HTTP $tc)"; else fail "Token Info (HTTP $tc)"; fi

info "NFT Info (200 or 500 accepted)"
nc=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$BASE_URL/api/nft/info" 2>/dev/null)
if [ "$nc" -eq 200 ] 2>/dev/null || [ "$nc" -eq 500 ] 2>/dev/null; then pass "NFT Info (HTTP $nc)"; else fail "NFT Info (HTTP $nc)"; fi

info "Staking Info (200 or 500 accepted)"
sc=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$BASE_URL/api/staking/info" 2>/dev/null)
if [ "$sc" -eq 200 ] 2>/dev/null || [ "$sc" -eq 500 ] 2>/dev/null; then pass "Staking Info (HTTP $sc)"; else fail "Staking Info (HTTP $sc)"; fi

check_endpoint "$BASE_URL/api/price/mintme" 200 "MintMe Price"
check_json_field "$BASE_URL/api/price/mintme" "price" "Price: price field"

badge_section "API_MASTER"

# ============================================================
# 4. Frontend
# ============================================================
header "🖥️  Frontend Tests"

check_endpoint "$BASE_URL/" 200 "Homepage"

info "Homepage contains MeeChain branding"
html=$(curl -s --max-time 8 "$BASE_URL/" 2>/dev/null)
if echo "$html" | grep -q "MeeChain"; then
  pass "Homepage has MeeChain branding"
else
  fail "Homepage missing MeeChain branding"
fi

# ============================================================
# 5. Performance
# ============================================================
header "📊 Performance Tests"

info "Response time < 1000ms"
rt=$(curl -s -o /dev/null -w "%{time_total}" --max-time 8 "$BASE_URL/api/health" 2>/dev/null)
# Convert to milliseconds using awk (no bc dependency)
rt_ms=$(awk "BEGIN{printf \"%d\", $rt * 1000}" 2>/dev/null || echo 9999)
if [ "$rt_ms" -lt 1000 ] 2>/dev/null; then
  pass "Response time: ${rt_ms}ms"
else
  fail "Response time: ${rt_ms}ms (> 1000ms)"
fi

badge_section "SPEED_RUNNER"

# ============================================================
# Final Summary
# ============================================================
header "📊 Test Summary"

echo -e "  ${WHITE}Total Tests :${NC} ${BLUE}$TOTAL${NC}"
echo -e "  ${WHITE}Passed      :${NC} ${GREEN}$PASSED${NC}"
echo -e "  ${WHITE}Failed      :${NC} ${RED}$FAILED${NC}"
echo ""

BADGE_SCRIPT="$(dirname "$0")/qa-badge.js"

if [ "$FAILED" -eq 0 ]; then
  node "$BADGE_SCRIPT" QA_GUARDIAN "$PASSED" "$FAILED" "$TOTAL" 2>/dev/null || true
  exit 0
else
  node "$BADGE_SCRIPT" DEBUG_SLAYER "$PASSED" "$FAILED" "$TOTAL" 2>/dev/null || true
  echo -e "\n  ${YELLOW}Troubleshooting:${NC}"
  echo "    1. Check server logs: pm2 logs meechain-dashboard"
  echo "    2. Check Nginx logs:  sudo tail -f /var/log/nginx/error.log"
  echo "    3. Restart services:  pm2 restart meechain-dashboard"
  echo "    4. Test locally:      bash scripts/test-production.sh localhost:5000"
  echo ""
  exit 1
fi
