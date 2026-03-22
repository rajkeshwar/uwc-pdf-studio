import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { BASE_STYLES } from '../ui/tokens/design-tokens.js';
import '../ui/index.js';

@customElement('uwc-info-dialog')
export class UwcInfoDialog extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }
    h2   { font-size: var(--uwc-text-lg); font-weight: var(--uwc-weight-bold); margin: 0 0 var(--uwc-space-4); }
    h3   { font-size: var(--uwc-text-base); font-weight: var(--uwc-weight-semibold); margin: var(--uwc-space-5) 0 var(--uwc-space-2); }
    p, li { font-size: var(--uwc-text-sm); color: var(--uwc-text-secondary); line-height: 1.65; }
    ul   { padding-left: var(--uwc-space-5); display: flex; flex-direction: column; gap: var(--uwc-space-1); }
    code { font-family: var(--uwc-font-mono); background: var(--uwc-bg-subtle); padding: 1px 5px; border-radius: 3px; font-size: 12px; color: var(--uwc-color-primary-dark); }
    pre  { background: var(--uwc-bg-subtle); border: 1px solid var(--uwc-border); border-radius: var(--uwc-radius-md); padding: var(--uwc-space-4); overflow: auto; font-family: var(--uwc-font-mono); font-size: 12px; color: var(--uwc-text-primary); line-height: 1.6; margin-top: var(--uwc-space-2); }
    .section { padding: var(--uwc-space-5); background: var(--uwc-bg-subtle); border-radius: var(--uwc-radius-lg); border: 1px solid var(--uwc-border); margin-bottom: var(--uwc-space-4); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--uwc-space-3); margin-top: var(--uwc-space-3); }
    @media (max-width: 580px) { .grid { grid-template-columns: 1fr; } }
    .card { padding: var(--uwc-space-4); background: var(--uwc-surface); border: 1px solid var(--uwc-border); border-radius: var(--uwc-radius-lg); }
    .card-title { font-weight: var(--uwc-weight-semibold); font-size: var(--uwc-text-base); margin-bottom: var(--uwc-space-1); display: flex; align-items: center; gap: 8px; }
    .badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: var(--uwc-radius-full); }
    .badge-pdf { background: #dbeafe; color: #1e40af; }
    .badge-ai  { background: var(--uwc-color-ai-light); color: var(--uwc-color-ai); }
    .privacy-banner { display: flex; gap: 12px; padding: var(--uwc-space-4); background: #d1fae5; border-radius: var(--uwc-radius-lg); border: 1px solid #6ee7b7; margin-bottom: var(--uwc-space-5); }
    .privacy-banner p { color: #065f46; }
    .ai-note { display: flex; gap: 12px; padding: var(--uwc-space-4); background: var(--uwc-color-ai-light); border-radius: var(--uwc-radius-lg); border: 1px solid #c4b5fd; margin-bottom: var(--uwc-space-4); }
    .ai-note p { color: var(--uwc-color-ai); }
  `;

  render() {
    return html`
      <div class="privacy-banner">
        <span style="font-size:22px;flex-shrink:0">🔒</span>
        <p><strong>100% Private.</strong> Every feature — PDF processing and AI — runs entirely in your browser using WebAssembly and WebGPU. No files and no text are ever sent to any server. Your documents never leave your device.</p>
      </div>

      <h2>PDF Tools</h2>
      <div class="grid">
        <div class="card">
          <div class="card-title"><span class="badge badge-pdf">PDF</span>Merge PDFs</div>
          <p>Combine multiple PDFs into one document. Powered by <code>pdf-lib</code>.</p>
        </div>
        <div class="card">
          <div class="card-title"><span class="badge badge-pdf">PDF</span>Images → PDF</div>
          <p>Convert JPG, PNG, WebP images into a multi-page PDF document.</p>
        </div>
        <div class="card">
          <div class="card-title"><span class="badge badge-pdf">PDF</span>Compress PDF</div>
          <p>Re-renders pages as JPEG at chosen scale/quality. Best for image-heavy PDFs.</p>
        </div>
        <div class="card">
          <div class="card-title"><span class="badge badge-pdf">PDF</span>Sign & Annotate</div>
          <p>Full editor: pen, highlighter, text boxes, shapes, multi-source signatures.</p>
        </div>
        <div class="card">
          <div class="card-title"><span class="badge badge-pdf">PDF</span>Extract → DOCX</div>
          <p>Extract selectable text from a PDF and export as a <code>.docx</code> file.</p>
        </div>
      </div>

      <h2 style="margin-top:var(--uwc-space-6)">✨ AI Tools (Local — no API key needed)</h2>
      <div class="ai-note">
        <span style="font-size:22px;flex-shrink:0">🤖</span>
        <p>AI features use <strong>WebLLM</strong> to run a real LLM (Llama 3.2, Phi-3.5) directly in your browser via WebGPU. The model is downloaded once (~380 MB for the 1B model) and cached permanently. Requires Chrome 113+ or Edge 113+.</p>
      </div>
      <div class="grid">
        <div class="card">
          <div class="card-title"><span class="badge badge-ai">AI</span>AI Summarize</div>
          <p>Generates TL;DR, key points, executive briefs or ELI5 summaries of any PDF.</p>
        </div>
        <div class="card">
          <div class="card-title"><span class="badge badge-ai">AI</span>Chat w/ PDF</div>
          <p>Ask questions about your document. Full conversation history. Grounded answers only.</p>
        </div>
        <div class="card">
          <div class="card-title"><span class="badge badge-ai">WASM + AI</span>OCR + AI Clean</div>
          <p>Tesseract.js WebAssembly OCR for scanned documents. AI fixes OCR noise & formatting.</p>
        </div>
        <div class="card">
          <div class="card-title"><span class="badge badge-ai">AI</span>AI Translate</div>
          <p>Translate PDF content to 14 languages using the local LLM. Export as DOCX.</p>
        </div>
        <div class="card">
          <div class="card-title"><span class="badge badge-ai">AI</span>Table Extract</div>
          <p>AI finds and reconstructs all tables as clean, downloadable CSV.</p>
        </div>
      </div>

      <h2 style="margin-top:var(--uwc-space-6)">Using as Web Components</h2>
      <div class="section">
        <p>Every feature is a standalone web component — drop into any framework or plain HTML.</p>
        <h3>In plain HTML</h3>
        <pre>&lt;script type="module" src="pdf-studio/dist/main.js"&gt;&lt;/script&gt;

&lt;uwc-plugin-merge&gt;&lt;/uwc-plugin-merge&gt;
&lt;uwc-plugin-sign&gt;&lt;/uwc-plugin-sign&gt;
&lt;uwc-plugin-compress&gt;&lt;/uwc-plugin-compress&gt;
&lt;uwc-plugin-images&gt;&lt;/uwc-plugin-images&gt;
&lt;uwc-plugin-extract&gt;&lt;/uwc-plugin-extract&gt;
&lt;uwc-plugin-summarize&gt;&lt;/uwc-plugin-summarize&gt;
&lt;uwc-plugin-chat&gt;&lt;/uwc-plugin-chat&gt;
&lt;uwc-plugin-ocr&gt;&lt;/uwc-plugin-ocr&gt;
&lt;uwc-plugin-translate&gt;&lt;/uwc-plugin-translate&gt;
&lt;uwc-plugin-tables&gt;&lt;/uwc-plugin-tables&gt;</pre>

        <h3>Registering a custom plugin</h3>
        <pre>import { PluginRegistry } from 'pdf-studio/core';

PluginRegistry.instance.register({
  meta: {
    id: 'my-tool', name: 'My Tool',
    icon: 'sparkles', tag: 'my-tool-element',
    description: 'Does something amazing',
    category: 'pdf', order: 99,
  },
});</pre>
      </div>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'uwc-info-dialog': UwcInfoDialog; } }
