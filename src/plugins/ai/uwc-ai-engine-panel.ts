import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BASE_STYLES } from '../../ui/tokens/design-tokens.js';
import { aiEngine, AI_MODELS } from '../../core/AIEngine.js';
import type { AIStatus, LoadProgress } from '../../core/AIEngine.js';
import '../../ui/index.js';

/**
 * `<uwc-ai-engine-panel>`
 * Shared model-loader UI shown at the top of every AI plugin tab.
 * Fires `ai-ready` when the model finishes loading.
 */
@customElement('uwc-ai-engine-panel')
export class UwcAIEnginePanel extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }
    .panel {
      border: 1px solid var(--uwc-border); border-radius: var(--uwc-radius-lg);
      padding: var(--uwc-space-4) var(--uwc-space-5);
      background: var(--uwc-surface); margin-bottom: var(--uwc-space-5);
      max-width: 600px;
    }
    .panel-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--uwc-space-3); }
    .panel-title  { font-size: var(--uwc-text-base); font-weight: var(--uwc-weight-semibold); display: flex; align-items: center; gap: var(--uwc-space-2); }
    .status-pill  {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 2px 10px; border-radius: var(--uwc-radius-full);
      font-size: var(--uwc-text-xs); font-weight: var(--uwc-weight-semibold);
    }
    .pill-idle    { background: var(--uwc-bg-subtle); color: var(--uwc-text-tertiary); }
    .pill-loading { background: #fef3c7; color: #92400e; }
    .pill-ready   { background: #d1fae5; color: #065f46; }
    .pill-error   { background: #fee2e2; color: #991b1b; }
    .pill-no-gpu  { background: #fee2e2; color: #991b1b; }

    .controls { display: flex; align-items: center; gap: var(--uwc-space-2); flex-wrap: wrap; margin-top: var(--uwc-space-3); }
    select {
      height: var(--uwc-btn-height-md); padding: 0 var(--uwc-space-3);
      border: 1.5px solid var(--uwc-border); border-radius: var(--uwc-radius-md);
      background-color: var(--uwc-surface); color: var(--uwc-text-primary);
      font-family: var(--uwc-font); font-size: var(--uwc-text-sm); cursor: pointer;
      flex: 1; min-width: 200px; max-width: 320px;
    }
    select:focus { outline: none; border-color: var(--uwc-color-primary); }

    .prog-area { margin-top: var(--uwc-space-3); }
    .no-gpu-warn {
      margin-top: var(--uwc-space-3); padding: var(--uwc-space-3) var(--uwc-space-4);
      background: #fee2e2; border: 1px solid #fca5a5; border-radius: var(--uwc-radius-md);
      font-size: var(--uwc-text-sm); color: #991b1b; line-height: 1.5;
    }
    .cache-note { margin-top: var(--uwc-space-2); font-size: var(--uwc-text-xs); color: var(--uwc-text-tertiary); }
  `;

  @state() private _status:  AIStatus = 'idle';
  @state() private _msg      = '';
  @state() private _progress = 0;
  @state() private _progText = '';

  connectedCallback(): void {
    super.connectedCallback();
    this._status = aiEngine.status;
    this._msg    = aiEngine.statusMsg;
    aiEngine.subscribeStatus((s: AIStatus, m: string) => { this._status = s; this._msg = m;
      if (s === 'ready') this.dispatchEvent(new CustomEvent('ai-ready', { bubbles: true, composed: true }));
    });
    aiEngine.subscribeProgress((p: LoadProgress) => { this._progress = p.progress; this._progText = p.text; });
  }

  render() {
    const isReady   = this._status === 'ready';
    const isLoading = this._status === 'loading';
    const pillClass = `status-pill pill-${this._status}`;
    const pillLabel = { idle:'Not loaded', loading:'Loading…', ready:'Ready', error:'Error', 'no-gpu':'No WebGPU' }[this._status] ?? '';

    return html`
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">
            🤖 Local AI Engine
            <span class="${pillClass}">
              ${isReady ? '✓' : ''} ${this._msg || pillLabel}
            </span>
          </div>
          ${isReady ? html`
            <uwc-button size="sm" variant="secondary" @click="${() => aiEngine.unload()}">✕ Unload model</uwc-button>
          ` : ''}
        </div>

        ${this._status === 'no-gpu' ? html`
          <div class="no-gpu-warn">
            ⚠ <strong>WebGPU is not available</strong> in this browser.
            AI features require Chrome 113+, Edge 113+, or Firefox Nightly with WebGPU enabled.
            All PDF tools (Merge, Compress, Sign, Extract) still work normally.
          </div>
        ` : ''}

        ${!isReady && this._status !== 'no-gpu' ? html`
          <div class="controls">
            <select ?disabled="${isLoading}"
              @change="${(e: Event) => aiEngine.setModel((e.target as HTMLSelectElement).value as any)}">
              ${AI_MODELS.map(m => html`
                <option value="${m.id}" ?selected="${m.id === aiEngine.modelId}">
                  ${m.label} · ${m.size}${m.id === AI_MODELS[0]?.id ? ' ← start here' : ''}
                </option>`)}
            </select>
            <uwc-button variant="ai" ?loading="${isLoading}" ?disabled="${isLoading}"
              @click="${() => aiEngine.load()}">
              ⬇ Load AI Model
            </uwc-button>
          </div>
          <div class="cache-note">
            Downloaded from Hugging Face · cached in browser after first load · runs via WebGPU, no server
          </div>
        ` : ''}

        ${isLoading ? html`
          <div class="prog-area">
            <uwc-progress .value="${this._progress}" .max="${100}" status="${this._progText}"></uwc-progress>
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'uwc-ai-engine-panel': UwcAIEnginePanel; } }
