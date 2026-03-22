import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { BASE_STYLES } from '../../../ui/tokens/design-tokens.js';
import { pdfEngine, PluginRegistry } from '../../../core/index.js';
import { aiEngine } from '../../../core/AIEngine.js';
import type { IPlugin, PluginMeta } from '../../../core/index.js';
import '../../../ui/index.js';
import '../uwc-ai-engine-panel.js';

const META: PluginMeta = {
  id: 'ai-chat', name: 'Chat w/ PDF', icon: 'chat', tag: 'uwc-plugin-chat',
  description: 'Ask questions about your document. Full conversation history. Nothing leaves your device.',
  category: 'ai', order: 2,
};
class ChatPlugin implements IPlugin { readonly meta = META; }
PluginRegistry.instance.register(new ChatPlugin());

interface ChatMsg { role: 'user' | 'assistant'; content: string; }

@customElement('uwc-plugin-chat')
export class UwcPluginChat extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }
    .drop-row  { max-width: 600px; display: flex; gap: var(--uwc-space-3); flex-wrap: wrap; align-items: flex-end; }
    .drop-wrap { flex: 1; min-width: 260px; }
    .doc-info  { font-size: var(--uwc-text-sm); color: var(--uwc-text-secondary); margin-top: var(--uwc-space-2); }

    .chat-container {
      margin-top: var(--uwc-space-4); max-width: 780px;
      border: 1px solid var(--uwc-border); border-radius: var(--uwc-radius-lg);
      background: var(--uwc-surface); display: flex; flex-direction: column; overflow: hidden;
    }
    .chat-messages {
      flex: 1; overflow-y: auto; padding: var(--uwc-space-3);
      display: flex; flex-direction: column; gap: var(--uwc-space-2);
      max-height: 420px; min-height: 180px;
    }
    .chat-messages::-webkit-scrollbar { width: 5px; }
    .chat-messages::-webkit-scrollbar-thumb { background: var(--uwc-border-strong); border-radius: 3px; }

    .msg { display: flex; flex-direction: column; gap: 0; max-width: 78%; }
    .msg.user      { align-self: flex-end;   align-items: flex-end; }
    .msg.assistant { align-self: flex-start; align-items: flex-start; }
    .msg-bubble {
      padding: 7px 12px;
      font-size: var(--uwc-text-sm);
      line-height: 1.4; word-break: break-word;
    }
    /* User bubble — tail at bottom-right */
    .msg.user .msg-bubble {
      background: var(--uwc-color-primary); color: #fff;
      border-radius: 18px 18px 4px 18px;
    }
    /* AI bubble — tail at bottom-left */
    .msg.assistant .msg-bubble {
      background: var(--uwc-bg-subtle); color: var(--uwc-text-primary);
      border-radius: 18px 18px 18px 4px;
      border: 1px solid var(--uwc-border);
    }
    .msg.assistant .msg-bubble.streaming { border-color: var(--uwc-color-ai); background: var(--uwc-color-ai-light); }
    .cursor::after { content: '▊'; animation: blink .7s step-end infinite; color: var(--uwc-color-ai); }

    .typing-dots {
      display: inline-block;
      width: 8px; height: 8px;
      border-radius: 50%;
      margin: 2px 18px;
      animation: dot-wave 1.4s ease-in-out infinite;
    }
    @keyframes dot-wave {
      /* Left dot highlights first */
      0% {
        background: var(--uwc-text-disabled);
        box-shadow: -13px 0 0 var(--uwc-color-primary),
                    13px 0 0 var(--uwc-text-disabled);
      }
      /* Middle dot highlights */
      33% {
        background: var(--uwc-color-primary);
        box-shadow: -13px 0 0 var(--uwc-text-disabled),
                    13px 0 0 var(--uwc-text-disabled);
      }
      /* Right dot highlights */
      66% {
        background: var(--uwc-text-disabled);
        box-shadow: -13px 0 0 var(--uwc-text-disabled),
                    13px 0 0 var(--uwc-color-primary);
      }
      /* Reset */
      100% {
        background: var(--uwc-text-disabled);
        box-shadow: -13px 0 0 var(--uwc-color-primary),
                    13px 0 0 var(--uwc-text-disabled);
      }
    }

    .chat-input-row {
      display: flex; gap: var(--uwc-space-2); padding: var(--uwc-space-3) var(--uwc-space-4);
      border-top: 1px solid var(--uwc-border); background: var(--uwc-bg-subtle);
    }
    .chat-input {
      flex: 1; padding: var(--uwc-space-2) var(--uwc-space-3);
      border: 1.5px solid var(--uwc-border); border-radius: var(--uwc-radius-md);
      font-family: var(--uwc-font); font-size: var(--uwc-text-sm);
      color: var(--uwc-text-primary); background: var(--uwc-surface);
      resize: none; min-height: 36px; max-height: 100px; overflow-y: auto;
    }
    .chat-input:focus { outline: none; border-color: var(--uwc-color-primary); }
    .chat-input:disabled { opacity: .5; cursor: not-allowed; }
  `;

  @state() private _docText    = '';
  @state() private _docName    = '';
  @state() private _history:   ChatMsg[] = [];
  @state() private _thinking   = false;
  @state() private _streaming  = false;
  @state() private _inputVal   = '';
  @state() private _loadingDoc = false;
  @state() private _streamBuf  = '';

  @query('.chat-messages') private _msgArea!: HTMLDivElement;
  @query('.chat-input')    private _input!:   HTMLTextAreaElement;

  private _scroll() { requestAnimationFrame(() => { if (this._msgArea) this._msgArea.scrollTop = this._msgArea.scrollHeight; }); }

  render() {
    const canChat = !!this._docText && aiEngine.isReady && !this._thinking;

    return html`
      <uwc-ai-engine-panel></uwc-ai-engine-panel>

      <!-- Load document -->
      <div class="drop-row">
        <div class="drop-wrap">
          <uwc-file-drop accept=".pdf" label="Drop a PDF to chat with"
            hint="Digital PDFs only — use OCR tool for scanned docs"
            @files-selected="${this._loadDoc}">
          </uwc-file-drop>
        </div>
      </div>
      ${this._docName ? html`
        <div class="doc-info">
          📄 <strong>${this._docName}</strong> loaded — ${this._docText.length.toLocaleString()} chars extracted.
          Ask anything about it below.
        </div>` : ''}

      <!-- Chat area (only after doc loaded) -->
      ${this._docText ? html`
      <div class="chat-container">
        <div class="chat-messages">
          ${this._history.map((m, i) => html`
            <div class="msg ${m.role}">
              <div class="msg-bubble ${m.role === 'assistant' && i === this._history.length - 1 && this._streaming ? 'streaming cursor' : ''}">
                ${m.role === 'assistant' && i === this._history.length - 1 && this._streaming
                  ? this._streamBuf.trim()
                  : this._renderText(m.content.trim())}
              </div>
            </div>
          `)}
          ${this._thinking && !this._streaming ? html`
            <div class="msg assistant">
              <div class="msg-bubble">
                <div class="typing-dots"></div>
              </div>
            </div>` : ''}
        </div>

        <div class="chat-input-row">
          <textarea class="chat-input" rows="1"
            placeholder="${canChat ? 'Ask something about the document… (Enter to send)' : 'Load a PDF and AI model to start chatting'}"
            ?disabled="${!canChat}"
            .value="${this._inputVal}"
            @input="${(e: Event) => this._inputVal = (e.target as HTMLTextAreaElement).value}"
            @keydown="${(e: KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._send(); } }}"
          ></textarea>
          <uwc-button variant="ai" ?disabled="${!canChat}" ?loading="${this._thinking}" @click="${this._send}">
            <uwc-icon name="arrow" slot="icon" size="16"></uwc-icon>
            Send
          </uwc-button>
        </div>
      </div>` : ''}
    `;
  }
  private _renderText(text: string) {
    return text.trim().split('\n').map((line, i, arr) =>
      i < arr.length - 1 ? html`${line}<br>` : html`${line}`
    );
  }

  private async _loadDoc(e: CustomEvent): Promise<void> {
    const file = (e.detail as File[])[0];
    if (!file) return;
    this._loadingDoc = true; this._history = [];
    try {
      const { text } = await pdfEngine.extractText(file);
      if (!text.trim()) { alert('No selectable text found. Use the OCR tool for scanned PDFs.'); return; }
      this._docText = text.slice(0, 14000);
      this._docName = file.name;
      this._history = [{ role: 'assistant', content: `I've read "${file.name}". What would you like to know about it?` }];
      this._scroll();
    } finally { this._loadingDoc = false; }
  }

  private async _send(): Promise<void> {
    const q = this._inputVal.trim();
    if (!q || !this._docText || !aiEngine.isReady) return;

    this._inputVal = '';
    this._history  = [...this._history, { role: 'user', content: q }];
    this._thinking = true; this._streaming = false; this._streamBuf = '';
    this._scroll();

    const sysPrompt =
      `You are a helpful assistant. Answer questions based ONLY on the document below.\n` +
      `If the answer is not in the document, say "I don't see that in the document."\n\n` +
      `DOCUMENT:\n${this._docText}`;

    const messages = [
      { role: 'system', content: sysPrompt },
      ...this._history.map(m => ({ role: m.role, content: m.content })),
    ];

    try {
      let firstToken = false;
      const full = await aiEngine.streamWithHistory(
        messages,
        (_delta, acc) => { 
          if (!firstToken) {
            // First token arrives → NOW add placeholder and switch to streaming
            // This is async (inside a callback after await), so Lit gets its own render
            // cycle with _thinking=true, _streaming=false → typing-dots visible until here
            this._history = [...this._history, { role: 'assistant', content: '' }];
            this._streaming = true;
            firstToken = true;
          }
          this._streamBuf = acc;
          this._scroll();
        },
        900,
      );
      // replace placeholder with final text
      const updated = [...this._history];
      updated[updated.length - 1] = { role: 'assistant', content: full };
      this._history = updated;
    } catch (e) {
      this._history = [...this._history, { role: 'assistant', content: `❌ ${(e as Error).message}` }];
    } finally {
      this._thinking = false; this._streaming = false; this._streamBuf = '';
      this._scroll();
      setTimeout(() => this._input?.focus(), 50);
    }
  }
}

declare global { interface HTMLElementTagNameMap { 'uwc-plugin-chat': UwcPluginChat; } }
