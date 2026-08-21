/**
 * Floating AI Chat Drawer & Copilot Interface
 * Provides natural language interaction for scheduling, logging, and weekly retrospective
 */

import { AIAssistant } from '../core/aiAssistant.js';

export class AIChatDrawer {
  constructor(containerEl, appContext) {
    this.container = containerEl;
    this.app = appContext;
    this.assistant = new AIAssistant(appContext);
    this.isOpen = false;
    this.messages = [];
    this.isProcessing = false;

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <!-- Floating Action Button -->
      <button class="ai-fab-btn" id="ai-fab-btn" title="Buka Asisten AI Produktivitas">
        <span class="ai-fab-icon">✨</span>
        <span class="ai-fab-label">AI Copilot</span>
      </button>

      <!-- Slide-Over Chat Drawer Panel -->
      <div class="ai-chat-drawer" id="ai-chat-drawer">
        <!-- Header -->
        <div class="ai-drawer-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.25rem;">🤖</span>
            <div>
              <div style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary);">Asisten AI Al-Bayan</div>
              <div style="font-size: 0.72rem; color: #10B981; display: flex; align-items: center; gap: 4px;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10B981;"></span>
                Gemini 1.5 Flash • Tool Calling Aktif
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="ai-header-btn" id="ai-clear-btn" title="Hapus riwayat chat">🗑️</button>
            <button class="ai-header-btn" id="ai-close-btn" title="Tutup">✕</button>
          </div>
        </div>

        <!-- Messages Container -->
        <div class="ai-drawer-body" id="ai-messages-container">
          <!-- Welcome Message -->
          <div class="ai-msg-bubble ai-bubble-assistant">
            <div class="ai-bubble-avatar">🤖</div>
            <div class="ai-bubble-content">
              <p><strong>Assalamu'alaikum!</strong> Saya adalah Asisten AI Kalender Pribadi Anda.</p>
              <p style="margin-top: 4px; font-size: 0.8rem; color: var(--text-muted);">
                Anda dapat meminta saya untuk menggeser jadwal, mencatat status eksekusi, atau menganalisis keseimbangan 80:10:10.
              </p>
            </div>
          </div>

          <!-- Quick Suggestion Chips -->
          <div class="ai-suggestion-chips" id="ai-suggestion-chips">
            <button class="ai-chip" data-prompt="Bagaimana jadwal dan waktu sholat hari ini?">📅 Jadwal Hari Ini</button>
            <button class="ai-chip" data-prompt="Bagaimana keseimbangan rasio produktif 80:10:10 minggu ini?">📊 Analisis Rasio Minggu Ini</button>
            <button class="ai-chip" data-prompt="Tadi kegiatan barusan selesai tepat waktu. Tolong catat statusnya.">✅ Catat Tepat Waktu</button>
          </div>
        </div>

        <!-- Footer Input Area -->
        <div class="ai-drawer-footer">
          <div class="ai-input-wrapper">
            <textarea
              id="ai-user-input"
              class="ai-input-field"
              placeholder="Tanya atau minta atur jadwal..."
              rows="1"
            ></textarea>
            <button class="ai-send-btn" id="ai-send-btn" title="Kirim pesan">
              ➤
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const fabBtn = this.container.querySelector('#ai-fab-btn');
    const closeBtn = this.container.querySelector('#ai-close-btn');
    const clearBtn = this.container.querySelector('#ai-clear-btn');
    const sendBtn = this.container.querySelector('#ai-send-btn');
    const inputField = this.container.querySelector('#ai-user-input');
    const chips = this.container.querySelectorAll('.ai-chip');

    fabBtn?.addEventListener('click', () => this.toggleDrawer());
    closeBtn?.addEventListener('click', () => this.closeDrawer());

