import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { ICONS, type IconName } from './icons.js';

/**
 * `<uwc-icon>`
 *
 * ROOT CAUSE OF INVISIBLE ICONS:
 * The previous `unsafeHTML` directive parses its argument using a <template>
 * element in HTML context. In HTML context, <path> / <circle> become
 * HTMLUnknownElement (HTML namespace) — NOT SVGPathElement (SVG namespace).
 * HTMLUnknownElements have no visual rendering, so icons were invisible.
 *
 * FIX: `unsafeSVG` (lit/directives/unsafe-svg.js) parses in SVG context,
 * producing real SVGPathElement instances the browser renders correctly.
 */
@customElement('uwc-icon')
export class UwcIcon extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: inherit;   /* ensures currentColor resolves from parent */
      line-height: 0;
    }
    svg {
      display: block;
      flex-shrink: 0;
      fill: none;
      stroke: currentColor;
    }
    /* Belt-and-suspenders: override on every SVG shape element */
    svg path, svg circle, svg ellipse,
    svg line, svg polyline, svg polygon, svg rect {
      fill: none;
      stroke: currentColor;
    }
    :host([spin]) svg {
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  @property({ reflect: true }) name: IconName = 'info';
  @property({ type: Number })  size = 20;
  @property() color = 'currentColor';

  render() {
    const d = ICONS[this.name] ?? ICONS['info'];
    return html`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="${this.size}"
        height="${this.size}"
        fill="none"
        stroke="${this.color}"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        ${unsafeSVG(d)}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'uwc-icon': UwcIcon; }
}
