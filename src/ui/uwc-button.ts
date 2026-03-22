import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BASE_STYLES } from './tokens/design-tokens.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai' | 'outline';
export type ButtonSize    = 'xs' | 'sm' | 'md' | 'lg';

/**
 * `<uwc-button>`
 * Versatile button component with multiple variants, sizes, loading & disabled states.
 *
 * @example
 * <uwc-button variant="primary">Save</uwc-button>
 * <uwc-button variant="ai" size="lg" loading>Generating…</uwc-button>
 * <uwc-button variant="ghost" icon-only title="Delete">
 *   <uwc-icon name="trash" slot="icon"></uwc-icon>
 * </uwc-button>
 */
@customElement('uwc-button')
export class UwcButton extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: inline-flex; }

    button {
      all: unset;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--uwc-space-2);
      font-family: var(--uwc-font);
      font-weight: var(--uwc-weight-medium);
      border-radius: var(--uwc-radius-md);
      border: 1.5px solid transparent;
      cursor: pointer;
      transition:
        background var(--uwc-duration-fast) var(--uwc-ease),
        color var(--uwc-duration-fast) var(--uwc-ease),
        box-shadow var(--uwc-duration-fast) var(--uwc-ease),
        opacity var(--uwc-duration-fast) var(--uwc-ease),
        border-color var(--uwc-duration-fast) var(--uwc-ease);
      white-space: nowrap;
      user-select: none;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }

    /* ── Sizes ── */
    button.xs { height: 24px; padding: 0 var(--uwc-space-2); font-size: var(--uwc-text-xs); border-radius: var(--uwc-radius-sm); }
    button.sm { height: var(--uwc-btn-height-sm); padding: 0 var(--uwc-space-3); font-size: var(--uwc-text-sm); }
    button.md { height: var(--uwc-btn-height-md); padding: 0 var(--uwc-space-4); font-size: var(--uwc-text-base); }
    button.lg { height: var(--uwc-btn-height-lg); padding: 0 var(--uwc-space-6); font-size: var(--uwc-text-md); }

    /* icon-only: square aspect */
    :host([icon-only]) button { padding: 0; aspect-ratio: 1; }

    /* ── Variants ── */
    button.primary {
      background: var(--uwc-color-primary);
      color: #fff;
      border-color: var(--uwc-color-primary);
    }
    button.primary:hover:not(:disabled) {
      background: var(--uwc-color-primary-hover);
      border-color: var(--uwc-color-primary-hover);
      box-shadow: 0 2px 8px color-mix(in srgb, var(--uwc-color-primary) 40%, transparent);
    }

    button.secondary {
      background: var(--uwc-surface);
      color: var(--uwc-text-primary);
      border-color: var(--uwc-border-strong);
    }
    button.secondary:hover:not(:disabled) {
      background: var(--uwc-surface-hover);
      border-color: var(--uwc-color-primary);
      color: var(--uwc-color-primary);
    }

    button.ghost {
      background: transparent;
      color: var(--uwc-text-secondary);
      border-color: transparent;
    }
    button.ghost:hover:not(:disabled) {
      background: var(--uwc-surface-hover);
      color: var(--uwc-text-primary);
    }

    button.outline {
      background: transparent;
      color: var(--uwc-color-primary);
      border-color: var(--uwc-color-primary);
    }
    button.outline:hover:not(:disabled) {
      background: var(--uwc-color-primary-light);
    }

    button.danger {
      background: var(--uwc-color-danger);
      color: #fff;
      border-color: var(--uwc-color-danger);
    }
    button.danger:hover:not(:disabled) {
      background: #dc2626;
      border-color: #dc2626;
    }

    button.ai {
      background: linear-gradient(135deg, var(--uwc-color-ai), var(--uwc-color-primary));
      color: #fff;
      border-color: transparent;
    }
    button.ai:hover:not(:disabled) {
      opacity: .9;
      box-shadow: 0 2px 10px color-mix(in srgb, var(--uwc-color-ai) 40%, transparent);
    }

    /* ── Active state ── */
    button.active {
      background: var(--uwc-color-primary) !important;
      color: #fff !important;
      border-color: var(--uwc-color-primary) !important;
    }

    /* ── Disabled ── */
    button:disabled {
      opacity: .45;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* ── Loading spinner ── */
    button.loading .btn-content { opacity: 0; }
    .spinner {
      display: none;
      position: absolute;
      inset: 0;
      align-items: center;
      justify-content: center;
    }
    button.loading .spinner { display: flex; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin-circle {
      width: 14px; height: 14px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin .7s linear infinite;
      opacity: .8;
    }
    button.lg .spin-circle { width: 18px; height: 18px; }

    /* ── Focus ring ── */
    button:focus-visible {
      outline: 2px solid var(--uwc-color-primary);
      outline-offset: 2px;
    }

    /* Ripple */
    .ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,.3);
      transform: scale(0);
      animation: ripple .5s linear;
      pointer-events: none;
    }
    @keyframes ripple { to { transform: scale(4); opacity: 0; } }
  `;

  @property({ reflect: true }) variant: ButtonVariant = 'secondary';
  @property({ reflect: true }) size: ButtonSize = 'md';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) loading  = false;
  @property({ type: Boolean, reflect: true }) active   = false;
  @property({ attribute: 'icon-only', type: Boolean, reflect: true }) iconOnly = false;
  @property() type: 'button' | 'submit' | 'reset' = 'button';

  private _handleClick(e: PointerEvent): void {
    if (this.disabled || this.loading) return;
    // Ripple effect
    const btn = this.shadowRoot!.querySelector('button')!;
    const rect = btn.getBoundingClientRect();
    const rpl  = document.createElement('span');
    rpl.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    rpl.style.cssText = `
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size/2}px;
      top:${e.clientY - rect.top - size/2}px;
    `;
    btn.appendChild(rpl);
    rpl.addEventListener('animationend', () => rpl.remove());
  }

  render() {
    const classes = [this.variant, this.size, this.active && 'active', this.loading && 'loading']
      .filter(Boolean).join(' ');

    return html`
      <button
        class="${classes}"
        ?disabled="${this.disabled || this.loading}"
        type="${this.type}"
        @click="${this._handleClick}"
        part="button"
      >
        <span class="btn-content">
          <slot name="icon"></slot>
          <slot></slot>
        </span>
        <span class="spinner" aria-hidden="true"><span class="spin-circle"></span></span>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'uwc-button': UwcButton; }
}