    clearBtn?.addEventListener('click', () => {
      if (confirm('Hapus seluruh riwayat percakapan asisten?')) {
        this.assistant.clearHistory();
        this.messages = [];
        const messagesContainer = this.container.querySelector('#ai-messages-container');
        if (messagesContainer) {
          messagesContainer.innerHTML = `
            <div class="ai-msg-bubble ai-bubble-assistant">
              <div class="ai-bubble-avatar">🤖</div>
              <div class="ai-bubble-content">
                <p>Riwayat percakapan telah dibersihkan. Ada yang bisa saya bantu untuk jadwal Anda?</p>
              </div>
            </div>
          `;
        }
      }
    });

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt) {
          this.handleSendMessage(prompt);
        }
      });
    });

    sendBtn?.addEventListener('click', () => {
      const text = inputField?.value.trim();
      if (text) {
        this.handleSendMessage(text);
        if (inputField) inputField.value = '';
      }
    });

    inputField?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = inputField.value.trim();
        if (text) {
          this.handleSendMessage(text);
          inputField.value = '';
        }
      }
    });
  }

  toggleDrawer() {
    this.isOpen = !this.isOpen;
    const drawer = this.container.querySelector('#ai-chat-drawer');
    const fab = this.container.querySelector('#ai-fab-btn');
    if (this.isOpen) {
      drawer?.classList.add('open');
      fab?.classList.add('active');
      this.container.querySelector('#ai-user-input')?.focus();
    } else {
      drawer?.classList.remove('open');
      fab?.classList.remove('active');
    }
  }

  openDrawer() {
    this.isOpen = true;
    this.container.querySelector('#ai-chat-drawer')?.classList.add('open');
    this.container.querySelector('#ai-fab-btn')?.classList.add('active');
    this.container.querySelector('#ai-user-input')?.focus();
  }

  closeDrawer() {
    this.isOpen = false;
    this.container.querySelector('#ai-chat-drawer')?.classList.remove('open');
    this.container.querySelector('#ai-fab-btn')?.classList.remove('active');
  }

  async handleSendMessage(text) {
    if (this.isProcessing || !text) return;
    this.isProcessing = true;

    const messagesContainer = this.container.querySelector('#ai-messages-container');
    const chips = this.container.querySelector('#ai-suggestion-chips');
    if (chips) chips.style.display = 'none';

    // 1. Append User Message
    this.appendMessage('user', text);

    // 2. Append Typing Indicator
    const typingId = `typing_${Date.now()}`;
    this.appendTypingIndicator(typingId);

    try {
      // 3. Call Gemini Assistant Engine
      const result = await this.assistant.sendMessage(text);

      // Remove typing indicator
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      // 4. Append Assistant Response
      this.appendMessage('assistant', result.text);
    } catch (err) {
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      this.appendMessage('assistant', `⚠️ Maaf, terjadi kesalahan: ${err.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  appendMessage(role, text) {
    const messagesContainer = this.container.querySelector('#ai-messages-container');
    if (!messagesContainer) return;

    const bubble = document.createElement('div');
    bubble.className = `ai-msg-bubble ai-bubble-${role}`;

    const formattedText = this.formatMarkdown(text);

    bubble.innerHTML = `
      <div class="ai-bubble-avatar">${role === 'user' ? '🧑' : '🤖'}</div>
      <div class="ai-bubble-content">${formattedText}</div>
    `;

    messagesContainer.appendChild(bubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  appendTypingIndicator(id) {
    const messagesContainer = this.container.querySelector('#ai-messages-container');
    if (!messagesContainer) return;

    const typingEl = document.createElement('div');
    typingEl.id = id;
    typingEl.className = 'ai-msg-bubble ai-bubble-assistant ai-typing';
    typingEl.innerHTML = `
      <div class="ai-bubble-avatar">🤖</div>
      <div class="ai-bubble-content">
        <div class="ai-typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messagesContainer.appendChild(typingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  formatMarkdown(raw) {
    if (!raw) return '';
    return raw
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }
}
