import { css, unsafeCSS } from 'lit';

export const DESIGN_TOKENS = `
  --uwc-color-primary:        #6366f1;
  --uwc-color-primary-hover:  #4f46e5;
  --uwc-color-primary-light:  #eef2ff;
  --uwc-color-primary-dark:   #3730a3;
  --uwc-color-accent:         #06b6d4;
  --uwc-color-success:        #10b981;
  --uwc-color-warning:        #f59e0b;
  --uwc-color-danger:         #ef4444;
  --uwc-color-ai:             #8b5cf6;
  --uwc-color-ai-hover:       #7c3aed;
  --uwc-color-ai-light:       #f5f3ff;
  --uwc-bg:                   #f8fafc;
  --uwc-bg-elevated:          #ffffff;
  --uwc-bg-subtle:            #f1f5f9;
  --uwc-surface:              #ffffff;
  --uwc-surface-hover:        #f8fafc;
  --uwc-surface-active:       #eef2ff;
  --uwc-border:               #e2e8f0;
  --uwc-border-strong:        #cbd5e1;
  --uwc-text-primary:         #0f172a;
  --uwc-text-secondary:       #475569;
  --uwc-text-tertiary:        #94a3b8;
  --uwc-text-disabled:        #cbd5e1;
  --uwc-text-inverse:         #ffffff;
  --uwc-font:                 'Inter', system-ui, -apple-system, sans-serif;
  --uwc-font-mono:            'JetBrains Mono', 'Fira Code', monospace;
  --uwc-text-xs:              11px;
  --uwc-text-sm:              13px;
  --uwc-text-base:            14px;
  --uwc-text-md:              15px;
  --uwc-text-lg:              18px;
  --uwc-text-xl:              22px;
  --uwc-text-2xl:             28px;
  --uwc-weight-normal:        400;
  --uwc-weight-medium:        500;
  --uwc-weight-semibold:      600;
  --uwc-weight-bold:          700;
  --uwc-leading-tight:        1.25;
  --uwc-leading-normal:       1.5;
  --uwc-leading-relaxed:      1.75;
  --uwc-space-1:  4px;
  --uwc-space-2:  8px;
  --uwc-space-3:  12px;
  --uwc-space-4:  16px;
  --uwc-space-5:  20px;
  --uwc-space-6:  24px;
  --uwc-space-8:  32px;
  --uwc-space-10: 40px;
  --uwc-space-12: 48px;
  --uwc-space-16: 64px;
  --uwc-radius-sm:  4px;
  --uwc-radius-md:  8px;
  --uwc-radius-lg:  12px;
  --uwc-radius-xl:  16px;
  --uwc-radius-2xl: 24px;
  --uwc-radius-full: 9999px;
  --uwc-shadow-sm:  0 1px 2px 0 rgba(0,0,0,.05);
  --uwc-shadow-md:  0 4px 6px -1px rgba(0,0,0,.07), 0 2px 4px -2px rgba(0,0,0,.05);
  --uwc-shadow-lg:  0 10px 15px -3px rgba(0,0,0,.08), 0 4px 6px -4px rgba(0,0,0,.05);
  --uwc-shadow-xl:  0 20px 25px -5px rgba(0,0,0,.08), 0 8px 10px -6px rgba(0,0,0,.05);
  --uwc-duration-fast:   100ms;
  --uwc-duration-normal: 200ms;
  --uwc-duration-slow:   350ms;
  --uwc-ease:            cubic-bezier(.4, 0, .2, 1);
  --uwc-z-dropdown:  100;
  --uwc-z-sticky:    200;
  --uwc-z-overlay:   300;
  --uwc-z-modal:     400;
  --uwc-z-toast:     500;
  --uwc-header-height:  60px;
  --uwc-sidebar-width:  240px;
  --uwc-sidebar-collapsed: 56px;
  --uwc-btn-height-sm:  28px;
  --uwc-btn-height-md:  36px;
  --uwc-btn-height-lg:  44px;

  /* Custom select chevron caret (Tailwind-forms style).
     Referenced by BASE_STYLES select rule below. */
  --uwc-select-arrow: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
`;

export const DARK_TOKENS = `
  --uwc-bg:               #0f172a;
  --uwc-bg-elevated:      #1e293b;
  --uwc-bg-subtle:        #0f172a;
  --uwc-surface:          #1e293b;
  --uwc-surface-hover:    #293548;
  --uwc-surface-active:   #312e81;
  --uwc-border:           #334155;
  --uwc-border-strong:    #475569;
  --uwc-text-primary:     #f1f5f9;
  --uwc-text-secondary:   #94a3b8;
  --uwc-text-tertiary:    #64748b;
  --uwc-text-disabled:    #475569;
  --uwc-text-inverse:     #0f172a;
  --uwc-color-primary-light: #312e81;
  --uwc-color-ai-light:   #2e1065;
  --uwc-shadow-sm:  0 1px 2px 0 rgba(0,0,0,.3);
  --uwc-shadow-md:  0 4px 6px -1px rgba(0,0,0,.4), 0 2px 4px -2px rgba(0,0,0,.3);
  --uwc-shadow-lg:  0 10px 15px -3px rgba(0,0,0,.5), 0 4px 6px -4px rgba(0,0,0,.3);
  --uwc-shadow-xl:  0 20px 25px -5px rgba(0,0,0,.5), 0 8px 10px -6px rgba(0,0,0,.3);

  /* Dark-mode caret — lighter stroke colour */
  --uwc-select-arrow: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
`;

export function injectTokens(): void {
  if (document.getElementById('uwc-design-tokens')) return;
  const style = document.createElement('style');
  style.id = 'uwc-design-tokens';
  style.textContent = `:root { ${DESIGN_TOKENS} } [data-theme="dark"] { ${DARK_TOKENS} }`;
  document.head.appendChild(style);
}

/** CSSResult for use inside Lit static styles blocks */
export const BASE_STYLES = css`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :host { font-family: var(--uwc-font); color: var(--uwc-text-primary); }

  /* ── Custom select caret ─────────────────────────────────────
     appearance:none removes the browser default arrow.
     background-image injects the SVG chevron from the token.
     Use background-color (NOT background shorthand) in components
     so this background-image is not overwritten. */
  select {
    appearance: none;
    -webkit-appearance: none;
    padding-right: 2rem;
    background-image: var(--uwc-select-arrow);
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.25rem 1.25rem;
    cursor: pointer;
  }
`;
