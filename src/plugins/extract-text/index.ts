import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BASE_STYLES } from '../../ui/tokens/design-tokens.js';
import { pdfEngine, PDFEngine, PluginRegistry } from '../../core/index.js';
import type { IPlugin, PluginMeta } from '../../core/index.js';
import '../../ui/index.js';

const META: PluginMeta = {
  id: 'extract-text', name: 'Extract → DOCX', icon: 'extract', tag: 'uwc-plugin-extract',
  description: 'Extract selectable text from a PDF and export as a Word .docx file.',
  category: 'pdf', order: 4,
};
class ExtractPlugin implements IPlugin { readonly meta = META; }
PluginRegistry.instance.register(new ExtractPlugin());

@customElement('uwc-plugin-extract')
export class UwcPluginExtract extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }
    .drop-wrap { max-width: 600px; }
    .hint-note { max-width: 600px; margin-top: var(--uwc-space-3); padding: var(--uwc-space-3) var(--uwc-space-4);
                 background: var(--uwc-color-primary-light); border-radius: var(--uwc-radius-md);
                 font-size: var(--uwc-text-sm); color: var(--uwc-text-secondary); }
    .actions   { margin-top: var(--uwc-space-5); display: flex; gap: var(--uwc-space-3); flex-wrap: wrap; }
    .preview   {
      margin-top: var(--uwc-space-4); padding: var(--uwc-space-4); max-width: 700px;
      background: var(--uwc-bg-subtle); border-radius: var(--uwc-radius-lg);
      border: 1px solid var(--uwc-border); font-size: var(--uwc-text-sm);
      color: var(--uwc-text-secondary); white-space: pre-wrap;
      max-height: 260px; overflow-y: auto; font-family: var(--uwc-font-mono); line-height: 1.6;
    }
    .preview::-webkit-scrollbar { width: 5px; }
    .preview::-webkit-scrollbar-thumb { background: var(--uwc-border-strong); border-radius: 3px; }
    uwc-progress { margin-top: var(--uwc-space-4); max-width: 600px; display: block; }
  `;

  @state() private _file:    File | null = null;
  @state() private _busy    = false;
  @state() private _status  = '';
  @state() private _text    = '';
  @state() private _docxBlob: Blob | null = null;

  render() {
    return html`
      <div class="drop-wrap">
        <uwc-file-drop accept=".pdf" label="Drop a PDF to extract text"
          hint="PDF must contain selectable text. For scanned PDFs, use the OCR tool."
          @files-selected="${(e: CustomEvent) => { this._file = (e.detail as File[])[0] ?? null; this._text = ''; this._docxBlob = null; }}">
        </uwc-file-drop>
      </div>
      <div class="hint-note">💡 Works on digital PDFs only. For scanned/image PDFs, use the ✨ OCR tool in the AI section.</div>

      ${this._busy ? html`<uwc-progress indeterminate label="Extracting…" status="${this._status}"></uwc-progress>` : ''}

      ${this._text ? html`<div class="preview">${this._text.slice(0, 1400)}${this._text.length > 1400 ? '\n…(preview truncated)' : ''}</div>` : ''}

      <div class="actions">
        <uwc-button variant="primary" ?disabled="${!this._file || this._busy}" ?loading="${this._busy}" @click="${this._extract}">
          <uwc-icon name="extract" slot="icon" size="16"></uwc-icon>
          Extract Text
        </uwc-button>
        ${this._docxBlob ? html`
          <uwc-button variant="secondary" @click="${this._download}">
            <uwc-icon name="download" slot="icon" size="16"></uwc-icon>
            Download extracted.docx
          </uwc-button>` : ''}
      </div>
    `;
  }

  private async _extract(): Promise<void> {
    if (!this._file) return;
    this._busy = true; this._text = ''; this._docxBlob = null;
    try {
      const { text } = await pdfEngine.extractText(this._file);
      if (!text.trim()) { this._status = '⚠ No selectable text found. Use the OCR tool instead.'; this._busy = false; return; }
      this._text     = text;
      this._docxBlob = await pdfEngine.textToDocxBlob(text);
      this._status   = `✅ Extracted ${text.length.toLocaleString()} characters`;
    } catch (e) { this._status = `❌ ${(e as Error).message}`; }
    finally { this._busy = false; }
  }
  private _download(): void { if (this._docxBlob) PDFEngine.download(this._docxBlob, 'extracted.docx'); }
}

declare global { interface HTMLElementTagNameMap { 'uwc-plugin-extract': UwcPluginExtract; } }
