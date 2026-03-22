import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BASE_STYLES } from './tokens/design-tokens.js';

/**
 * `<uwc-file-drop>`
 * Drag-and-drop + click-to-browse file input.
 * Fires a `files-selected` CustomEvent with `FileList` in detail.
 *
 * @fires files-selected
 * @example
 * <uwc-file-drop accept=".pdf" multiple label="Drop PDFs here"></uwc-file-drop>
 */
@customElement('uwc-file-drop')
export class UwcFileDrop extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }

    .zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--uwc-space-3);
      padding: var(--uwc-space-8) var(--uwc-space-6);
      border: 2px dashed var(--uwc-border-strong);
      border-radius: var(--uwc-radius-lg);
      background: var(--uwc-bg-subtle);
      cursor: pointer;
      transition:
        background var(--uwc-duration-fast) var(--uwc-ease),
        border-color var(--uwc-duration-fast) var(--uwc-ease);
      text-align: center;
      min-height: 140px;
      position: relative;
    }
    .zone:hover, .zone.drag-over {
      border-color: var(--uwc-color-primary);
      background: var(--uwc-color-primary-light);
    }
    .zone.drag-over .icon-wrap {
      transform: scale(1.15);
    }
    .icon-wrap {
      transition: transform var(--uwc-duration-normal) var(--uwc-ease);
      color: var(--uwc-color-primary);
    }
    .label {
      font-size: var(--uwc-text-md);
      font-weight: var(--uwc-weight-medium);
      color: var(--uwc-text-primary);
    }
    .hint {
      font-size: var(--uwc-text-sm);
      color: var(--uwc-text-tertiary);
    }
    .browse-link {
      color: var(--uwc-color-primary);
      text-decoration: underline;
      cursor: pointer;
    }
    input[type="file"] {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }

    /* Selected files list */
    .files-list {
      margin-top: var(--uwc-space-3);
      display: flex;
      flex-direction: column;
      gap: var(--uwc-space-2);
    }
    .file-item {
      display: flex;
      align-items: center;
      gap: var(--uwc-space-2);
      padding: var(--uwc-space-2) var(--uwc-space-3);
      background: var(--uwc-surface);
      border: 1px solid var(--uwc-border);
      border-radius: var(--uwc-radius-md);
      font-size: var(--uwc-text-sm);
    }
    .file-name { flex: 1; color: var(--uwc-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .file-size { color: var(--uwc-text-tertiary); flex-shrink: 0; }
    .remove-btn {
      all: unset;
      cursor: pointer;
      color: var(--uwc-text-tertiary);
      display: flex;
      padding: 2px;
      border-radius: var(--uwc-radius-sm);
    }
    .remove-btn:hover { color: var(--uwc-color-danger); background: #fee2e2; }
  `;

  @property() accept    = '*';
  @property() label     = 'Drop files here or click to browse';
  @property() hint      = '';
  @property({ type: Boolean }) multiple = false;
  @state() private _files: File[] = [];
  @state() private _dragOver = false;

  get files(): File[] { return this._files; }

  private _onDragOver(e: DragEvent): void {
    e.preventDefault();
    this._dragOver = true;
  }
  private _onDragLeave(): void { this._dragOver = false; }

  private _onDrop(e: DragEvent): void {
    e.preventDefault();
    this._dragOver = false;
    const files = Array.from(e.dataTransfer?.files ?? []);
    this._setFiles(files);
  }

  private _onChange(e: Event): void {
    const inp = e.target as HTMLInputElement;
    this._setFiles(Array.from(inp.files ?? []));
    inp.value = ''; // allow re-selecting same file
  }

  private _setFiles(files: File[]): void {
    const accepted = files.filter(f => this._accepts(f));
    this._files = this.multiple ? [...this._files, ...accepted] : accepted.slice(0, 1);
    this.dispatchEvent(new CustomEvent('files-selected', {
      detail: this._files, bubbles: true, composed: true,
    }));
  }

  private _accepts(f: File): boolean {
    if (this.accept === '*') return true;
    const parts = this.accept.split(',').map(s => s.trim());
    return parts.some(p => {
      if (p.startsWith('.')) return f.name.toLowerCase().endsWith(p.toLowerCase());
      if (p.endsWith('/*'))  return f.type.startsWith(p.replace('/*', '/'));
      return f.type === p;
    });
  }

  private _removeFile(idx: number): void {
    this._files = this._files.filter((_, i) => i !== idx);
    this.dispatchEvent(new CustomEvent('files-selected', {
      detail: this._files, bubbles: true, composed: true,
    }));
  }

  private _fmtSize(b: number): string {
    if (b < 1024)       return `${b} B`;
    if (b < 1048576)    return `${(b/1024).toFixed(1)} KB`;
    return `${(b/1048576).toFixed(1)} MB`;
  }

  render() {
    return html`
      <div
        class="zone ${this._dragOver ? 'drag-over' : ''}"
        @dragover="${this._onDragOver}"
        @dragleave="${this._onDragLeave}"
        @drop="${this._onDrop}"
      >
        <div class="icon-wrap">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-8-4-4m0 0L8 8m4-4v12"/>
          </svg>
        </div>
        <span class="label">${this.label}</span>
        <span class="hint">
          ${this.hint || `${this.accept !== '*' ? this.accept.toUpperCase() + ' · ' : ''}${this.multiple ? 'Multiple files supported' : 'Single file'}`}
        </span>
        <input
          type="file"
          accept="${this.accept}"
          ?multiple="${this.multiple}"
          @change="${this._onChange}"
          aria-label="${this.label}"
        >
      </div>

      ${this._files.length > 0 ? html`
        <div class="files-list" role="list">
          ${this._files.map((f, i) => html`
            <div class="file-item" role="listitem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--uwc-color-primary)"
                stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 3v4a1 1 0 0 0 1 1h4M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/>
              </svg>
              <span class="file-name" title="${f.name}">${f.name}</span>
              <span class="file-size">${this._fmtSize(f.size)}</span>
              <button class="remove-btn" @click="${() => this._removeFile(i)}" title="Remove">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round">
                  <path d="M6 18 18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          `)}
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'uwc-file-drop': UwcFileDrop; }
}
