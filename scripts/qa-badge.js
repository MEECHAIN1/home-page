#!/usr/bin/env node
// ===== QA Badge Overlay — Node.js Terminal Renderer =====
// Usage: node scripts/qa-badge.js <BADGE_NAME> [passed] [failed] [total]
//   node scripts/qa-badge.js QA_GUARDIAN 20 0 20
//   node scripts/qa-badge.js DEBUG_SLAYER 15 5 20

const badge   = process.argv[2] || 'QA_GUARDIAN';
const passed  = parseInt(process.argv[3]) || 0;
const failed  = parseInt(process.argv[4]) || 0;
const total   = parseInt(process.argv[5]) || 0;

const R  = '\x1b[0;31m';
const G  = '\x1b[0;32m';
const Y  = '\x1b[1;33m';
const B  = '\x1b[0;34m';
const C  = '\x1b[0;36m';
const M  = '\x1b[0;35m';
const W  = '\x1b[1;37m';
const NC = '\x1b[0m';

const BADGES = {
  QA_GUARDIAN: {
    color: G,
    lines: [
      '╔══════════════════════════════════════╗',
      '║                                      ║',
      '║   🟢  QA GUARDIAN  🟢               ║',
      '║                                      ║',
      '║   ทุกการทดสอบผ่านเรียบร้อย!          ║',
      '║   Production is READY ✅             ║',
      '║                                      ║',
      '╚══════════════════════════════════════╝',
    ],
  },
  DEBUG_SLAYER: {
    color: R,
    lines: [
      '╔══════════════════════════════════════╗',
      '║                                      ║',
      '║   🔴  DEBUG SLAYER  🔴              ║',
      '║                                      ║',
      '║   พบข้อผิดพลาด → ต้องแก้ไข!         ║',
      '║   Review failed tests above ⚠️        ║',
      '║                                      ║',
      '╚══════════════════════════════════════╝',
    ],
  },
  NETWORK_WATCHER: {
    color: B,
    lines: [
      '╔══════════════════════════════════════╗',
      '║                                      ║',
      '║   🌐  NETWORK WATCHER  🌐           ║',
      '║                                      ║',
      '║   DNS & Ping ผ่าน ✅                 ║',
      '║   Network layer is healthy           ║',
      '║                                      ║',
      '╚══════════════════════════════════════╝',
    ],
  },
  SECURITY_KEEPER: {
    color: Y,
    lines: [
      '╔══════════════════════════════════════╗',
      '║                                      ║',
      '║   🔐  SECURITY KEEPER  🔐           ║',
      '║                                      ║',
      '║   HTTPS + HSTS header ถูกต้อง        ║',
      '║   Security posture is strong 🛡️       ║',
      '║                                      ║',
      '╚══════════════════════════════════════╝',
    ],
  },
  API_MASTER: {
    color: C,
    lines: [
      '╔══════════════════════════════════════╗',
      '║                                      ║',
      '║   🧪  API MASTER  🧪               ║',
      '║                                      ║',
      '║   ทุก endpoint ตอบกลับครบ            ║',
      '║   All APIs are operational 🚀        ║',
      '║                                      ║',
      '╚══════════════════════════════════════╝',
    ],
  },
  SPEED_RUNNER: {
    color: M,
    lines: [
      '╔══════════════════════════════════════╗',
      '║                                      ║',
      '║   📊  SPEED RUNNER  📊              ║',
      '║                                      ║',
      '║   Response time < 1000ms ⚡          ║',
      '║   Performance target met!            ║',
      '║                                      ║',
      '╚══════════════════════════════════════╝',
    ],
  },

  // ── Websocat / WebSocket Badges ──────────────────────────────
  SOCKET_LINKED: {
    color: G,
    lines: [
      '╔══════════════════════════════════════╗',
      '║                                      ║',
      '║   🔗  SOCKET LINKED  🔗             ║',
      '║                                      ║',
      '║   WebSocket handshake สำเร็จ ✅       ║',
      '║   TCP ↔ WS bridge is LIVE 🟢         ║',
      '║                                      ║',
      '╚══════════════════════════════════════╝',
    ],
  },
  WS_GUARDIAN: {
    color: C,
    lines: [
      '╔══════════════════════════════════════╗',
      '║                                      ║',
      '║   🛡️   WS GUARDIAN  🛡️              ║',
      '║                                      ║',
      '║   WebSocket tunnel เสถียร ⚡          ║',
      '║   Binary mode + EOF guard active     ║',
      '║                                      ║',
      '╚══════════════════════════════════════╝',
    ],
  },
  TUNNEL_MASTER: {
    color: B,
    lines: [
      '╔══════════════════════════════════════╗',
      '║                                      ║',
      '║   🌐  TUNNEL MASTER  🌐             ║',
      '║                                      ║',
      '║   Cloudflare + Websocat พร้อมแล้ว    ║',
      '║   Full-stack tunnel stack ONLINE 🚀  ║',
      '║                                      ║',
      '╚══════════════════════════════════════╝',
    ],
  },
  SOCKET_SLAYER: {
    color: R,
    lines: [
      '╔══════════════════════════════════════╗',
      '║                                      ║',
      '║   💀  SOCKET SLAYER  💀             ║',
      '║                                      ║',
      '║   WebSocket connection ล้มเหลว ❌     ║',
      '║   ตรวจสอบ port / token / firewall    ║',
      '║                                      ║',
      '╚══════════════════════════════════════╝',
    ],
  },
};

function render(badgeKey, p, f, t) {
  const def = BADGES[badgeKey];
  if (!def) {
    console.log(`\n${W}🏆 Badge: ${badgeKey}${NC}\n`);
    return;
  }
  const col = def.color;
  console.log('');
  def.lines.forEach(l => console.log(`  ${col}${l}${NC}`));
  if (t > 0) {
    console.log(`\n  ${W}Passed: ${G}${p}${NC}  ${W}Failed: ${R}${f}${NC}  ${W}Total: ${B}${t}${NC}\n`);
  } else {
    console.log('');
  }
}

render(badge, passed, failed, total);
