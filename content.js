(function () {
  // Guard against double-injection
  if (document.getElementById('chrome-companion-host')) return;

  // ── Constants ──────────────────────────────────────────────────────────
  const STORAGE_KEY = 'companion_position';
  const COMPANION_SIZE = 120;
  const BUBBLE_TIMEOUT = 5000;

  const EMOTIONS = {
    neutral: 'assets/neutral.webp',
    happy: 'assets/happy.webp',
    blush: 'assets/blush.webp',
    angry: 'assets/angry.webp',
  };

  // ── Shadow CSS ─────────────────────────────────────────────────────────
  const SHADOW_CSS = `
    :host {
      font-family: 'Courier New', monospace !important;
      font-size: 14px !important;
      line-height: 1.4 !important;
      color: #2c2c2c !important;
    }

    * {
      box-sizing: border-box;
    }

    .companion-container {
      position: fixed;
      pointer-events: auto;
      user-select: none;
      -webkit-user-select: none;
      will-change: transform;
    }

    /* ── Character sprite ── */
    .character {
      width: ${COMPANION_SIZE}px;
      height: ${COMPANION_SIZE}px;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      cursor: grab;
      transition: filter 0.15s ease;
      display: block;
    }

    .character:active {
      cursor: grabbing;
    }

    .character:hover {
      filter: brightness(1.1);
    }

    /* ── Speech bubble ── */
    .bubble {
      position: absolute;
      bottom: calc(100% + 8px);
      right: 0;
      min-width: 160px;
      max-width: 260px;
      padding: 10px 14px;
      background: #fefae0;
      border: 3px solid #5c4033;
      border-radius: 4px;
      box-shadow: 4px 4px 0px #5c4033;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.5;
      color: #2c2c2c;
      opacity: 0;
      transform: scale(0.9) translateY(8px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none;
      visibility: hidden;
    }

    .bubble.visible {
      opacity: 1;
      transform: scale(1) translateY(0);
      pointer-events: auto;
      visibility: visible;
    }

    .bubble.flip-y {
      bottom: auto;
      top: calc(100% + 8px);
    }

    .bubble.flip-x {
      right: auto;
      left: 0;
    }

    .bubble-content {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .bubble-tail {
      position: absolute;
      bottom: -10px;
      right: 24px;
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 10px solid #5c4033;
    }

    .bubble-tail::after {
      content: '';
      position: absolute;
      bottom: 3px;
      left: -6px;
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 8px solid #fefae0;
    }

    .bubble.flip-y .bubble-tail {
      bottom: auto;
      top: -10px;
      border-top: none;
      border-bottom: 10px solid #5c4033;
    }

    .bubble.flip-y .bubble-tail::after {
      bottom: auto;
      top: 3px;
      border-top: none;
      border-bottom: 8px solid #fefae0;
    }

    .bubble.flip-x .bubble-tail {
      right: auto;
      left: 24px;
    }

    /* ── Chat panel ── */
    .chat-panel {
      position: absolute;
      bottom: 0;
      right: calc(100% + 12px);
      width: 320px;
      height: 420px;
      background: #fefae0;
      border: 3px solid #5c4033;
      border-radius: 4px;
      box-shadow: 4px 4px 0px #5c4033;
      display: flex;
      flex-direction: column;
      opacity: 0;
      transform: scale(0.9) translateX(8px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none;
      visibility: hidden;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #2c2c2c;
    }

    .chat-panel.visible {
      opacity: 1;
      transform: scale(1) translateX(0);
      pointer-events: auto;
      visibility: visible;
    }

    .chat-panel.flip-x {
      right: auto;
      left: calc(100% + 12px);
      transform: scale(0.9) translateX(-8px);
    }

    .chat-panel.flip-x.visible {
      transform: scale(1) translateX(0);
    }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 2px solid #5c4033;
      background: #d4a373;
      border-radius: 1px 1px 0 0;
      flex-shrink: 0;
    }

    .chat-title {
      font-weight: bold;
      font-size: 14px;
      color: #2c2c2c;
    }

    .chat-close {
      background: none;
      border: 2px solid #5c4033;
      border-radius: 2px;
      color: #5c4033;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      padding: 2px 6px;
      line-height: 1;
      transition: background 0.1s ease;
    }

    .chat-close:hover {
      background: #5c4033;
      color: #fefae0;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .chat-messages::-webkit-scrollbar {
      width: 6px;
    }

    .chat-messages::-webkit-scrollbar-track {
      background: #fefae0;
    }

    .chat-messages::-webkit-scrollbar-thumb {
      background: #d4a373;
      border-radius: 3px;
    }

    .chat-msg {
      max-width: 85%;
      padding: 8px 10px;
      border-radius: 4px;
      line-height: 1.4;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .chat-msg.user {
      align-self: flex-end;
      background: #d4a373;
      border: 2px solid #5c4033;
      color: #2c2c2c;
    }

    .chat-msg.companion {
      align-self: flex-start;
      background: #fff8dc;
      border: 2px solid #5c4033;
      color: #2c2c2c;
    }

    .chat-msg.system {
      align-self: center;
      background: none;
      border: none;
      color: #8a7560;
      font-size: 11px;
      font-style: italic;
      padding: 4px 8px;
      max-width: 100%;
      text-align: center;
    }

    .chat-input-area {
      display: flex;
      padding: 8px;
      border-top: 2px solid #5c4033;
      gap: 6px;
      flex-shrink: 0;
    }

    .chat-input {
      flex: 1;
      padding: 8px 10px;
      border: 2px solid #5c4033;
      border-radius: 2px;
      background: #fffdf0;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #2c2c2c;
      outline: none;
    }

    .chat-input:focus {
      border-color: #d4a373;
      box-shadow: 0 0 0 1px #d4a373;
    }

    .chat-input::placeholder {
      color: #a89070;
    }

    .chat-send {
      padding: 8px 12px;
      background: #d4a373;
      border: 2px solid #5c4033;
      border-radius: 2px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      font-weight: bold;
      color: #2c2c2c;
      cursor: pointer;
      transition: background 0.1s ease;
      flex-shrink: 0;
    }

    .chat-send:hover {
      background: #5c4033;
      color: #fefae0;
    }
  `;

  // ── State ──────────────────────────────────────────────────────────────
  let posX = 0;
  let posY = 0;
  let isDragging = false;
  let hasDragged = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let currentEmotion = 'neutral';
  let bubbleVisible = false;
  let chatVisible = false;
  let bubbleTimeout = null;
  let typewriterCancel = null;

  // ── DOM references (set in init) ───────────────────────────────────────
  let container, characterImg;
  let bubbleEl, bubbleContentEl, bubbleTailEl;
  let chatPanel, chatMessages, chatInput, chatCloseBtn, chatSendBtn;

  // ── Position persistence ───────────────────────────────────────────────
  async function loadPosition() {
    return new Promise((resolve) => {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        const pos = result[STORAGE_KEY];
        if (pos && pos.x >= 0 && pos.y >= 0) {
          const x = Math.min(pos.x, window.innerWidth - COMPANION_SIZE);
          const y = Math.min(pos.y, window.innerHeight - COMPANION_SIZE);
          resolve({ x: Math.max(0, x), y: Math.max(0, y) });
        } else {
          resolve({
            x: window.innerWidth - COMPANION_SIZE - 20,
            y: window.innerHeight - COMPANION_SIZE - 20,
          });
        }
      });
    });
  }

  function savePosition(x, y) {
    chrome.storage.local.set({ [STORAGE_KEY]: { x, y } });
  }

  // ── Bubble ─────────────────────────────────────────────────────────────
  function showBubble() {
    if (chatVisible) return;
    bubbleVisible = true;
    bubbleEl.classList.add('visible');
    updateBubblePosition();
  }

  function hideBubble() {
    bubbleVisible = false;
    bubbleEl.classList.remove('visible');
    if (bubbleTimeout) {
      clearTimeout(bubbleTimeout);
      bubbleTimeout = null;
    }
    if (typewriterCancel) {
      typewriterCancel();
      typewriterCancel = null;
    }
  }

  function setBubbleText(text) {
    if (typewriterCancel) {
      typewriterCancel();
      typewriterCancel = null;
    }
    bubbleContentEl.textContent = text;
    showBubble();
    scheduleBubbleHide();
  }

  function setBubbleTextAnimated(text, speed) {
    if (typewriterCancel) {
      typewriterCancel();
      typewriterCancel = null;
    }
    speed = speed || 30;
    bubbleContentEl.textContent = '';
    showBubble();

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        bubbleContentEl.textContent += text[i];
        i++;
      } else {
        clearInterval(interval);
        scheduleBubbleHide();
      }
    }, speed);

    typewriterCancel = () => clearInterval(interval);
  }

  function scheduleBubbleHide() {
    if (bubbleTimeout) clearTimeout(bubbleTimeout);
    bubbleTimeout = setTimeout(hideBubble, BUBBLE_TIMEOUT);
  }

  function updateBubblePosition() {
    const flipY = posY < 180;
    const flipX = posX > window.innerWidth - 300;

    bubbleEl.classList.toggle('flip-y', flipY);
    bubbleEl.classList.toggle('flip-x', flipX);
  }

  // ── Chat panel ─────────────────────────────────────────────────────────
  function toggleChat() {
    if (chatVisible) {
      closeChat();
    } else {
      openChat();
    }
  }

  function openChat() {
    chatVisible = true;
    hideBubble();
    updateChatPosition();
    chatPanel.classList.add('visible');
    chatInput.focus();
  }

  function closeChat() {
    chatVisible = false;
    chatPanel.classList.remove('visible');
  }

  function updateChatPosition() {
    const flipX = posX < 340;
    chatPanel.classList.toggle('flip-x', flipX);
  }

  function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg ' + sender;
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ── Chat commands ───────────────────────────────────────────────────
  const COMMANDS = {
    '/set-emotion': {
      usage: '/set-emotion <neutral|happy|blush|angry>',
      description: 'Change the companion emotion',
      handler(args) {
        const emotion = args[0];
        if (!emotion || !EMOTIONS[emotion]) {
          const available = Object.keys(EMOTIONS).join(', ');
          addMessage(`Unknown emotion. Available: ${available}`, 'system');
          return;
        }
        setEmotion(emotion);
        addMessage(`Emotion set to ${emotion}`, 'system');
      },
    },
    '/help': {
      usage: '/help',
      description: 'Show available commands',
      handler() {
        const lines = Object.entries(COMMANDS)
          .map(([cmd, info]) => `${info.usage} — ${info.description}`)
          .join('\n');
        addMessage(lines, 'system');
      },
    },
  };

  function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';

    // Check for commands
    if (text.startsWith('/')) {
      const parts = text.split(/\s+/);
      const cmdName = parts[0].toLowerCase();
      const args = parts.slice(1);

      addMessage(text, 'user');

      const cmd = COMMANDS[cmdName];
      if (cmd) {
        cmd.handler(args);
      } else {
        addMessage(`Unknown command: ${cmdName}. Type /help for available commands.`, 'system');
      }
      return;
    }

    // Regular message
    addMessage(text, 'user');

    // Placeholder companion response
    setTimeout(() => {
      addMessage("I heard you! LLM integration coming soon.", 'companion');
    }, 500);
  }

  // ── Drag system ────────────────────────────────────────────────────────
  function onPointerDown(e) {
    e.preventDefault();
    isDragging = true;
    hasDragged = false;

    const rect = container.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    characterImg.setPointerCapture(e.pointerId);
    characterImg.addEventListener('pointermove', onPointerMove);
    characterImg.addEventListener('pointerup', onPointerUp);
    characterImg.addEventListener('pointercancel', onPointerUp);
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    hasDragged = true;

    let newX = e.clientX - dragOffsetX;
    let newY = e.clientY - dragOffsetY;

    const maxX = window.innerWidth - COMPANION_SIZE;
    const maxY = window.innerHeight - COMPANION_SIZE;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    posX = newX;
    posY = newY;
    container.style.transform = `translate(${posX}px, ${posY}px)`;

    if (bubbleVisible) updateBubblePosition();
    if (chatVisible) updateChatPosition();
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;

    characterImg.releasePointerCapture(e.pointerId);
    characterImg.removeEventListener('pointermove', onPointerMove);
    characterImg.removeEventListener('pointerup', onPointerUp);
    characterImg.removeEventListener('pointercancel', onPointerUp);

    savePosition(posX, posY);

    if (!hasDragged) {
      toggleChat();
    }
  }

  // ── Emotion API ────────────────────────────────────────────────────────
  function setEmotion(emotion) {
    if (!EMOTIONS[emotion] || emotion === currentEmotion) return;
    currentEmotion = emotion;
    characterImg.src = chrome.runtime.getURL(EMOTIONS[emotion]);
  }

  function preloadSprites() {
    Object.values(EMOTIONS).forEach((path) => {
      const img = new Image();
      img.src = chrome.runtime.getURL(path);
    });
  }

  // ── Message listener (for background/popup control) ────────────────────
  function attachMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'SET_EMOTION':
          setEmotion(message.emotion);
          sendResponse({ success: true });
          break;
        case 'SET_BUBBLE_TEXT':
          setBubbleText(message.text);
          sendResponse({ success: true });
          break;
        case 'SET_BUBBLE_TEXT_ANIMATED':
          setBubbleTextAnimated(message.text, message.speed);
          sendResponse({ success: true });
          break;
        case 'SET_EMOTION_AND_TEXT':
          setEmotion(message.emotion);
          setBubbleTextAnimated(message.text);
          sendResponse({ success: true });
          break;
      }
    });
  }

  // ── Resize handler ─────────────────────────────────────────────────────
  function attachResizeListener() {
    window.addEventListener('resize', () => {
      const maxX = window.innerWidth - COMPANION_SIZE;
      const maxY = window.innerHeight - COMPANION_SIZE;
      posX = Math.max(0, Math.min(posX, maxX));
      posY = Math.max(0, Math.min(posY, maxY));
      container.style.transform = `translate(${posX}px, ${posY}px)`;
    });
  }

  // ── SPA resilience ─────────────────────────────────────────────────────
  function attachMutationObserver(host) {
    const observer = new MutationObserver(() => {
      if (!document.getElementById('chrome-companion-host')) {
        document.body.appendChild(host);
      }
    });
    observer.observe(document.body, { childList: true });
  }

  // ── Initialization ─────────────────────────────────────────────────────
  async function initCompanion(shadow) {
    // Inject styles
    const style = document.createElement('style');
    style.textContent = SHADOW_CSS;
    shadow.appendChild(style);

    // Build DOM
    container = document.createElement('div');
    container.className = 'companion-container';

    // Speech bubble
    bubbleEl = document.createElement('div');
    bubbleEl.className = 'bubble';

    bubbleContentEl = document.createElement('div');
    bubbleContentEl.className = 'bubble-content';

    bubbleTailEl = document.createElement('div');
    bubbleTailEl.className = 'bubble-tail';

    bubbleEl.appendChild(bubbleContentEl);
    bubbleEl.appendChild(bubbleTailEl);

    // Chat panel
    chatPanel = document.createElement('div');
    chatPanel.className = 'chat-panel';

    const chatHeader = document.createElement('div');
    chatHeader.className = 'chat-header';

    const chatTitle = document.createElement('span');
    chatTitle.className = 'chat-title';
    chatTitle.textContent = 'Chat';

    chatCloseBtn = document.createElement('button');
    chatCloseBtn.className = 'chat-close';
    chatCloseBtn.textContent = 'X';
    chatCloseBtn.addEventListener('click', closeChat);

    chatHeader.appendChild(chatTitle);
    chatHeader.appendChild(chatCloseBtn);

    chatMessages = document.createElement('div');
    chatMessages.className = 'chat-messages';

    const chatInputArea = document.createElement('div');
    chatInputArea.className = 'chat-input-area';

    chatInput = document.createElement('input');
    chatInput.className = 'chat-input';
    chatInput.type = 'text';
    chatInput.placeholder = 'Type a message...';
    chatInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') handleSendMessage();
    });
    chatInput.addEventListener('keyup', (e) => e.stopPropagation());
    chatInput.addEventListener('keypress', (e) => e.stopPropagation());

    chatSendBtn = document.createElement('button');
    chatSendBtn.className = 'chat-send';
    chatSendBtn.textContent = 'Send';
    chatSendBtn.addEventListener('click', handleSendMessage);

    chatInputArea.appendChild(chatInput);
    chatInputArea.appendChild(chatSendBtn);

    chatPanel.appendChild(chatHeader);
    chatPanel.appendChild(chatMessages);
    chatPanel.appendChild(chatInputArea);

    // Character image
    characterImg = document.createElement('img');
    characterImg.className = 'character';
    characterImg.src = chrome.runtime.getURL(EMOTIONS.neutral);
    characterImg.alt = 'Companion';
    characterImg.draggable = false;
    characterImg.addEventListener('pointerdown', onPointerDown);

    // Assemble
    container.appendChild(bubbleEl);
    container.appendChild(chatPanel);
    container.appendChild(characterImg);
    shadow.appendChild(container);

    // Load position
    const pos = await loadPosition();
    posX = pos.x;
    posY = pos.y;
    container.style.transform = `translate(${posX}px, ${posY}px)`;

    // Preload sprites
    preloadSprites();

    // Listeners
    attachMessageListeners();
    attachResizeListener();

    // Welcome bubble
    setTimeout(() => {
      setBubbleTextAnimated("Hello! Click me to chat!");
    }, 500);
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────
  const host = document.createElement('div');
  host.id = 'chrome-companion-host';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  attachMutationObserver(host);
  initCompanion(shadow);
})();
