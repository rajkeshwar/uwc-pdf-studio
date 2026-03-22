import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BASE_STYLES } from '../../ui/tokens/design-tokens.js';
import { pdfEngine, PDFEngine, PluginRegistry } from '../../core/index.js';
import type { IPlugin, PluginMeta } from '../../core/index.js';
import '../../ui/index.js';

const META: PluginMeta = {
  id: 'compress', name: 'Compress PDF', icon: 'compress', tag: 'uwc-plugin-compress',
  description: 'Reduce PDF file size by re-rendering pages at lower resolution.',
  category: 'pdf', order: 3,
};
class CompressPlugin implements IPlugin { readonly meta = META; }
PluginRegistry.instance.register(new CompressPlugin());

@customElement('uwc-plugin-compress')
export class UwcPluginCompress extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }
    .form-area { max-width: 600px; }
    .drop-wrap { max-width: 600px; }
    .slider-section { margin-top: var(--uwc-space-5); max-width: 600px; display: flex; flex-direction: column; gap: var(--uwc-space-4); }
    .slider-row { display: flex; flex-direction: column; gap: var(--uwc-space-1); }
    .slider-label { display: flex; justify-content: space-between; font-size: var(--uwc-text-sm); font-weight: var(--uwc-weight-medium); color: var(--uwc-text-secondary); }
    .slider-val   { color: var(--uwc-color-primary); font-weight: var(--uwc-weight-semibold); }
    input[type=range] { width: 100%; accent-color: var(--uwc-color-primary); }
    .info-hint { margin-top: var(--uwc-space-2); padding: var(--uwc-space-2) var(--uwc-space-3); background: var(--uwc-color-primary-light); border-radius: var(--uwc-radius-md); font-size: var(--uwc-text-xs); color: var(--uwc-text-secondary); }
    .actions { margin-top: var(--uwc-space-5); display: flex; gap: var(--uwc-space-3); flex-wrap: wrap; }
    .result  { margin-top: var(--uwc-space-4); padding: var(--uwc-space-4); max-width: 600px; background: var(--uwc-bg-subtle); border-radius: var(--uwc-radius-lg); border: 1px solid var(--uwc-border); }
    .stat-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--uwc-space-3); margin-top: var(--uwc-space-3); }
    .stat     { text-align: center; padding: var(--uwc-space-3); background: var(--uwc-surface); border-radius: var(--uwc-radius-md); }
    .stat-val { font-size: var(--uwc-text-lg); font-weight: var(--uwc-weight-bold); color: var(--uwc-color-primary); }
    .stat-lbl { font-size: var(--uwc-text-xs); color: var(--uwc-text-tertiary); margin-top: 2px; }
    uwc-progress { margin-top: var(--uwc-space-4); max-width: 600px; display: block; }
  `;

  @state() private _file:    File | null = null;
  @state() private _scale    = 0.8;
  @state() private _quality  = 55;
  @state() private _busy     = false;
  @state() private _progress = 0;
  @state() private _total    = 0;
  @state() private _status   = '';
  @state() private _result:  { blob: Blob; originalSize: number; compressedSize: number; ratio: number } | null = null;

  render() {
    const saving = Math.round((this._result?.ratio ?? 0) * 100);
    return html`
      <div class="drop-wrap">
        <uwc-file-drop accept=".pdf" label="Drop a PDF to compress"
          @files-selected="${(e: CustomEvent) => { this._file = (e.detail as File[])[0] ?? null; this._result = null; }}">
        </uwc-file-drop>
      </div>

      <div class="slider-section">
        <div class="slider-row">
          <div class="slider-label"><span>Render scale</span><span class="slider-val">${this._scale.toFixed(1)}×</span></div>
          <input type="range" min="0.3" max="1.5" step="0.1" .value="${String(this._scale)}"
            @input="${(e: Event) => this._scale = parseFloat((e.target as HTMLInputElement).value)}">
          <div class="info-hint">Lower scale = smaller file. Best for image-heavy PDFs. Text becomes rasterized.</div>
        </div>
        <div class="slider-row">
          <div class="slider-label"><span>JPEG quality</span><span class="slider-val">${this._quality}%</span></div>
          <input type="range" min="10" max="90" step="5" .value="${String(this._quality)}"
            @input="${(e: Event) => this._quality = parseInt((e.target as HTMLInputElement).value)}">
        </div>
      </div>

      ${this._busy ? html`<uwc-progress .value="${this._progress}" .max="${this._total}" label="Compressing…" status="${this._status}"></uwc-progress>` : ''}

      ${this._result ? html`
        <div class="result">
          <div style="font-weight:var(--uwc-weight-semibold);color:var(--uwc-color-success)">✅ Compressed — saved ${saving}%</div>
          <div class="stat-row">
            <div class="stat"><div class="stat-val">${(this._result.originalSize/1024).toFixed(0)} KB</div><div class="stat-lbl">Original</div></div>
            <div class="stat"><div class="stat-val">${(this._result.compressedSize/1024).toFixed(0)} KB</div><div class="stat-lbl">Compressed</div></div>
            <div class="stat"><div class="stat-val" style="color:var(--uwc-color-success)">${saving}%</div><div class="stat-lbl">Saved</div></div>
          </div>
        </div>` : ''}

      <div class="actions">
        <uwc-button variant="primary" ?disabled="${!this._file || this._busy}" ?loading="${this._busy}" @click="${this._compress}">
          <uwc-icon name="compress" slot="icon" size="16"></uwc-icon>
          Compress PDF
        </uwc-button>
        ${this._result ? html`
          <uwc-button variant="secondary" @click="${this._download}">
            <uwc-icon name="download" slot="icon" size="16"></uwc-icon>
            Download compressed.pdf
          </uwc-button>` : ''}
      </div>
    `;
  }

  private async _compress(): Promise<void> {
    if (!this._file) return;
    this._busy = true; this._result = null; this._progress = 0;
    try {
      this._result = await pdfEngine.compress(
        this._file,
        { scale: this._scale, quality: this._quality / 100 },
        (n: number, total: number) => { this._progress = n; this._total = total; this._status = `Page ${n}/${total}`; }
      );
    } catch (e) { this._status = `❌ ${(e as Error).message}`; }
    finally { this._busy = false; }
  }
  private _download(): void { if (this._result) PDFEngine.download(this._result.blob, 'compressed.pdf'); }
}

declare global { interface HTMLElementTagNameMap { 'uwc-plugin-compress': UwcPluginCompress; } }
