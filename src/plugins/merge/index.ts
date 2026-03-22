// ═══════════════════════════════════════════════════════════════
// FILE: src/plugins/merge/index.ts
// ═══════════════════════════════════════════════════════════════
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BASE_STYLES } from '../../ui/tokens/design-tokens.js';
import { pdfEngine, PDFEngine, PluginRegistry } from '../../core/index.js';
import type { IPlugin, PluginMeta } from '../../core/index.js';
import '../../ui/index.js';

const META: PluginMeta = {
  id: 'merge', name: 'Merge PDFs', icon: 'merge', tag: 'uwc-plugin-merge',
  description: 'Combine multiple PDF files into one document.',
  category: 'pdf', order: 1,
};
class MergePlugin implements IPlugin { readonly meta = META; }
PluginRegistry.instance.register(new MergePlugin());

@customElement('uwc-plugin-merge')
export class UwcPluginMerge extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }
    .drop-wrap  { max-width: 600px; }
    .actions    { margin-top: var(--uwc-space-5); display: flex; gap: var(--uwc-space-3); align-items: center; flex-wrap: wrap; }
    .result     { margin-top: var(--uwc-space-4); padding: var(--uwc-space-4); max-width: 600px;
                  background: var(--uwc-bg-subtle); border-radius: var(--uwc-radius-lg); border: 1px solid var(--uwc-border); }
    .result-title { font-weight: var(--uwc-weight-semibold); margin-bottom: var(--uwc-space-2); color: var(--uwc-color-success); }
    .result-meta  { font-size: var(--uwc-text-sm); color: var(--uwc-text-secondary); }
    uwc-progress  { margin-top: var(--uwc-space-4); max-width: 600px; display: block; }
  `;

  @state() private _files:    File[] = [];
  @state() private _busy     = false;
  @state() private _progress = 0;
  @state() private _status   = '';
  @state() private _result:  { blob: Blob; pageCount: number } | null = null;

  render() {
    return html`
      <div class="drop-wrap">
        <uwc-file-drop accept=".pdf" multiple
          label="Drop PDF files here or click to browse"
          hint="Select multiple PDFs — merged in listed order"
          @files-selected="${(e: CustomEvent) => { this._files = e.detail; this._result = null; }}">
        </uwc-file-drop>
      </div>

      ${this._busy ? html`<uwc-progress .value="${this._progress}" .max="${this._files.length}" label="Merging…" status="${this._status}"></uwc-progress>` : ''}

      ${this._result ? html`
        <div class="result">
          <div class="result-title">✅ Merge complete</div>
          <div class="result-meta">${this._files.length} files · ${this._result.pageCount} pages · ${(this._result.blob.size/1024).toFixed(1)} KB</div>
        </div>` : ''}

      <div class="actions">
        <uwc-button variant="primary" ?disabled="${this._files.length < 1 || this._busy}" ?loading="${this._busy}" @click="${this._merge}">
          <uwc-icon name="merge" slot="icon" size="16"></uwc-icon>
          Merge ${this._files.length > 0 ? `(${this._files.length} files)` : ''}
        </uwc-button>
        ${this._result ? html`
          <uwc-button variant="secondary" @click="${this._download}">
            <uwc-icon name="download" slot="icon" size="16"></uwc-icon>
            Download merged.pdf
          </uwc-button>` : ''}
      </div>
    `;
  }

  private async _merge(): Promise<void> {
    this._busy = true; this._result = null; this._progress = 0;
    try {
      this._result = await pdfEngine.merge(this._files, (n: number, total: number) => {
        this._progress = n; this._status = `Processing ${n}/${total}: ${this._files[n-1]?.name ?? ''}`;
      });
    } catch (e) { this._status = `❌ ${(e as Error).message}`; }
    finally { this._busy = false; }
  }
  private _download(): void { if (this._result) PDFEngine.download(this._result.blob, 'merged.pdf'); }
}

declare global { interface HTMLElementTagNameMap { 'uwc-plugin-merge': UwcPluginMerge; } }
