import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { BASE_STYLES } from './tokens/design-tokens.js';

/**
 * `<uwc-dialog>`
 * Accessible modal dialog built on native `<dialog>` element.
 * Fires `dialog-close` when dismissed.
 *
 * @fires dialog-close
 * @example
 * <uwc-dialog title="About" id="about">
 *   <p slot="body">Content here</p>
 * </uwc-dialog>
 */
@customElement('uwc-dialog')
export class UwcDialog extends LitElement {
  static styles = css`
    ${BASE_STYLES}

    dialog {
      all: unset;
      display: none;
      position: fixed;
      inset: 0;
      z-index: var(--uwc-z-modal);
      align-items: center;
      justify-content: center;
      padding: var(--uwc-space-4);
      box-sizing: border-box;
    }
    dialog[open] { display: flex; }

    .backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.45);
      backdrop-filter: blur(2px);
      animation: fade-in var(--uwc-duration-normal) var(--uwc-ease);
    }
    @keyframes fade-in { from { opacity: 0; } }

    .panel {
      position: relative; z-index: 1;
      background: var(--uwc-surface);
      border-radius: var(--uwc-radius-xl);
      box-shadow: var(--uwc-shadow-xl);
      width: 100%;
      max-height: calc(100dvh - var(--uwc-space-8));
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: scale-in var(--uwc-duration-normal) var(--uwc-ease);
    }
    @keyframes scale-in {
      from { opacity: 0; transform: scale(.96) translateY(8px); }
    }

    .panel.sm  { max-width: 440px; }
    .panel.md  { max-width: 600px; }
    .panel.lg  { max-width: 820px; }
    .panel.xl  { max-width: 1100px; }
    .panel.full { max-width: calc(100vw - var(--uwc-space-8)); max-height: calc(100dvh - var(--uwc-space-8)); }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--uwc-space-5) var(--uwc-space-6);
      border-bottom: 1px solid var(--uwc-border);
      flex-shrink: 0;
      gap: var(--uwc-space-3);
    }
    .header-left  { display: flex; align-items: center; gap: var(--uwc-space-3); }
    .title-text   { font-size: var(--uwc-text-lg); font-weight: var(--uwc-weight-semibold); }
    .close-btn {
      all: unset; cursor: pointer;
      display: flex; padding: var(--uwc-space-1); border-radius: var(--uwc-radius-md);
      color: var(--uwc-text-tertiary); transition: background var(--uwc-duration-fast) var(--uwc-ease);
    }
    .close-btn:hover { background: var(--uwc-surface-hover); color: var(--uwc-text-primary); }

    /* Body */
    .body {
      flex: 1;
      overflow-y: auto;
      padding: var(--uwc-space-6);
    }
    .body::-webkit-scrollbar { width: 6px; }
    .body::-webkit-scrollbar-track { background: transparent; }
    .body::-webkit-scrollbar-thumb { background: var(--uwc-border-strong); border-radius: 3px; }

    /* Footer */
    .footer {
      padding: var(--uwc-space-4) var(--uwc-space-6);
      border-top: 1px solid var(--uwc-border);
      display: flex; justify-content: flex-end; gap: var(--uwc-space-3);
      flex-shrink: 0;
    }
    .footer:empty { display: none; }
  `;

  @property() title   = '';
  @property() size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  @property({ type: Boolean }) closeable = true;

  @query('dialog') private _dialog!: HTMLDialogElement;

  open(): void {
    this._dialog.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this._dialog.removeAttribute('open');
    document.body.style.overflow = '';
    this.dispatchEvent(new CustomEvent('dialog-close', { bubbles: true, composed: true }));
  }

  private _backdropClick(e: MouseEvent): void {
    if (this.closeable && e.target === e.currentTarget) this.close();
  }

  render() {
    return html`
      <dialog @click="${this._backdropClick}" aria-labelledby="dialog-title" aria-modal="true">
        <div class="backdrop"></div>
        <div class="panel ${this.size}" role="document">
          <div class="header">
            <div class="header-left">
              <slot name="header-icon"></slot>
              <span id="dialog-title" class="title-text">${this.title}</span>
            </div>
            ${this.closeable ? html`
              <button class="close-btn" @click="${this.close}" aria-label="Close dialog">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M6 18 18 6M6 6l12 12"/>
                </svg>
              </button>
            ` : ''}
          </div>

          <div class="body">
            <slot name="body"></slot>
            <slot></slot>
          </div>

          <div class="footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'uwc-dialog': UwcDialog; }
}
