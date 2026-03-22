import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BASE_STYLES } from '../../../ui/tokens/design-tokens.js';
import { pdfEngine, PDFEngine, PluginRegistry } from '../../../core/index.js';
import { aiEngine } from '../../../core/AIEngine.js';
import type { IPlugin, PluginMeta } from '../../../core/index.js';
import '../../../ui/index.js';
import '../uwc-ai-engine-panel.js';

const META: PluginMeta = {
  id: 'ai-tables', name: 'Table Extract', icon: 'table', tag: 'uwc-plugin-tables',
  description: 'AI finds and reconstructs all tables in a PDF as clean, downloadable CSV.',
  category: 'ai', order: 5,
};
class TablesPlugin implements IPlugin { readonly meta = META; }
PluginRegistry.instance.register(new TablesPlugin());

@customElement('uwc-plugin-tables')
export class UwcPluginTables extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }
    .drop-wrap  { max-width: 600px; }
    .actions    { margin-top: var(--uwc-space-4); display: flex; gap: var(--uwc-space-3); flex-wrap: wrap; }
    .output-area {
      margin-top: var(--uwc-space-5); padding: var(--uwc-space-4);
      background: var(--uwc-surface); border: 1px solid var(--uwc-border);
      border-radius: var(--uwc-radius-lg); font-size: 12px;
      font-family: var(--uwc-font-mono); line-height: 1.6; white-space: pre-wrap;
      max-width: 900px; max-height: 460px; overflow: auto; color: var(--uwc-text-primary);
    }
    .output-area.streaming { border-color: var(--uwc-color-ai); background: var(--uwc-color-ai-light); }
    .output-area::-webkit-scrollbar { width: 5px; height: 5px; }
    .output-area::-webkit-scrollbar-thumb { background: var(--uwc-border-strong); border-radius: 3px; }
    .cursor::after { content: '▊'; animation: blink .7s step-end infinite; color: var(--uwc-color-ai); }
    @keyframes blink { 50% { opacity: 0; } }
    .status { margin-top: var(--uwc-space-3); font-size: var(--uwc-text-sm); color: var(--uwc-text-tertiary); }
    .hint-note { max-width: 600px; margin-top: var(--uwc-space-3); padding: var(--uwc-space-3) var(--uwc-space-4); background: var(--uwc-color-primary-light); border-radius: var(--uwc-radius-md); font-size: var(--uwc-text-xs); color: var(--uwc-text-secondary); }
  `;

  @state() private _file:     File | null = null;
  @state() private _busy      = false;
  @state() private _output    = '';
  @state() private _streaming = false;
  @state() private _status    = '';
  @state() private _csvBlob:  Blob | null = null;

  render() {
    return html`
      <uwc-ai-engine-panel></uwc-ai-engine-panel>

      <div class="drop-wrap">
        <uwc-file-drop accept=".pdf" label="Drop a PDF containing tables"
          hint="Works on digital PDFs with structured data"
          @files-selected="${(e: CustomEvent) => { this._file = (e.detail as File[])[0] ?? null; this._output = ''; this._csvBlob = null; }}">
        </uwc-file-drop>
      </div>
      <div class="hint-note">
        💡 The AI reads the extracted text and reconstructs any tabular data as valid CSV.
        Multiple tables are separated by comment headers. Results are best on structured, digital PDFs.
      </div>

      <div class="actions">
        <uwc-button variant="ai" ?disabled="${!this._file || this._busy}" ?loading="${this._busy}"
          @click="${this._extract}">
          <uwc-icon name="table" slot="icon" size="16"></uwc-icon>
          Extract Tables (Local AI)
        </uwc-button>
        ${this._csvBlob ? html`
          <uwc-button variant="secondary" @click="${this._downloadCsv}">
            <uwc-icon name="download" slot="icon" size="16"></uwc-icon>
            Download tables.csv
          </uwc-button>` : ''}
      </div>

      ${this._status ? html`<div class="status">${this._status}</div>` : ''}

      ${this._output ? html`
        <div class="output-area ${this._streaming ? 'streaming cursor' : ''}">${this._output}</div>` : ''}
    `;
  }

  private async _extract(): Promise<void> {
    if (!this._file || !aiEngine.isReady) {
      this._status = aiEngine.isReady ? '⚠ Select a PDF.' : '⚠ Load the AI model above first.';
      return;
    }
    this._busy = true; this._output = ''; this._streaming = false; this._csvBlob = null;
    this._status = 'Extracting text from PDF…';
    try {
      const { text } = await pdfEngine.extractText(this._file);
      if (!text.trim()) { this._status = '⚠ No extractable text found.'; return; }

      this._status = '🤖 AI finding and reconstructing tables…';
      this._streaming = true;
      const csv = await aiEngine.stream(
        `You are a data extraction expert. Find tables in the document and output them as valid CSV.
Rules:
- Comma-separated, quote fields that contain commas
- If multiple tables, separate with a blank line and a comment "# Table N: description"
- Output ONLY CSV, no explanation text`,
        `Extract all tables as CSV:\n\n${text.slice(0, 10000)}`,
        (_delta, full) => { this._output = full; },
        2000,
      );
      this._csvBlob = new Blob([csv], { type: 'text/csv' });
      this._status  = '✅ Table extraction complete';
    } catch (e) { this._status = `❌ ${(e as Error).message}`; }
    finally { this._busy = false; this._streaming = false; }
  }

  private _downloadCsv(): void {
    if (this._csvBlob) PDFEngine.download(this._csvBlob, 'tables.csv');
  }
}

declare global { interface HTMLElementTagNameMap { 'uwc-plugin-tables': UwcPluginTables; } }
