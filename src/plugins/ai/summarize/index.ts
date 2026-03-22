import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BASE_STYLES } from '../../../ui/tokens/design-tokens.js';
import { pdfEngine, PluginRegistry } from '../../../core/index.js';
import { aiEngine } from '../../../core/AIEngine.js';
import type { IPlugin, PluginMeta } from '../../../core/index.js';
import '../../../ui/index.js';
import '../uwc-ai-engine-panel.js';

const META: PluginMeta = {
  id: 'ai-summarize', name: 'AI Summarize', icon: 'summarize', tag: 'uwc-plugin-summarize',
  description: 'Generate TL;DR, key points, executive briefs or ELI5 summaries from any PDF.',
  category: 'ai', order: 1,
};
class SummarizePlugin implements IPlugin { readonly meta = META; }
PluginRegistry.instance.register(new SummarizePlugin());

const STYLES: Record<string, { sys: string; label: string }> = {
  tldr:      { label: 'TL;DR — 2‑3 sentences',                 sys: 'You are a concise analyst. Write ONLY a TL;DR summary in 2-3 sentences.' },
  keypoints: { label: 'Key Points — bullet list',               sys: 'You are a document analyst. Extract 5-8 key points. Start each with "• ".' },
  detailed:  { label: 'Detailed — structured paragraphs',       sys: 'You are a document analyst. Write a thorough 3-4 paragraph structured summary.' },
  executive: { label: 'Executive Brief',                        sys: 'You are a business analyst. Write an executive brief with these sections: **Purpose**, **Key Findings**, **Recommendations**, **Next Steps**.' },
  eli5:      { label: 'Explain Like I\'m 5',                    sys: 'Explain this document to a 5-year-old. Use simple words and fun analogies.' },
  questions: { label: 'Top 5 Questions This Doc Answers',       sys: 'List the top 5 questions this document answers. Format: "Q1: ... Answer: ..."' },
};

@customElement('uwc-plugin-summarize')
export class UwcPluginSummarize extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }
    .form-row  { max-width: 600px; display: flex; flex-direction: column; gap: var(--uwc-space-4); }
    .drop-wrap { max-width: 600px; }
    .style-row { display: flex; flex-direction: column; gap: var(--uwc-space-1); }
    .style-label { font-size: var(--uwc-text-sm); font-weight: var(--uwc-weight-medium); color: var(--uwc-text-secondary); }
    select {
      height: var(--uwc-btn-height-md); padding: 0 var(--uwc-space-3);
      border: 1.5px solid var(--uwc-border); border-radius: var(--uwc-radius-md);
      background-color: var(--uwc-surface); color: var(--uwc-text-primary);
      font-family: var(--uwc-font); font-size: var(--uwc-text-sm); cursor: pointer;
      max-width: 340px;
    }
    select:focus { outline: none; border-color: var(--uwc-color-primary); }
    .actions { margin-top: var(--uwc-space-4); }
    .output-area {
      margin-top: var(--uwc-space-5); padding: var(--uwc-space-5);
      background: var(--uwc-surface); border: 1px solid var(--uwc-border);
      border-radius: var(--uwc-radius-lg); font-size: var(--uwc-text-base);
      line-height: var(--uwc-leading-relaxed); white-space: pre-wrap;
      max-width: 780px; color: var(--uwc-text-primary);
      min-height: 80px;
    }
    .output-area.streaming { border-color: var(--uwc-color-ai); background: var(--uwc-color-ai-light); }
    .cursor::after { content: '▊'; animation: blink .7s step-end infinite; color: var(--uwc-color-ai); }
    @keyframes blink { 50% { opacity: 0; } }
    .status { margin-top: var(--uwc-space-3); font-size: var(--uwc-text-sm); color: var(--uwc-text-tertiary); }
  `;

  @state() private _file:      File | null = null;
  @state() private _style      = 'tldr';
  @state() private _busy       = false;
  @state() private _output     = '';
  @state() private _streaming  = false;
  @state() private _status     = '';

  render() {
    return html`
      <uwc-ai-engine-panel></uwc-ai-engine-panel>

      <div class="form-row">
        <div class="drop-wrap">
          <uwc-file-drop accept=".pdf" label="Drop a PDF to summarize"
            hint="Works on digital PDFs. For scanned docs, run OCR first."
            @files-selected="${(e: CustomEvent) => { this._file = (e.detail as File[])[0] ?? null; this._output = ''; }}">
          </uwc-file-drop>
        </div>

        <div class="style-row">
          <div class="style-label">Summary style</div>
          <select @change="${(e: Event) => this._style = (e.target as HTMLSelectElement).value}">
            ${Object.entries(STYLES).map(([k, v]) => html`
              <option value="${k}" ?selected="${k === this._style}">${v.label}</option>`)}
          </select>
        </div>
      </div>

      <div class="actions">
        <uwc-button variant="ai" ?disabled="${!this._file || this._busy}" ?loading="${this._busy}"
          @click="${this._summarize}">
          <uwc-icon name="sparkles" slot="icon" size="16"></uwc-icon>
          Summarize with Local AI
        </uwc-button>
      </div>

      ${this._status ? html`<div class="status">${this._status}</div>` : ''}

      ${this._output ? html`
        <div class="output-area ${this._streaming ? 'streaming' : ''} ${this._streaming ? 'cursor' : ''}">
          ${this._output}
        </div>` : ''}
    `;
  }

  private async _summarize(): Promise<void> {
    if (!this._file || !aiEngine.isReady) {
      this._status = aiEngine.isReady ? '⚠ Select a PDF.' : '⚠ Load the AI model above first.';
      return;
    }
    this._busy = true; this._output = ''; this._streaming = true;
    this._status = 'Extracting text from PDF…';
    try {
      const { text } = await pdfEngine.extractText(this._file);
      if (!text.trim()) { this._status = '⚠ No selectable text found. Use the OCR tool for scanned PDFs.'; return; }
      this._status = '🤖 Generating summary…';
      const sys = STYLES[this._style]?.sys ?? STYLES['tldr']!.sys;
      await aiEngine.stream(
        sys,
        `Analyse this document:\n\n${text.slice(0, 10000)}`,
        (_delta, full) => { this._output = full; },
        1400,
      );
      this._status = '✅ Done';
    } catch (e) { this._status = `❌ ${(e as Error).message}`; }
    finally { this._busy = false; this._streaming = false; }
  }
}

declare global { interface HTMLElementTagNameMap { 'uwc-plugin-summarize': UwcPluginSummarize; } }
