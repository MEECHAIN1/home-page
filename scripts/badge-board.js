#!/usr/bin/env node
// ===== MeeChain Badge Board =====
// Reads results from environment / stdin JSON and renders the full milestone board
// Usage:
//   node scripts/badge-board.js                        (show empty board)
//   node scripts/badge-board.js --results results.json (show board with run results)
//   echo '{"QA_GUARDIAN":true,"SOCKET_LINKED":true}' | node scripts/badge-board.js --stdin

const fs   = require('fs');
const path = require('path');

const R  = '\x1b[0;31m'; const G  = '\x1b[0;32m'; const Y  = '\x1b[1;33m';
const B  = '\x1b[0;34m'; const C  = '\x1b[0;36m'; const M  = '\x1b[0;35m';
const W  = '\x1b[1;37m'; const DIM = '\x1b[2m';   const NC = '\x1b[0m';

// ── Badge definitions (ordered for display) ──────────────────────
const BADGES = [
  // QA / Production
  { key: 'QA_GUARDIAN',     icon: '🟢', col: G, label: 'QA_GUARDIAN',     desc: 'ทุก test ผ่าน · Production READY',  group: 'QA' },
  { key: 'DEBUG_SLAYER',    icon: '🔴', col: R, label: 'DEBUG_SLAYER',    desc: 'มี test fail · Debug required',       group: 'QA' },
  { key: 'NETWORK_WATCHER', icon: '🌐', col: B, label: 'NETWORK_WATCHER', desc: 'DNS & Network ผ่าน',                  group: 'QA' },
  { key: 'SECURITY_KEEPER', icon: '🔐', col: Y, label: 'SECURITY_KEEPER', desc: 'SSL & HSTS ผ่าน',                     group: 'QA' },
  { key: 'API_MASTER',      icon: '🧪', col: C, label: 'API_MASTER',      desc: 'API endpoints ผ่านหมด',              group: 'QA' },
  { key: 'SPEED_RUNNER',    icon: '⚡', col: M, label: 'SPEED_RUNNER',    desc: 'Response time < 1000ms',             group: 'QA' },
  // WebSocket / Tunnel
  { key: 'SOCKET_LINKED',   icon: '🔗', col: G, label: 'SOCKET_LINKED',   desc: 'WS handshake สำเร็จ',               group: 'WS' },
  { key: 'WS_GUARDIAN',     icon: '🛡️', col: C, label: 'WS_GUARDIAN',     desc: 'Websocat connect เสถียร',            group: 'WS' },
  { key: 'TUNNEL_MASTER',   icon: '🌐', col: B, label: 'TUNNEL_MASTER',   desc: 'Cloudflare + WS tunnel ONLINE',      group: 'WS' },
  { key: 'SOCKET_SLAYER',   icon: '💀', col: R, label: 'SOCKET_SLAYER',   desc: 'WS connection ล้มเหลว',              group: 'WS' },
];

// ── Load results ──────────────────────────────────────────────────
let results = {};
const args = process.argv.slice(2);

if (args.includes('--stdin')) {
  try {
    const raw = fs.readFileSync('/dev/stdin', 'utf8').trim();
    if (raw) results = JSON.parse(raw);
  } catch (_) {}
}
const fileArg = args.indexOf('--results');
if (fileArg !== -1 && args[fileArg + 1]) {
  try {
    results = JSON.parse(fs.readFileSync(args[fileArg + 1], 'utf8'));
  } catch (_) {}
}

// Also read from BADGE_RESULTS env
if (process.env.BADGE_RESULTS) {
  try { Object.assign(results, JSON.parse(process.env.BADGE_RESULTS)); } catch (_) {}
}

// ── Render board ──────────────────────────────────────────────────
function statusOf(key) {
  if (!(key in results)) return 'pending';
  return results[key] ? 'pass' : 'fail';
}

function statusIcon(key) {
  const s = statusOf(key);
  if (s === 'pass') return `${G}✅${NC}`;
  if (s === 'fail') return `${R}❌${NC}`;
  return `${DIM}⬜${NC}`;
}

