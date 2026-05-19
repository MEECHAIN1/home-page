// ===== MeeBot AI Chat Widget =====
(function () {
  'use strict';

  const API_BASE  = window.location.origin; // same origin = server.js
  const WS_BASE   = API_BASE.replace(/^http/, 'ws'); // ws:// or wss://
  const WS_CHAT   = WS_BASE + '/ws';
  const WS_RPC    = WS_BASE + '/ws/rpc';
  const BOT_AVATAR = 'src/assets/images/meebot.png';
  const USER_AVATAR = 'src/assets/images/meechain_logo.png';

  // ── Generate unique session ID ──────────────────────────────────
  const SESSION_ID = 'sess_' + Math.random().toString(36).slice(2, 10);

  // ── Quick suggestion chips ──────────────────────────────────────
  const SUGGESTIONS = [
    '🚀 MEE Token คืออะไร?',
    '🖼️ วิธีสร้าง NFT',
    '⛏️ Staking ได้เท่าไร?',
    '👛 เชื่อมต่อ Wallet',
    '📈 ราคา MEE วันนี้',
    '🔗 Ritual Chain คืออะไร?',
  ];

  // ── Inject CSS link ─────────────────────────────────────────────
  function injectCSS() {
    if (document.querySelector('#meebot-chat-css')) return;
    const link = document.createElement('link');
    link.id = 'meebot-chat-css';
    link.rel = 'stylesheet';
    link.href = 'src/css/chat.css';
    document.head.appendChild(link);
  }

  // ── Build HTML ──────────────────────────────────────────────────
  function buildWidget() {
    // FAB Button
    const fab = document.createElement('button');
    fab.id = 'meebot-fab';
    fab.title = 'MeeBot AI Chat';
    fab.innerHTML = `
      <img src="${BOT_AVATAR}" alt="MeeBot" />
      <span class="fab-badge"></span>
    `;
    document.body.appendChild(fab);

    // Chat Window
    const win = document.createElement('div');
    win.id = 'meebot-chat-window';
    win.innerHTML = `
      <!-- Header -->
      <div class="chat-header">
        <div class="chat-header-avatar">
          <img src="${BOT_AVATAR}" alt="MeeBot" />
          <span class="online-ring"></span>
        </div>
        <div class="chat-header-info">
          <div class="chat-header-name">🤖 MeeBot AI</div>
          <div class="chat-header-status">
            <span style="width:6px;height:6px;background:#10B981;border-radius:50%;display:inline-block;"></span>
            ออนไลน์ · พร้อมช่วยเหลือ
          </div>
        </div>
        <div class="chat-header-actions">
          <button class="chat-action-btn" id="chat-clear-btn" title="ล้างประวัติ">🗑️</button>
          <button class="chat-action-btn" id="chat-close-btn" title="ปิด">✕</button>
        </div>
      </div>

      <!-- Suggestions -->
      <div class="chat-suggestions" id="chat-suggestions">
        ${SUGGESTIONS.map(s => `<button class="suggestion-chip">${s}</button>`).join('')}
      </div>

      <!-- Messages -->
      <div class="chat-messages" id="chat-messages">
        <div class="chat-welcome">
          <img src="${BOT_AVATAR}" alt="MeeBot" />
          <h4>สวัสดีครับ! ผม MeeBot 🤖</h4>
          <p>AI Assistant ของ MeeChain<br/>ถามอะไรเกี่ยวกับ NFT, Staking,<br/>Wallet หรือ Blockchain ได้เลยครับ!</p>
        </div>
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <div class="chat-input-row">
          <textarea
            id="chat-input"
            placeholder="พิมพ์ข้อความ... (Enter ส่ง, Shift+Enter ขึ้นบรรทัด)"
            rows="1"
          ></textarea>
          <button id="chat-send-btn" title="ส่ง">
            <span id="send-icon">➤</span>
          </button>
        </div>
        <div class="chat-footer-note">
          Powered by <span>MeeBot AI</span> · gpt-5-mini
        </div>
      </div>
    `;
    document.body.appendChild(win);
  }

  // ── Helpers ─────────────────────────────────────────────────────
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatBotText(text) {
    // Basic markdown: **bold**, `code`, *italic*, line breaks
    return escapeHTML(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  }

  function getTime() {
    return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }

  function scrollToBottom() {
    const msgs = document.getElementById('chat-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  // ── Append message ───────────────────────────────────────────────
  function appendMessage(role, text, id = null) {
    const msgs = document.getElementById('chat-messages');
    if (!msgs) return;

    // Remove welcome screen on first message
    const welcome = msgs.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    const div = document.createElement('div');
    div.className = `msg ${role}`;
    if (id) div.id = id;

    const avatarSrc = role === 'bot' ? BOT_AVATAR : USER_AVATAR;
    const formattedText = role === 'bot' ? formatBotText(text) : escapeHTML(text);

    div.innerHTML = `
      <img class="msg-avatar" src="${avatarSrc}" alt="${role}" />
      <div>
        <div class="msg-bubble ${role === 'bot' && id ? 'stream-cursor' : ''}">${formattedText}</div>
        <div class="msg-time">${getTime()}</div>
      </div>
    `;
    msgs.appendChild(div);
    scrollToBottom();
    return div;
  }

  // ── Show typing indicator ────────────────────────────────────────
  function showTyping() {
    const msgs = document.getElementById('chat-messages');
    if (!msgs) return;
    const welcome = msgs.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    const div = document.createElement('div');
    div.className = 'msg bot typing-indicator';
    div.id = 'typing-indicator';
    div.innerHTML = `
      <img class="msg-avatar" src="${BOT_AVATAR}" alt="bot" />
      <div class="msg-bubble">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    msgs.appendChild(div);
    scrollToBottom();
  }

  function hideTyping() {
    document.getElementById('typing-indicator')?.remove();
  }

  // ── WebSocket chat connection (persistent, reconnects on drop) ───
  let chatWS = null;
  let wsReady = false;
  let wsQueue = []; // pending callbacks while connecting

  function getWS() {
    return new Promise((resolve, reject) => {
      if (chatWS && chatWS.readyState === WebSocket.OPEN) {
        return resolve(chatWS);
      }
      // If already connecting, queue the resolve
      if (chatWS && chatWS.readyState === WebSocket.CONNECTING) {
        wsQueue.push({ resolve, reject });
        return;
      }
      // (Re)connect
      try {
        chatWS = new WebSocket(WS_CHAT);
      } catch (e) {
        return reject(e);
      }
      wsQueue.push({ resolve, reject });

      chatWS.addEventListener('open', () => {
        wsReady = true;
        wsQueue.forEach(q => q.resolve(chatWS));
        wsQueue = [];
      });
      chatWS.addEventListener('error', () => {
        wsReady = false;
        wsQueue.forEach(q => q.reject(new Error('WS connection failed')));
        wsQueue = [];
        chatWS = null;
      });
      chatWS.addEventListener('close', () => {
        wsReady = false;
        chatWS = null;
      });
    });
  }

  // ── Send via WebSocket (streaming) ────────────────────────────────
  async function sendViaWS(text, botBubble, onDone) {
    const ws = await getWS();
    let fullText = '';

    return new Promise((resolve, reject) => {
      function onMsg(evt) {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === 'delta' && botBubble) {
            fullText += data.delta;
            botBubble.innerHTML = formatBotText(fullText);
            botBubble.classList.add('stream-cursor');
            scrollToBottom();
          }
          if (data.type === 'done') {
            if (botBubble) botBubble.classList.remove('stream-cursor');
            ws.removeEventListener('message', onMsg);
            resolve();
            if (onDone) onDone();
          }
          if (data.type === 'error') {
            ws.removeEventListener('message', onMsg);
            reject(new Error(data.error));
          }
        } catch (_) {}
      }
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ type: 'chat', message: text, sessionId: SESSION_ID }));
    });
  }

  // ── Send via SSE (fallback) ───────────────────────────────────────
  async function sendViaSSE(text, botBubble) {
    const response = await fetch(`${API_BASE}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sessionId: SESSION_ID }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.delta && botBubble) {
            fullText += data.delta;
            botBubble.innerHTML = formatBotText(fullText);
            botBubble.classList.add('stream-cursor');
            scrollToBottom();
          }
          if (data.done && botBubble) botBubble.classList.remove('stream-cursor');
          if (data.error && botBubble) {
            const errSpan = document.createElement('span');
            errSpan.style.color = '#EF4444';
            errSpan.textContent = data.error;
            botBubble.replaceChildren(errSpan);
            botBubble.classList.remove('stream-cursor');
          }
        } catch (_) {}
      }
    }
    if (botBubble) botBubble.classList.remove('stream-cursor');
  }

  // ── Send message (WS → SSE → REST fallback chain) ────────────────
  async function sendMessage(text) {
    if (!text.trim()) return;

    const input   = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const sendIcon = document.getElementById('send-icon');

    input.value = '';
    input.style.height = 'auto';
    input.disabled = true;
    sendBtn.disabled = true;
    sendIcon.textContent = '⏳';

    appendMessage('user', text);
    showTyping();

    const botMsgId = 'bot-msg-' + Date.now();
    let botMsgDiv  = null;
    let botBubble  = null;

    try {
      hideTyping();
      botMsgDiv  = appendMessage('bot', '', botMsgId);
      botBubble  = botMsgDiv?.querySelector('.msg-bubble');

      // ① Try WebSocket first
      try {
        await sendViaWS(text, botBubble);
      } catch (wsErr) {
        console.warn('WS chat failed, falling back to SSE:', wsErr.message);
        // Reset bubble for SSE retry
        if (botBubble) botBubble.innerHTML = '';
        await sendViaSSE(text, botBubble);
      }

    } catch (err) {
      hideTyping();
      if (botBubble) {
        botBubble.innerHTML = '';
        botBubble.classList.remove('stream-cursor');
      }
      // ② Last resort: non-streaming REST
      try {
        const res  = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, sessionId: SESSION_ID }),
        });
        const data = await res.json();
        if (botBubble) {
          botBubble.innerHTML = data.reply
            ? formatBotText(data.reply)
            : '❌ ไม่สามารถตอบได้ในขณะนี้ กรุณาลองใหม่';
        }
      } catch (e) {
        if (botBubble) botBubble.innerHTML = '❌ ไม่สามารถเชื่อมต่อ MeeBot AI ได้ กรุณารีเฟรชหน้า';
      }
    } finally {
      input.disabled  = false;
      sendBtn.disabled = false;
      sendIcon.textContent = '➤';
      input.focus();
      scrollToBottom();
    }
  }

  // ── Clear chat history ───────────────────────────────────────────
  async function clearChat() {
    // Clear via WS if connected, otherwise REST
    try {
      if (chatWS && chatWS.readyState === WebSocket.OPEN) {
        chatWS.send(JSON.stringify({ type: 'clear', sessionId: SESSION_ID }));
      } else {
        await fetch(`${API_BASE}/api/chat/${SESSION_ID}`, { method: 'DELETE' });
      }
    } catch (_) {}

    const msgs = document.getElementById('chat-messages');
    if (msgs) {
      msgs.innerHTML = `
        <div class="chat-welcome">
          <img src="${BOT_AVATAR}" alt="MeeBot" />
          <h4>ล้างประวัติแล้วครับ! 🤖</h4>
          <p>เริ่มการสนทนาใหม่ได้เลยครับ</p>
        </div>
      `;
    }
  }

  // ── Toggle chat window ───────────────────────────────────────────
  let isOpen = false;
  function toggleChat(forceOpen) {
    const win = document.getElementById('meebot-chat-window');
    const fab = document.getElementById('meebot-fab');
    const badge = fab?.querySelector('.fab-badge');

    isOpen = forceOpen !== undefined ? forceOpen : !isOpen;

    if (isOpen) {
      win?.classList.add('visible');
      fab?.classList.add('open');
      if (badge) badge.style.display = 'none';
      setTimeout(() => document.getElementById('chat-input')?.focus(), 300);
    } else {
      win?.classList.remove('visible');
      fab?.classList.remove('open');
    }
  }

  // ── Auto-resize textarea ─────────────────────────────────────────
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  }

  // ── Init event listeners ─────────────────────────────────────────
  function bindEvents() {
    const fab       = document.getElementById('meebot-fab');
    const closeBtn  = document.getElementById('chat-close-btn');
    const clearBtn  = document.getElementById('chat-clear-btn');
    const sendBtn   = document.getElementById('chat-send-btn');
    const input     = document.getElementById('chat-input');
    const suggs     = document.getElementById('chat-suggestions');

    // FAB toggle
    fab?.addEventListener('click', () => toggleChat());

    // Close button
    closeBtn?.addEventListener('click', () => toggleChat(false));

    // Clear button
    clearBtn?.addEventListener('click', clearChat);

    // Send button
    sendBtn?.addEventListener('click', () => {
      const text = input?.value?.trim();
      if (text) sendMessage(text);
    });

    // Enter key to send
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = input.value.trim();
        if (text) sendMessage(text);
      }
    });

    // Auto-resize
    input?.addEventListener('input', () => autoResize(input));

    // Suggestion chips
    suggs?.addEventListener('click', (e) => {
      if (e.target.classList.contains('suggestion-chip')) {
        const text = e.target.textContent.replace(/^[^\s]+\s/, ''); // strip emoji
        toggleChat(true);
        sendMessage(text);
      }
    });

    // Keyboard shortcut: Ctrl+/ to toggle chat
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        toggleChat();
      }
    });
  }

  // ── Add "MeeBot" nav item interaction ───────────────────────────
  function bindNavMeeBot() {
    const navMeebot = document.querySelector('.nav-item[data-page="meebot"]');
    if (navMeebot) {
      // Also open chat when clicking nav
      navMeebot.addEventListener('dblclick', () => toggleChat(true));
    }
  }

  // ── Check AI health & show badge if ready ───────────────────────
  async function checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      const data = await res.json();
      if (data.status === 'ok') {
        console.log('✅ MeeBot AI ready:', data.model);
        // Show badge
        const badge = document.querySelector('#meebot-fab .fab-badge');
        if (badge) {
          badge.style.display = 'block';
          // Auto-hide after 5s
          setTimeout(() => { if (badge) badge.style.display = 'none'; }, 5000);
        }
      }
    } catch (e) {
      console.warn('MeeBot AI health check failed — running offline mode');
    }
  }

  // ── Main Init ────────────────────────────────────────────────────
  function init() {
    injectCSS();
    buildWidget();
    bindEvents();
    bindNavMeeBot();
    // Check health after 1s
    setTimeout(checkHealth, 1000);
    console.log('🤖 MeeBot AI Chat Widget loaded');
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for external use
  window.MeeBotChat = { toggle: toggleChat, send: sendMessage, clear: clearChat };
})();
