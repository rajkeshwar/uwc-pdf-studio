import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BASE_STYLES } from '../../../ui/tokens/design-tokens.js';
import { pdfEngine, PDFEngine, PluginRegistry, loader } from '../../../core/index.js';
import { aiEngine } from '../../../core/AIEngine.js';
import type { IPlugin, PluginMeta } from '../../../core/index.js';
import '../../../ui/index.js';
import '../uwc-ai-engine-panel.js';

const META: PluginMeta = {
  id: 'ai-ocr', name: 'OCR + AI Clean', icon: 'ocr', tag: 'uwc-plugin-ocr',
  description: 'Tesseract WASM OCR for scanned documents, then AI fixes errors and restores structure.',
  category: 'ai', order: 3, badge: 'WASM',
};
class OcrPlugin implements IPlugin { readonly meta = META; }
PluginRegistry.instance.register(new OcrPlugin());

const LANGS = [
  { value: 'eng', label: 'English' },
  { value: 'deu', label: 'German' },
  { value: 'fra', label: 'French' },
  { value: 'spa', label: 'Spanish' },
  { value: 'ita', label: 'Italian' },
  { value: 'por', label: 'Portuguese' },
  { value: 'chi_sim', label: 'Chinese (Simplified)' },
  { value: 'jpn', label: 'Japanese' },
  { value: 'ara', label: 'Arabic' },
];