const WIDTH = 54;
const line  = (s = '') => `${W}║${NC}${s}${W}║${NC}`;
const pad   = (s, w)   => s + ' '.repeat(Math.max(0, w - visLen(s)));

function visLen(s) {
  // strip ANSI escape codes for length calculation
  return s.replace(/\x1b\[[0-9;]*m/g, '').replace(/[^\x00-\x7F]/g, '  ').length;
}

function center(s, w) {
  const len = visLen(s);
  const total = Math.max(0, w - len);
  const left  = Math.floor(total / 2);
  const right = total - left;
  return ' '.repeat(left) + s + ' '.repeat(right);
}

console.log('');
console.log(`${W}╔${'═'.repeat(WIDTH)}╗${NC}`);
console.log(`${W}║${NC}${center(`${W}🏅  MEECHAIN BADGE BOARD  🏅${NC}`, WIDTH + 18)}${W}║${NC}`);
console.log(`${W}║${NC}${center(`${DIM}milestone tracker · automation flow${NC}`, WIDTH + 9)}${W}║${NC}`);
console.log(`${W}╠${'═'.repeat(WIDTH)}╣${NC}`);

let lastGroup = '';
for (const b of BADGES) {
  // Group separator
  if (b.group !== lastGroup) {
    const grpLabel = b.group === 'QA' ? '── QA / Production ──' : '── WebSocket / Tunnel ──';
    console.log(`${W}║${NC}${DIM}  ${pad(grpLabel, WIDTH - 2)}${NC}${W}║${NC}`);
    lastGroup = b.group;
  }

  const st   = statusIcon(b.key);
  const ico  = b.icon;
  const lbl  = `${b.col}${b.label}${NC}`;
  const dsc  = `${DIM}${b.desc}${NC}`;

  // status + icon + label
  const left = `  ${st} ${ico} ${lbl}`;
  const leftLen = 2 + 2 + 1 + 2 + 1 + b.label.length + 1;
  const spaces = Math.max(1, WIDTH - leftLen - visLen(b.desc) - 2);
  const row  = `  ${st} ${ico} ${lbl}${' '.repeat(spaces)}${dsc}  `;

  const rowLen = visLen(row);
  const padding = Math.max(0, WIDTH - rowLen);

  console.log(`${W}║${NC}${row}${' '.repeat(padding)}${W}║${NC}`);
}

console.log(`${W}╠${'═'.repeat(WIDTH)}╣${NC}`);

// ── Stats row ─────────────────────────────────────────────────────
const total   = BADGES.length;
const passed  = BADGES.filter(b => results[b.key] === true).length;
const failed  = BADGES.filter(b => results[b.key] === false).length;
const pending = total - passed - failed;

const statsStr = `  ${G}✅ Earned: ${passed}${NC}  ${R}❌ Failed: ${failed}${NC}  ${DIM}⬜ Pending: ${pending}${NC}  `;
const statsLen = visLen(statsStr);
const statsPad = Math.max(0, WIDTH - statsLen);
console.log(`${W}║${NC}${statsStr}${' '.repeat(statsPad)}${W}║${NC}`);
console.log(`${W}╠${'═'.repeat(WIDTH)}╣${NC}`);

// ── Legend ────────────────────────────────────────────────────────
const legendStr = `  ${G}✅${NC} Earned  ${R}❌${NC} Failed  ${DIM}⬜${NC} Not run yet  `;
const legendLen = visLen(legendStr);
const legendPad = Math.max(0, WIDTH - legendLen);
console.log(`${W}║${NC}${legendStr}${' '.repeat(legendPad)}${W}║${NC}`);

// ── Timestamp ─────────────────────────────────────────────────────
const ts = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
const tsStr = `  ${DIM}${ts}${NC}  `;
const tsPad = Math.max(0, WIDTH - visLen(tsStr));
console.log(`${W}║${NC}${tsStr}${' '.repeat(tsPad)}${W}║${NC}`);
console.log(`${W}╚${'═'.repeat(WIDTH)}╝${NC}`);
console.log('');
