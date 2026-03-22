import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BASE_STYLES } from '../../ui/tokens/design-tokens.js';
import { pdfEngine, PDFEngine, PluginRegistry } from '../../core/index.js';
import type { IPlugin, PluginMeta } from '../../core/index.js';
import '../../ui/index.js';

const META: PluginMeta = {
  id: 'images-to-pdf', name: 'Images → PDF', icon: 'images', tag: 'uwc-plugin-images',
  description: 'Convert JPG, PNG, WebP images into a single PDF document.',
  category: 'pdf', order: 2,
};
class ImagesToPdfPlugin implements IPlugin { readonly meta = META; }
PluginRegistry.instance.register(new ImagesToPdfPlugin());

@customElement('uwc-plugin-images')
export class UwcPluginImages extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }
    .drop-wrap { max-width: 600px; }
    .actions   { margin-top: var(--uwc-space-5); display: flex; gap: var(--uwc-space-3); flex-wrap: wrap; align-items: center; }
    .result    { margin-top: var(--uwc-space-4); padding: var(--uwc-space-4); max-width: 600px;
                 background: var(--uwc-bg-subtle); border-radius: var(--uwc-radius-lg); border: 1px solid var(--uwc-border); font-size: var(--uwc-text-sm); color: var(--uwc-text-secondary); }
    uwc-progress { margin-top: var(--uwc-space-4); max-width: 600px; display: block; }
  `;

  @state() private _files:    File[] = [];
  @state() private _busy     = false;
  @state() private _progress = 0;
  @state() private _status   = '';
  @state() private _result:  Blob | null = null;

  render() {
    return html`
      <div class="drop-wrap">
        <uwc-file-drop accept="image/*" multiple
          label="Drop images here (JPG, PNG, WebP, GIF)"
          hint="Each image becomes a page, in the listed order"
          @files-selected="${(e: CustomEvent) => { this._files = e.detail; this._result = null; }}">
        </uwc-file-drop>
      </div>

      ${this._busy ? html`<uwc-progress .value="${this._progress}" .max="${this._files.length}" label="Embedding images…" status="${this._status}"></uwc-progress>` : ''}

      ${this._result ? html`
        <div class="result">✅ PDF created · ${this._files.length} page(s) · ${(this._result.size/1024).toFixed(1)} KB</div>` : ''}

      <div class="actions">
        <uwc-button variant="primary" ?disabled="${this._files.length < 1 || this._busy}" ?loading="${this._busy}" @click="${this._convert}">
          <uwc-icon name="images" slot="icon" size="16"></uwc-icon>
          Convert to PDF
        </uwc-button>
        ${this._result ? html`
          <uwc-button variant="secondary" @click="${this._download}">
            <uwc-icon name="download" slot="icon" size="16"></uwc-icon>
            Download images.pdf
          </uwc-button>` : ''}
      </div>
    `;
  }

  private async _convert(): Promise<void> {
    this._busy = true; this._result = null; this._progress = 0;
    try {
      this._result = await pdfEngine.imagesToPDF(this._files, (n: number, total: number) => {
        this._progress = n; this._status = `${this._files[n-1]?.name ?? ''} (${n}/${total})`;
      });
    } catch (e) { this._status = `❌ ${(e as Error).message}`; }
    finally { this._busy = false; }
  }
  private _download(): void { if (this._result) PDFEngine.download(this._result, 'images.pdf'); }
}

declare global { interface HTMLElementTagNameMap { 'uwc-plugin-images': UwcPluginImages; } }