@customElement('uwc-plugin-ocr')
export class UwcPluginOcr extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }
    .form-row  { max-width: 600px; display: flex; flex-direction: column; gap: var(--uwc-space-4); }
    .drop-wrap { max-width: 600px; }
    .lang-row  { display: flex; flex-direction: column; gap: var(--uwc-space-1); }
    .lang-label { font-size: var(--uwc-text-sm); font-weight: var(--uwc-weight-medium); color: var(--uwc-text-secondary); }
    select {
      height: var(--uwc-btn-height-md); padding: 0 var(--uwc-space-3);
      border: 1.5px solid var(--uwc-border); border-radius: var(--uwc-radius-md);
      background-color: var(--uwc-surface); color: var(--uwc-text-primary);
      font-family: var(--uwc-font); font-size: var(--uwc-text-sm); cursor: pointer;
      max-width: 220px;
    }
    select:focus { outline: none; border-color: var(--uwc-color-primary); }
    .actions     { margin-top: var(--uwc-space-4); display: flex; gap: var(--uwc-space-3); flex-wrap: wrap; }
    .output-area {
      margin-top: var(--uwc-space-5); padding: var(--uwc-space-4);
      background: var(--uwc-surface); border: 1px solid var(--uwc-border);
      border-radius: var(--uwc-radius-lg); font-size: var(--uwc-text-sm);
      font-family: var(--uwc-font-mono); line-height: 1.65; white-space: pre-wrap;
      max-width: 780px; max-height: 380px; overflow-y: auto; color: var(--uwc-text-primary);
    }
    .output-area.streaming { border-color: var(--uwc-color-ai); background: var(--uwc-color-ai-light); }
    .output-area::-webkit-scrollbar { width: 5px; }
    .output-area::-webkit-scrollbar-thumb { background: var(--uwc-border-strong); border-radius: 3px; }
    .cursor::after { content: '▊'; animation: blink .7s step-end infinite; color: var(--uwc-color-ai); }
    @keyframes blink { 50% { opacity: 0; } }
    .status { margin-top: var(--uwc-space-3); font-size: var(--uwc-text-sm); color: var(--uwc-text-tertiary); }
    .wasm-note { max-width: 600px; margin-top: var(--uwc-space-3); padding: var(--uwc-space-3) var(--uwc-space-4); background: #dbeafe; border-radius: var(--uwc-radius-md); font-size: var(--uwc-text-xs); color: #1e40af; }
    uwc-progress { max-width: 600px; display: block; margin-top: var(--uwc-space-4); }
  `;

  @state() private _file:      File | null = null;
  @state() private _lang       = 'eng';
  @state() private _busy       = false;
  @state() private _progress   = 0;
  @state() private _status     = '';
  @state() private _ocrText    = '';
  @state() private _output     = '';
  @state() private _streaming  = false;
  @state() private _docxBlob:  Blob | null = null;

  render() {
    const hasOcr = !!this._ocrText;

    return html`
      <uwc-ai-engine-panel></uwc-ai-engine-panel>

      <div class="form-row">
        <div class="drop-wrap">
          <uwc-file-drop accept=".pdf,image/png,image/jpeg,image/webp"
            label="Drop a scanned PDF or image"
            hint="PDF (first page rendered), PNG, JPG, WebP"
            @files-selected="${(e: CustomEvent) => { this._file = (e.detail as File[])[0] ?? null; this._ocrText = ''; this._output = ''; this._docxBlob = null; }}">
          </uwc-file-drop>
        </div>

        <div class="lang-row">
          <div class="lang-label">OCR Language</div>
          <select @change="${(e: Event) => this._lang = (e.target as HTMLSelectElement).value}">
            ${LANGS.map(l => html`<option value="${l.value}" ?selected="${l.value === this._lang}">${l.label}</option>`)}
          </select>
        </div>
      </div>

      <div class="wasm-note">
        ⚡ OCR runs via <strong>Tesseract.js WebAssembly</strong> — first run downloads ~8 MB language model, then it's cached offline.
      </div>

      ${this._busy ? html`<uwc-progress .value="${this._progress}" .max="${100}" indeterminate="${this._progress === 0}" status="${this._status}"></uwc-progress>` : ''}
      ${this._status && !this._busy ? html`<div class="status">${this._status}</div>` : ''}

      <div class="actions">
        <uwc-button variant="primary" ?disabled="${!this._file || this._busy}" ?loading="${this._busy}" @click="${this._runOcr}">
          <uwc-icon name="ocr" slot="icon" size="16"></uwc-icon>
          Run OCR (WASM)
        </uwc-button>
        ${hasOcr ? html`
          <uwc-button variant="ai" ?disabled="${this._busy}" @click="${this._aiClean}">
            <uwc-icon name="sparkles" slot="icon" size="16"></uwc-icon>
            AI Clean & Format
          </uwc-button>
          <uwc-button variant="secondary" @click="${this._downloadDocx}">
            <uwc-icon name="download" slot="icon" size="16"></uwc-icon>
            Export DOCX
          </uwc-button>` : ''}
      </div>

      ${this._output ? html`
        <div class="output-area ${this._streaming ? 'streaming cursor' : ''}">${this._output}</div>` : ''}
    `;
  }

  private async _runOcr(): Promise<void> {
    if (!this._file) return;
    this._busy = true; this._ocrText = ''; this._output = ''; this._progress = 0;
    this._status = 'Preparing image…';
    try {
      let src: string;
      if (this._file.type === 'application/pdf') {
        this._status = 'Rendering PDF page…';
        const lib  = await loader.pdfjs();
        const buf  = new Uint8Array(await this._file.arrayBuffer());
        const pdf  = await (lib as any).getDocument({ data: buf }).promise;
        const page = await pdf.getPage(1);
        const vp   = page.getViewport({ scale: 2.5 });
        const cv   = Object.assign(document.createElement('canvas'), { width: vp.width, height: vp.height });
        await page.render({ canvasContext: cv.getContext('2d')!, viewport: vp }).promise;
        src = cv.toDataURL('image/png');
      } else {
        src = await new Promise<string>(res => {
          const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(this._file!);
        });
      }

      this._status = `Loading Tesseract WASM (${this._lang})… ~8 MB first time, then cached.`;
      const { createWorker } = await loader.tesseract();
      const worker = await (createWorker as any)(this._lang, 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            this._progress = Math.round(m.progress * 100);
            this._status   = `OCR: ${this._progress}%`;
          } else {
            this._status = m.status;
          }
        },
      });
      const { data } = await worker.recognize(src);
      await worker.terminate();

      this._ocrText = data.text;
      this._output  = data.text;
      this._docxBlob = await pdfEngine.textToDocxBlob(data.text);
      this._status  = `✅ OCR complete · confidence: ${(data.confidence ?? 0).toFixed(1)}%`;
      this._progress = 100;
    } catch (e) { this._status = `❌ ${(e as Error).message}`; }
    finally { this._busy = false; }
  }

  private async _aiClean(): Promise<void> {
    if (!this._ocrText || !aiEngine.isReady) {
      this._status = aiEngine.isReady ? '⚠ Run OCR first.' : '⚠ Load the AI model above first.';
      return;
    }
    this._busy = true; this._streaming = true; this._output = '';
    this._status = '🤖 AI cleaning OCR text…';
    try {
      const cleaned = await aiEngine.stream(
        'You are a professional text editor. Fix OCR scanning errors. Restore paragraph breaks. Correct obvious spelling errors caused by OCR. Return ONLY the corrected text, nothing else.',
        `Fix this OCR text:\n\n${this._ocrText.slice(0, 10000)}`,
        (_delta, full) => { this._output = full; },
        2000,
      );
      this._ocrText  = cleaned;
      this._docxBlob = await pdfEngine.textToDocxBlob(cleaned);
      this._status   = '✅ AI clean complete';
    } catch (e) { this._status = `❌ ${(e as Error).message}`; }
    finally { this._busy = false; this._streaming = false; }
  }

  private _downloadDocx(): void {
    if (this._docxBlob) PDFEngine.download(this._docxBlob, 'ocr-output.docx');
  }
}

declare global { interface HTMLElementTagNameMap { 'uwc-plugin-ocr': UwcPluginOcr; } }
