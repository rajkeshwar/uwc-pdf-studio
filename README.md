# 📄 FolioForge

**Privacy-first PDF & document studio — 100% in-browser, zero uploads, zero servers.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Merge PDFs** | Combine multiple PDFs into one — drag to reorder |
| **Images → PDF** | Convert JPG / PNG / WebP images to a multi-page PDF |
| **Compress PDF** | Reduce file size by re-rendering at lower resolution |
| **Sign & Annotate** | Full editor: pen, highlighter, text, shapes, signatures |
| **Extract → DOCX** | Pull selectable text out into a Word document |

All processing uses **pdf-lib**, **PDF.js**, and **docx.js** via WebAssembly — nothing ever leaves the browser.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server (opens browser automatically)
npm run dev

# Production build → dist/
npm run build
```

---

## 🏗 Architecture

```
src/
├── core/
│   ├── interfaces/      # IPlugin, IPDFEngine, Annotation types …
│   ├── LibraryLoader.ts # Lazy CDN importer, singleton cache
│   ├── PDFEngine.ts     # merge / compress / extract / images
│   ├── PluginRegistry.ts# Add plugins at runtime
│   └── ThemeService.ts  # light / dark / system
├── ui/
│   ├── tokens/          # CSS custom property design tokens
│   ├── icons.ts         # SVG icon registry
│   ├── uwc-icon.ts      # <uwc-icon name="merge">
│   ├── uwc-button.ts    # <uwc-button variant="primary|ai|ghost|…">
│   ├── uwc-file-drop.ts # <uwc-file-drop accept=".pdf" multiple>
│   ├── uwc-dialog.ts    # <uwc-dialog title="…"> (native <dialog>)
│   └── uwc-widgets.ts   # progress, badge, select, input, toast
├── plugins/
│   ├── merge/           # uwc-plugin-merge
│   ├── compress/        # uwc-plugin-compress
│   ├── images-to-pdf/   # uwc-plugin-images
│   ├── sign-annotate/   # uwc-plugin-sign
│   └── extract-text/    # uwc-plugin-extract
├── app/
│   ├── uwc-app-shell.ts # sidebar nav + header + theme toggle
│   └── uwc-info-dialog.ts
└── main.ts              # entry — imports and registers everything
```

---

## 🔌 Plugin System

Plugins self-register on import. Each plugin must:
1. Implement `IPlugin` (provide `meta: PluginMeta`)
2. Register a matching custom element with the tag in `meta.tag`
3. Call `PluginRegistry.instance.register(plugin)`

```ts
import { PluginRegistry } from './core/PluginRegistry.js';

PluginRegistry.instance.register({
  meta: {
    id: 'my-tool',
    name: 'My Tool',
    icon: 'sparkles',
    tag: 'my-tool-element',
    description: 'Does something amazing',
    category: 'pdf',
    order: 99,
  },
});

// Register the custom element separately
@customElement('my-tool-element')
class MyToolElement extends LitElement { … }
```

---

## 🎨 Using UI Components

All components are shareable `uwc-*` web components usable in any framework:

```html
<uwc-button variant="primary">Save</uwc-button>
<uwc-button variant="ai" loading>Generating…</uwc-button>
<uwc-file-drop accept=".pdf" multiple></uwc-file-drop>
<uwc-progress value="60" label="Merging…"></uwc-progress>
<uwc-badge variant="ai">Local AI</uwc-badge>
<uwc-icon name="merge" size="24"></uwc-icon>
```

---

## 🌙 Dark Mode

Dark mode is handled by `ThemeService`. Toggle via:

```ts
import { themeService } from './core/ThemeService.js';
themeService.toggle();          // flip light ↔ dark
themeService.setTheme('dark');  // explicit
themeService.setTheme('system');// follow OS preference
```

Preference is persisted to `localStorage`.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Components | [Lit 3](https://lit.dev) (Web Components) |
| Language | TypeScript 5 |
| PDF write | [pdf-lib](https://pdf-lib.js.org) |
| PDF read/render | [PDF.js](https://mozilla.github.io/pdf.js) |
| DOCX export | [docx.js](https://docx.js.org) |
| Dev server | [@web/dev-server](https://modern-web.dev/docs/dev-server) + esbuild |
| Bundler | [Rollup 4](https://rollupjs.org) |

---

## 📄 License

MIT © FolioForge Contributors
