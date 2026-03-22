import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BASE_STYLES } from '../../../ui/tokens/design-tokens.js';
import { pdfEngine, PDFEngine, PluginRegistry } from '../../../core/index.js';
import { aiEngine } from '../../../core/AIEngine.js';
import type { IPlugin, PluginMeta } from '../../../core/index.js';
import '../../../ui/index.js';
import '../uwc-ai-engine-panel.js';

const META: PluginMeta = {
  id: 'ai-translate', name: 'AI Translate', icon: 'translate', tag: 'uwc-plugin-translate',
  description: 'Translate PDF content into 14 languages using the local LLM. Export as DOCX.',
  category: 'ai', order: 4,
};
class TranslatePlugin implements IPlugin { readonly meta = META; }
PluginRegistry.instance.register(new TranslatePlugin());

const TARGET_LANGS = [
  'Spanish','French','German','Italian','Portuguese','Dutch',
  'Russian','Chinese (Simplified)','Japanese','Korean','Arabic',
  'Hindi','Turkish','Polish',
];

const SCOPES = [
  { value: 'full',   label: 'Full document (first ~8 000 chars)' },
  { value: 'first',  label: 'First section only' },
  { value: 'custom', label: 'Custom — paste text below' },
];

@customElement('uwc-plugin-translate')
export class UwcPluginTranslate extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }
    .form-area  { max-width: 600px; display: flex; flex-direction: column; gap: var(--uwc-space-4); }
    .drop-wrap  { max-width: 600px; }
    .field      { display: flex; flex-direction: column; gap: var(--uwc-space-1); }
    .field-label { font-size: var(--uwc-text-sm); font-weight: var(--uwc-weight-medium); color: var(--uwc-text-secondary); }
    select {
      height: var(--uwc-btn-height-md); padding: 0 var(--uwc-space-3);
      border: 1.5px solid var(--uwc-border); border-radius: var(--uwc-radius-md);
      background-color: var(--uwc-surface); color: var(--uwc-text-primary);
      font-family: var(--uwc-font); font-size: var(--uwc-text-sm); cursor: pointer;
      max-width: 280px;
    }
    select:focus { outline: none; border-color: var(--uwc-color-primary); }
    textarea {
      width: 100%; padding: var(--uwc-space-3); border: 1.5px solid var(--uwc-border);
      border-radius: var(--uwc-radius-md); font-family: var(--uwc-font);
      font-size: var(--uwc-text-sm); color: var(--uwc-text-primary);
      background: var(--uwc-surface); resize: vertical; min-height: 120px;
      box-sizing: border-box;
    }
    textarea:focus { outline: none; border-color: var(--uwc-color-primary); }
    .actions    { margin-top: var(--uwc-space-4); display: flex; gap: var(--uwc-space-3); flex-wrap: wrap; }
    .output-area {
      margin-top: var(--uwc-space-5); padding: var(--uwc-space-5);
      background: var(--uwc-surface); border: 1px solid var(--uwc-border);
      border-radius: var(--uwc-radius-lg); font-size: var(--uwc-text-base);
      line-height: var(--uwc-leading-relaxed); white-space: pre-wrap;
      max-width: 780px; color: var(--uwc-text-primary); min-height: 80px;
    }
    .output-area.streaming { border-color: var(--uwc-color-ai); background: var(--uwc-color-ai-light); }
    .cursor::after { content: '▊'; animation: blink .7s step-end infinite; color: var(--uwc-color-ai); }
    @keyframes blink { 50% { opacity: 0; } }
    .status { margin-top: var(--uwc-space-3); font-size: var(--uwc-text-sm); color: var(--uwc-text-tertiary); }
  `;

  @state() private _file:     File | null = null;
  @state() private _lang      = 'Spanish';
  @state() private _scope     = 'full';
  @state() private _custom    = '';
  @state() private _busy      = false;
  @state() private _output    = '';
  @state() private _streaming = false;
  @state() private _status    = '';
  @state() private _docxBlob: Blob | null = null;

  render() {
    return html`
      <uwc-ai-engine-panel></uwc-ai-engine-panel>

      <div class="form-area">
        <div class="drop-wrap">
          <uwc-file-drop accept=".pdf" label="Drop a PDF to translate"
            hint="For scanned PDFs, run OCR first then use Custom scope"
            @files-selected="${(e: CustomEvent) => { this._file = (e.detail as File[])[0] ?? null; this._output = ''; this._docxBlob = null; }}">
          </uwc-file-drop>
        </div>

        <div class="field">
          <div class="field-label">Target language</div>
          <select @change="${(e: Event) => this._lang = (e.target as HTMLSelectElement).value}">
            ${TARGET_LANGS.map(l => html`<option ?selected="${l === this._lang}">${l}</option>`)}
          </select>
        </div>

        <div class="field">
          <div class="field-label">Scope</div>
          <select @change="${(e: Event) => this._scope = (e.target as HTMLSelectElement).value}">
            ${SCOPES.map(s => html`<option value="${s.value}" ?selected="${s.value === this._scope}">${s.label}</option>`)}
          </select>
        </div>

        ${this._scope === 'custom' ? html`
        <div class="field">
          <div class="field-label">Text to translate</div>
          <textarea placeholder="Paste text here…" .value="${this._custom}"
            @input="${(e: Event) => this._custom = (e.target as HTMLTextAreaElement).value}"></textarea>
        </div>` : ''}
      </div>

      <div class="actions">
        <uwc-button variant="ai" ?disabled="${this._busy || (!this._file && this._scope !== 'custom')}" ?loading="${this._busy}"
          @click="${this._translate}">
          <uwc-icon name="translate" slot="icon" size="16"></uwc-icon>
          Translate (Local AI)
        </uwc-button>
        ${this._docxBlob ? html`
          <uwc-button variant="secondary" @click="${this._downloadDocx}">
            <uwc-icon name="download" slot="icon" size="16"></uwc-icon>
            Export translated.docx
          </uwc-button>` : ''}
      </div>

      ${this._status ? html`<div class="status">${this._status}</div>` : ''}

      ${this._output ? html`
        <div class="output-area ${this._streaming ? 'streaming cursor' : ''}">${this._output}</div>` : ''}
    `;
  }

  private async _translate(): Promise<void> {
    if (!aiEngine.isReady) { this._status = '⚠ Load the AI model above first.'; return; }
    let text = '';
    this._busy = true; this._output = ''; this._streaming = false; this._docxBlob = null;

    try {
      if (this._scope === 'custom') {
        text = this._custom.trim();
        if (!text) { this._status = '⚠ Paste text in the custom field.'; return; }
      } else {
        if (!this._file) { this._status = '⚠ Select a PDF.'; return; }
        this._status = 'Extracting text…';
        const { text: raw } = await pdfEngine.extractText(this._file);
        text = this._scope === 'first' ? raw.split('\n\n').slice(0, 3).join('\n\n') : raw.slice(0, 10000);
      }
      if (!text) { this._status = '⚠ No text to translate.'; return; }

      this._status = `🤖 Translating to ${this._lang}…`;
      this._streaming = true;
      const result = await aiEngine.stream(
        `You are a professional ${this._lang} translator. Translate accurately and naturally. Preserve paragraph structure. Output ONLY the translation, no commentary.`,
        `Translate to ${this._lang}:\n\n${text}`,
        (_delta, full) => { this._output = full; },
        2500,
      );
      this._docxBlob = await pdfEngine.textToDocxBlob(result);
      this._status   = `✅ Translation to ${this._lang} complete`;
    } catch (e) { this._status = `❌ ${(e as Error).message}`; }
    finally { this._busy = false; this._streaming = false; }
  }

  private _downloadDocx(): void {
    if (this._docxBlob) PDFEngine.download(this._docxBlob, 'translated.docx');
  }
}

declare global { interface HTMLElementTagNameMap { 'uwc-plugin-translate': UwcPluginTranslate; } }
