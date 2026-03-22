import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BASE_STYLES } from './tokens/design-tokens.js';

// ═══════════════════════════════════════════════════════════════
//  uwc-progress
// ═══════════════════════════════════════════════════════════════
/**
 * `<uwc-progress>`
 * Animated progress bar with optional label and percentage.
 */
@customElement('uwc-progress')
export class UwcProgress extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }
    .header { display: flex; justify-content: space-between; margin-bottom: var(--uwc-space-1); }
    .label  { font-size: var(--uwc-text-sm); color: var(--uwc-text-secondary); font-weight: var(--uwc-weight-medium); }
    .pct    { font-size: var(--uwc-text-sm); color: var(--uwc-text-tertiary); font-weight: var(--uwc-weight-medium); }
    .track  {
      height: 6px; border-radius: var(--uwc-radius-full);
      background: var(--uwc-border); overflow: hidden;
    }
    .fill {
      height: 100%; border-radius: var(--uwc-radius-full);
      background: linear-gradient(90deg, var(--uwc-color-primary), var(--uwc-color-accent));
      transition: width var(--uwc-duration-normal) var(--uwc-ease);
      position: relative; overflow: hidden;
    }
    .fill::after {
      content: '';
      position: absolute; top: 0; left: -100%; bottom: 0; width: 60%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent);
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { to { left: 200%; } }
    :host([indeterminate]) .fill {
      width: 40% !important;
      animation: indeterminate 1.4s ease-in-out infinite;
    }
    @keyframes indeterminate {
      0%   { left: -40%; }
      100% { left: 120%; }
    }
    :host([indeterminate]) .fill { position: relative; }
    .status { margin-top: var(--uwc-space-1); font-size: var(--uwc-text-xs); color: var(--uwc-text-tertiary); }
  `;

  @property({ type: Number }) value = 0;
  @property({ type: Number }) max   = 100;
  @property() label  = '';
  @property() status = '';
  @property({ type: Boolean, reflect: true }) indeterminate = false;

  render() {
    const pct = Math.min(100, Math.round((this.value / this.max) * 100));
    return html`
      ${this.label || !this.indeterminate ? html`
        <div class="header">
          ${this.label ? html`<span class="label">${this.label}</span>` : ''}
          ${!this.indeterminate ? html`<span class="pct">${pct}%</span>` : ''}
        </div>
      ` : ''}
      <div class="track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <div class="fill" style="width:${pct}%"></div>
      </div>
      ${this.status ? html`<div class="status">${this.status}</div>` : ''}
    `;
  }
}

// ═══════════════════════════════════════════════════════════════
//  uwc-badge
// ═══════════════════════════════════════════════════════════════
export type BadgeVariant = 'primary' | 'ai' | 'success' | 'warning' | 'danger' | 'neutral';

@customElement('uwc-badge')
export class UwcBadge extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: inline-flex; }
    span {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: var(--uwc-radius-full);
      font-size: var(--uwc-text-xs); font-weight: var(--uwc-weight-semibold);
      letter-spacing: .3px;
    }
    .primary { background: var(--uwc-color-primary-light); color: var(--uwc-color-primary-dark); }
    .ai      { background: var(--uwc-color-ai-light); color: var(--uwc-color-ai); }
    .success { background: #d1fae5; color: #065f46; }
    .warning { background: #fef3c7; color: #92400e; }
    .danger  { background: #fee2e2; color: #991b1b; }
    .neutral { background: var(--uwc-bg-subtle); color: var(--uwc-text-secondary); }
  `;
  @property() variant: BadgeVariant = 'neutral';
  render() { return html`<span class="${this.variant}"><slot></slot></span>`; }
}

