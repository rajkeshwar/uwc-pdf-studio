/**
 * PDF Studio — Entry point
 * Import order: core services → UI → PDF plugins → AI plugins → app shell
 */

// 1. Core services
import './core/ThemeService.js';

// 2. UI design system
import './ui/index.js';

// 3. PDF Plugins — each self-registers with PluginRegistry on import
import './plugins/merge/index.js';
import './plugins/images-to-pdf/index.js';
import './plugins/compress/index.js';
import './plugins/sign-annotate/index.js';
import './plugins/extract-text/index.js';

// 4. AI Plugins — require WebLLM / Tesseract (lazy-loaded on use)
import './plugins/ai/summarize/index.js';
import './plugins/ai/chat/index.js';
import './plugins/ai/ocr/index.js';
import './plugins/ai/translate/index.js';
import './plugins/ai/tables/index.js';

// 5. App shell — reads registry, builds navigation
import './app/uwc-app-shell.js';
import './app/uwc-info-dialog.js';

// 6. Public API for external / framework consumers
export { PluginRegistry } from './core/PluginRegistry.js';
export { PDFEngine, pdfEngine } from './core/PDFEngine.js';
export { themeService } from './core/ThemeService.js';
export { aiEngine } from './core/AIEngine.js';
export * from './core/interfaces/index.js';
export * from './ui/index.js';
