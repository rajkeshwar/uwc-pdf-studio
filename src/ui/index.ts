/**
 * FolioForge UI Package
 * Shareable Lit web components. Import what you need.
 *
 * @example
 * // In any web app:
 * import '@folioforge/ui';
 * // Then use in HTML:
 * <uwc-button variant="primary">Click me</uwc-button>
 */

// Design system
export { injectTokens, DESIGN_TOKENS, DARK_TOKENS, BASE_STYLES } from './tokens/design-tokens.js';
export { ICONS }                                                    from './icons.js';
export type { IconName }                                            from './icons.js';

// Components
export { UwcIcon }                from './uwc-icon.js';
export { UwcButton }              from './uwc-button.js';
export type { ButtonVariant, ButtonSize } from './uwc-button.js';
export { UwcFileDrop }            from './uwc-file-drop.js';
export { UwcDialog }              from './uwc-dialog.js';
export { UwcProgress, UwcBadge, UwcSelect, UwcInput, UwcToastHost, toast } from './uwc-widgets.js';
export type { BadgeVariant, ToastType } from './uwc-widgets.js';

// Side-effect imports to register all components
import './uwc-icon.js';
import './uwc-button.js';
import './uwc-file-drop.js';
import './uwc-dialog.js';
import './uwc-widgets.js';