// ═══════════════════════════════════════════════════════════════
//  uwc-select
// ═══════════════════════════════════════════════════════════════
@customElement('uwc-select')
export class UwcSelect extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }
    label  { display: block; font-size: var(--uwc-text-sm); font-weight: var(--uwc-weight-medium); color: var(--uwc-text-secondary); margin-bottom: var(--uwc-space-1); }
    .wrap  { position: relative; }
    select {
      appearance: none; width: 100%;
      height: var(--uwc-btn-height-md);
      padding: 0 var(--uwc-space-8) 0 var(--uwc-space-3);
      font-family: var(--uwc-font); font-size: var(--uwc-text-base);
      color: var(--uwc-text-primary); background: var(--uwc-surface);
      border: 1.5px solid var(--uwc-border); border-radius: var(--uwc-radius-md);
      cursor: pointer; transition: border-color var(--uwc-duration-fast) var(--uwc-ease);
    }
    select:focus { outline: none; border-color: var(--uwc-color-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--uwc-color-primary) 15%, transparent); }
    .chevron {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      pointer-events: none; color: var(--uwc-text-tertiary);
    }
  `;
  @property() label = '';
  @property() value = '';
  render() {
    return html`
      ${this.label ? html`<label>${this.label}</label>` : ''}
      <div class="wrap">
        <select @change="${(e: Event) => { this.value = (e.target as HTMLSelectElement).value; this.dispatchEvent(new CustomEvent('change', { detail: this.value, bubbles: true, composed: true })); }}">
          <slot></slot>
        </select>
        <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 9-7 7-7-7"/></svg>
      </div>
    `;
  }
}

// ═══════════════════════════════════════════════════════════════
//  uwc-input
// ═══════════════════════════════════════════════════════════════
@customElement('uwc-input')
export class UwcInput extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }
    label { display: block; font-size: var(--uwc-text-sm); font-weight: var(--uwc-weight-medium); color: var(--uwc-text-secondary); margin-bottom: var(--uwc-space-1); }
    .wrap { position: relative; display: flex; align-items: center; }
    input {
      flex: 1; height: var(--uwc-btn-height-md);
      padding: 0 var(--uwc-space-3); padding-left: var(--uwc-space-3);
      font-family: var(--uwc-font); font-size: var(--uwc-text-base);
      color: var(--uwc-text-primary); background: var(--uwc-surface);
      border: 1.5px solid var(--uwc-border); border-radius: var(--uwc-radius-md);
      transition: border-color var(--uwc-duration-fast) var(--uwc-ease);
      width: 100%; box-sizing: border-box;
    }
    input::placeholder { color: var(--uwc-text-tertiary); }
    input:focus { outline: none; border-color: var(--uwc-color-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--uwc-color-primary) 15%, transparent); }
    .prefix { position: absolute; left: var(--uwc-space-3); color: var(--uwc-text-tertiary); pointer-events: none; }
    :host([has-prefix]) input { padding-left: var(--uwc-space-8); }
  `;
  @property() label       = '';
  @property() value       = '';
  @property() type        = 'text';
  @property() placeholder = '';
  render() {
    return html`
      ${this.label ? html`<label>${this.label}</label>` : ''}
      <div class="wrap">
        <slot name="prefix" class="prefix"></slot>
        <input type="${this.type}" .value="${this.value}" placeholder="${this.placeholder}"
          @input="${(e: Event) => { this.value = (e.target as HTMLInputElement).value; this.dispatchEvent(new CustomEvent('input', { detail: this.value, bubbles: true, composed: true })); }}"
        >
        <slot name="suffix"></slot>
      </div>
    `;
  }
}

// ═══════════════════════════════════════════════════════════════
//  uwc-toast — notification system
// ═══════════════════════════════════════════════════════════════
export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastItem { id: string; type: ToastType; message: string; }

@customElement('uwc-toast-host')
export class UwcToastHost extends LitElement {
  static styles = css`
    :host {
      position: fixed; bottom: var(--uwc-space-6); right: var(--uwc-space-6);
      z-index: var(--uwc-z-toast); display: flex; flex-direction: column;
      gap: var(--uwc-space-2); align-items: flex-end;
      pointer-events: none;
    }
    @media (max-width: 480px) { :host { bottom: 80px; left: var(--uwc-space-4); right: var(--uwc-space-4); align-items: stretch; } }
    .toast {
      display: flex; align-items: center; gap: var(--uwc-space-3);
      padding: var(--uwc-space-3) var(--uwc-space-4);
      background: var(--uwc-surface); border: 1px solid var(--uwc-border);
      border-radius: var(--uwc-radius-lg); box-shadow: var(--uwc-shadow-xl);
      font-family: var(--uwc-font); font-size: var(--uwc-text-sm); font-weight: var(--uwc-weight-medium);
      color: var(--uwc-text-primary);
      animation: slide-in .25s var(--uwc-ease); pointer-events: all;
      max-width: 360px;
    }
    @keyframes slide-in { from { opacity:0; transform: translateY(8px) scale(.97); } }
    .toast.leaving { animation: slide-out .2s var(--uwc-ease) forwards; }
    @keyframes slide-out { to { opacity:0; transform: translateY(4px) scale(.97); } }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .info    .dot { background: var(--uwc-color-primary); }
    .success .dot { background: var(--uwc-color-success); }
    .warning .dot { background: var(--uwc-color-warning); }
    .error   .dot { background: var(--uwc-color-danger); }
  `;

  @state() private _toasts: ToastItem[] = [];

  show(message: string, type: ToastType = 'info', duration = 4000): void {
    const id = Math.random().toString(36).slice(2);
    this._toasts = [...this._toasts, { id, type, message }];
    setTimeout(() => this._dismiss(id), duration);
  }

  private _dismiss(id: string): void {
    this._toasts = this._toasts.filter(t => t.id !== id);
  }

  render() {
    return html`
      ${this._toasts.map(t => html`
        <div class="toast ${t.type}" role="status">
          <span class="dot"></span>
          ${t.message}
        </div>
      `)}
    `;
  }
}

// Singleton accessor
let _host: UwcToastHost | null = null;
export function toast(msg: string, type: ToastType = 'info', ms = 4000): void {
  if (!_host) {
    _host = document.createElement('uwc-toast-host') as UwcToastHost;
    document.body.appendChild(_host);
  }
  _host.show(msg, type, ms);
}

declare global {
  interface HTMLElementTagNameMap {
    'uwc-progress':   UwcProgress;
    'uwc-badge':      UwcBadge;
    'uwc-select':     UwcSelect;
    'uwc-input':      UwcInput;
    'uwc-toast-host': UwcToastHost;
  }
}
