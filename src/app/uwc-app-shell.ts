import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { BASE_STYLES, injectTokens } from '../ui/tokens/design-tokens.js';
import { PluginRegistry } from '../core/PluginRegistry.js';
import { themeService } from '../core/ThemeService.js';
import type { PluginMeta } from '../core/interfaces/index.js';
import type { UwcDialog } from '../ui/uwc-dialog.js';
import '../ui/index.js';
import './uwc-info-dialog.js';

@customElement('uwc-app-shell')
export class UwcAppShell extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }

    /* ── Header ── */
    header {
      display: flex; align-items: center; gap: var(--uwc-space-4);
      height: var(--uwc-header-height); padding: 0 var(--uwc-space-5);
      background: var(--uwc-surface); border-bottom: 1px solid var(--uwc-border);
      flex-shrink: 0; z-index: var(--uwc-z-sticky);
    }
    .menu-btn {
      all: unset; cursor: pointer; display: flex; padding: 6px;
      border-radius: var(--uwc-radius-md); color: var(--uwc-text-secondary);
      transition: background var(--uwc-duration-fast);
    }
    .menu-btn:hover { background: var(--uwc-surface-hover); color: var(--uwc-text-primary); }

    .logo {
      display: flex; align-items: center; gap: var(--uwc-space-2);
      font-size: var(--uwc-text-lg); font-weight: var(--uwc-weight-bold);
      color: var(--uwc-text-primary); text-decoration: none; flex-shrink: 0;
    }
    .logo-icon {
      width: 30px; height: 30px; border-radius: var(--uwc-radius-md);
      display: flex; align-items: center; justify-content: center;
    }
    .logo-name { display: flex; flex-direction: column; line-height: 1.1; }
    .logo-title { font-size: var(--uwc-text-xl); font-weight: var(--uwc-weight-bold); }
    .logo-sub   { font-size: 10px; color: var(--uwc-text-tertiary); font-weight: var(--uwc-weight-normal); }

    .spacer { flex: 1; }

    .header-actions { display: flex; align-items: center; gap: var(--uwc-space-1); }

    .privacy-pill {
      display: flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: var(--uwc-radius-full);
      background: #d1fae5; color: #065f46;
      font-size: var(--uwc-text-xs); font-weight: var(--uwc-weight-semibold);
    }
    @media (max-width: 600px) { .privacy-pill { display: none; } }

    .icon-btn {
      all: unset; cursor: pointer; display: flex; align-items: center;
      justify-content: center; width: 34px; height: 34px;
      border-radius: var(--uwc-radius-md); color: var(--uwc-text-secondary);
      transition: background var(--uwc-duration-fast), color var(--uwc-duration-fast);
    }
    .icon-btn:hover { background: var(--uwc-surface-hover); color: var(--uwc-text-primary); }

    /* ── Body ── */
    .body { display: flex; flex: 1; overflow: hidden; }

    /* ── Sidebar ── */
    .sidebar {
      width: var(--uwc-sidebar-width); flex-shrink: 0;
      background: var(--uwc-surface); border-right: 1px solid var(--uwc-border);
      display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden;
      transition: width var(--uwc-duration-normal) var(--uwc-ease),
                  transform var(--uwc-duration-normal) var(--uwc-ease);
    }
    .sidebar.collapsed { width: var(--uwc-sidebar-collapsed); }
    @media (max-width: 768px) {
      .sidebar {
        position: fixed; left: 0; top: var(--uwc-header-height);
        bottom: 0; z-index: var(--uwc-z-overlay);
        transform: translateX(-100%);
        width: var(--uwc-sidebar-width) !important;
      }
      .sidebar.mobile-open { transform: translateX(0); box-shadow: var(--uwc-shadow-xl); }
    }

    .section-label {
      padding: var(--uwc-space-4) var(--uwc-space-4) var(--uwc-space-1);
      font-size: 10px; font-weight: 700; color: var(--uwc-text-tertiary);
      text-transform: uppercase; letter-spacing: .9px;
      white-space: nowrap; overflow: hidden;
    }
    .collapsed .section-label { opacity: 0; height: 0; padding: 0; }

    .nav-item {
      display: flex; align-items: center; gap: var(--uwc-space-3);
      padding: var(--uwc-space-2) var(--uwc-space-4);
      cursor: pointer;
      transition: background var(--uwc-duration-fast) var(--uwc-ease),
                  color var(--uwc-duration-fast) var(--uwc-ease);
      user-select: none; color: var(--uwc-text-secondary);
      font-size: var(--uwc-text-sm); font-weight: var(--uwc-weight-medium);
      white-space: nowrap; overflow: hidden;
      border-left: 3px solid transparent;
    }
    .nav-item:hover  { background: var(--uwc-surface-hover); color: var(--uwc-text-primary); }
    .nav-item.active {
      background: var(--uwc-color-primary-light); color: var(--uwc-color-primary);
      border-left-color: var(--uwc-color-primary);
    }
    .nav-item.ai-item { }
    .nav-item.ai-item.active {
      background: var(--uwc-color-ai-light); color: var(--uwc-color-ai);
      border-left-color: var(--uwc-color-ai);
    }
    .nav-icon  { flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 20px; }
    .nav-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }
    .nav-badge {
      font-size: 9px; font-weight: 700; padding: 1px 5px;
      border-radius: var(--uwc-radius-full);
      background: var(--uwc-color-ai-light); color: var(--uwc-color-ai);
    }
    .collapsed .nav-label, .collapsed .nav-badge { display: none; }

    .sidebar-footer {
      margin-top: auto; padding: var(--uwc-space-4);
      border-top: 1px solid var(--uwc-border); flex-shrink: 0;
    }
    .footer-text {
      font-size: 11px; color: var(--uwc-text-tertiary); text-align: center;
      line-height: 1.5;
    }
    .collapsed .footer-text { opacity: 0; }

    /* ── Mobile backdrop ── */
    .mob-backdrop {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,.4); z-index: calc(var(--uwc-z-overlay) - 1);
    }
    .mob-backdrop.visible { display: block; }

    /* ── Main ── */
    .main { flex: 1; overflow-y: auto; padding: var(--uwc-space-6); background: var(--uwc-bg); }
    @media (max-width: 768px) { .main { padding: var(--uwc-space-4); } }

    .main::-webkit-scrollbar { width: 6px; }
    .main::-webkit-scrollbar-track { background: transparent; }
    .main::-webkit-scrollbar-thumb { background: var(--uwc-border-strong); border-radius: 3px; }

    .plugin-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: var(--uwc-space-4); margin-bottom: var(--uwc-space-6); flex-wrap: wrap;
    }
    .plugin-title {
      font-size: var(--uwc-text-xl); font-weight: var(--uwc-weight-bold);
      color: var(--uwc-text-primary); display: flex; align-items: center; gap: var(--uwc-space-3);
      line-height: 1.2;
    }
    .plugin-title.ai-title { color: var(--uwc-color-ai); }
    .plugin-desc {
      font-size: var(--uwc-text-sm); color: var(--uwc-text-secondary);
      margin-top: var(--uwc-space-1); line-height: var(--uwc-leading-normal);
    }
  `;

  @state() private _activeId   = 'merge';
  @state() private _plugins:   PluginMeta[] = [];
  @state() private _theme:     'light' | 'dark' = 'light';
  @state() private _collapsed  = false;
  @state() private _mobileOpen = false;

  @query('#info-dialog') private _infoDialog!: UwcDialog;

  connectedCallback(): void {
    super.connectedCallback();
    injectTokens();
    this._plugins = PluginRegistry.instance.getMeta();
    PluginRegistry.instance.subscribe(() => { this._plugins = PluginRegistry.instance.getMeta(); });
    this._theme = themeService.resolved;
    themeService.subscribe(r => { this._theme = r; });
  }

  private get _active(): PluginMeta | undefined {
    return this._plugins.find(p => p.id === this._activeId);
  }

  private _navigate(id: string): void {
    if (this._activeId !== id) PluginRegistry.instance.getById(this._activeId)?.onDeactivate?.();
    this._activeId   = id;
    this._mobileOpen = false;
    PluginRegistry.instance.getById(id)?.onActivate?.();
  }

  private _toggleSidebar(): void {
    if (window.innerWidth <= 768) this._mobileOpen = !this._mobileOpen;
    else this._collapsed = !this._collapsed;
  }

  render() {
    const pdfPlugins = this._plugins.filter(p => p.category === 'pdf');
    const aiPlugins  = this._plugins.filter(p => p.category === 'ai');
    const isAI       = this._active?.category === 'ai';

    return html`
      <!-- ── Header ── -->
      <header>
        <button class="menu-btn" @click="${this._toggleSidebar}" title="Toggle sidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.75" stroke-linecap="round">
            <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
          </svg>
        </button>

        <a class="logo" href="/">
          <div class="logo-icon">
          <svg enable-background="new 0 0 334.371 380.563" version="1.1" viewBox="0 0 14 16" xml:space="preserve" xmlns="http://www.w3.org/2000/svg">

            <g transform="matrix(.04589 0 0 .04589 -.66877 -.73379)">
              <polygon points="51.791 356.65 51.791 23.99 204.5 23.99 282.65 102.07 282.65 356.65" fill="#fff" stroke-width="212.65"/>
              <path d="m201.19 31.99 73.46 73.393v243.26h-214.86v-316.66h141.4m6.623-16h-164.02v348.66h246.85v-265.9z" stroke-width="21.791"/>
            </g>
            <g transform="matrix(.04589 0 0 .04589 -.66877 -.73379)">
              <polygon points="282.65 356.65 51.791 356.65 51.791 23.99 204.5 23.99 206.31 25.8 206.31 100.33 280.9 100.33 282.65 102.07" fill="#fff" stroke-width="212.65"/>
              <path d="m198.31 31.99v76.337h76.337v240.32h-214.86v-316.66h138.52m9.5-16h-164.02v348.66h246.85v-265.9l-6.43-6.424h-69.907v-69.842z" stroke-width="21.791"/>
            </g>
            <g transform="matrix(.04589 0 0 .04589 -.66877 -.73379)" stroke-width="21.791">
              <polygon points="258.31 87.75 219.64 87.75 219.64 48.667 258.31 86.38"/>
              <path d="m227.64 67.646 12.41 12.104h-12.41v-12.104m-5.002-27.229h-10.998v55.333h54.666v-12.742z"/>
            </g>
            <g transform="matrix(.04589 0 0 .04589 -.66877 -.73379)" fill="#ed1c24" stroke-width="212.65">
              <polygon points="311.89 284.49 22.544 284.49 22.544 167.68 37.291 152.94 37.291 171.49 297.15 171.49 297.15 152.94 311.89 167.68"/>
              <path d="m303.65 168.63 1.747 1.747v107.62h-276.35v-107.62l1.747-1.747v9.362h272.85v-9.362m-12.999-31.385v27.747h-246.86v-27.747l-27.747 27.747v126h302.35v-126z"/>
            </g>
            <rect x="1.7219" y="7.9544" width="10.684" height="4.0307" fill="none"/>
            <g transform="matrix(.04589 0 0 .04589 1.7219 11.733)" fill="#fff" stroke-width="21.791"><path d="m9.216 0v-83.2h30.464q6.784 0 12.928 1.408 6.144 1.28 10.752 4.608 4.608 3.2 7.296 8.576 2.816 5.248 2.816 13.056 0 7.68-2.816 13.184-2.688 5.504-7.296 9.088-4.608 3.456-10.624 5.248-6.016 1.664-12.544 1.664h-8.96v26.368zm22.016-43.776h7.936q6.528 0 9.6-3.072 3.2-3.072 3.2-8.704t-3.456-7.936-9.856-2.304h-7.424z"/><path d="m87.04 0v-83.2h24.576q9.472 0 17.28 2.304 7.936 2.304 13.568 7.296t8.704 12.8q3.2 7.808 3.2 18.816t-3.072 18.944-8.704 13.056q-5.504 5.12-13.184 7.552-7.552 2.432-16.512 2.432zm22.016-17.664h1.28q4.48 0 8.448-1.024 3.968-1.152 6.784-3.84 2.944-2.688 4.608-7.424t1.664-12.032-1.664-11.904-4.608-7.168q-2.816-2.56-6.784-3.456-3.968-1.024-8.448-1.024h-1.28z"/><path d="m169.22 0v-83.2h54.272v18.432h-32.256v15.872h27.648v18.432h-27.648v30.464z"/></g>

          </svg>
          </div>
          <div class="logo-name">
            <span class="logo-title">PDF <span style="color: var(--uwc-color-primary);">Studio</span></span>
            <span class="logo-sub">Privacy-first · 100% local</span>
          </div>
        </a>

        <div class="spacer"></div>

        <div class="header-actions">
          <div class="privacy-pill">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/>
            </svg>
            100% Private
          </div>

          <!-- Theme toggle -->
          <button class="icon-btn" title="Toggle theme" @click="${() => themeService.toggle()}">
            ${this._theme === 'dark' ? html`
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
                <path d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/>
              </svg>` : html`
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
                <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/>
              </svg>`}
          </button>

          <!-- Info -->
          <button class="icon-btn" title="About & How to use" @click="${() => this._infoDialog.open()}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/>
            </svg>
          </button>
        </div>
      </header>

      <div class="body">
        <!-- Mobile backdrop -->
        <div class="mob-backdrop ${this._mobileOpen ? 'visible' : ''}"
             @click="${() => this._mobileOpen = false}"></div>

        <!-- ── Sidebar ── -->
        <nav class="sidebar ${this._collapsed ? 'collapsed' : ''} ${this._mobileOpen ? 'mobile-open' : ''}">

          <!-- PDF Tools -->
          <div class="section-label">PDF Tools</div>
          ${pdfPlugins.map(p => html`
            <div class="nav-item ${this._activeId === p.id ? 'active' : ''}"
                 @click="${() => this._navigate(p.id)}"
                 title="${this._collapsed ? p.name : ''}">
              <span class="nav-icon">
                <uwc-icon name="${p.icon}" size="17"></uwc-icon>
              </span>
              <span class="nav-label">${p.name}</span>
            </div>
          `)}

          <!-- AI Tools -->
          ${aiPlugins.length > 0 ? html`
            <div class="section-label" style="margin-top: var(--uwc-space-2)">✨ AI Tools</div>
            ${aiPlugins.map(p => html`
              <div class="nav-item ai-item ${this._activeId === p.id ? 'active' : ''}"
                   @click="${() => this._navigate(p.id)}"
                   title="${this._collapsed ? p.name : ''}">
                <span class="nav-icon">
                  <uwc-icon name="${p.icon}" size="17"></uwc-icon>
                </span>
                <span class="nav-label">${p.name}</span>
                ${p.badge ? html`<span class="nav-badge">${p.badge}</span>` : ''}
              </div>
            `)}
          ` : ''}

          <div class="sidebar-footer">
            <div class="footer-text">PDF Studio v1.0<br>Privacy-first · Open source</div>
          </div>
        </nav>

        <!-- ── Main ── -->
        <main class="main">
          ${this._active ? html`
            <div class="plugin-header">
              <div>
                <div class="plugin-title ${isAI ? 'ai-title' : ''}">
                  <uwc-icon
                    name="${this._active.icon}"
                    size="24"
                    color="${isAI ? 'var(--uwc-color-ai)' : 'var(--uwc-color-primary)'}">
                  </uwc-icon>
                  ${this._active.name}
                </div>
                <div class="plugin-desc">${this._active.description}</div>
              </div>
              <uwc-badge variant="${isAI ? 'ai' : 'neutral'}">
                ${isAI ? '✨ Local AI' : '🔒 100% Local'}
              </uwc-badge>
            </div>
            ${this._renderPlugin(this._active)}
          ` : html`
            <div style="color:var(--uwc-text-tertiary);font-size:14px">Select a tool from the sidebar.</div>
          `}
        </main>
      </div>

      <!-- Info dialog -->
      <uwc-dialog id="info-dialog" title="PDF Studio — Features & How to Use" size="lg">
        <uwc-info-dialog slot="body"></uwc-info-dialog>
        <uwc-button slot="footer" variant="primary" @click="${() => this._infoDialog.close()}">
          Got it
        </uwc-button>
      </uwc-dialog>
    `;
  }

  private _renderPlugin(meta: PluginMeta) {
    const el = document.createElement(meta.tag);
    return html`${el}`;
  }
}

declare global { interface HTMLElementTagNameMap { 'uwc-app-shell': UwcAppShell; } }
