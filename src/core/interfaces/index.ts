// ═══════════════════════════════════════════════════════════════
//  IPlugin — every feature must implement this contract
// ═══════════════════════════════════════════════════════════════

import type { IconName } from '../../ui/icons.js';

export interface PluginMeta {
  readonly id:          string;       // unique slug, e.g. 'merge'
  readonly name:        string;       // display name
  readonly description: string;
  readonly icon:        IconName;
  readonly tag:         string;       // custom element tag, e.g. 'uwc-plugin-merge'
  readonly category:    'pdf' | 'ai'; // groups in sidebar
  readonly order:       number;       // sidebar sort order
  readonly badge?:      string;       // optional label like 'NEW', 'BETA'
}

export interface IPlugin {
  readonly meta: PluginMeta;
  /** Called once when the plugin is activated (tab shown). */
  onActivate?(): void | Promise<void>;
  /** Called when the plugin is deactivated (tab hidden). */
  onDeactivate?(): void | Promise<void>;
}

// ═══════════════════════════════════════════════════════════════
//  ILibraryLoader — lazy loading of external CDN libraries
// ═══════════════════════════════════════════════════════════════

export interface ILibraryLoader {
  /** Load a library by key. Returns the cached module on subsequent calls. */
  load<T = unknown>(key: string, loader: () => Promise<T>): Promise<T>;
  /** Preload multiple libraries in parallel. */
  preload(keys: string[]): void;
  /** Check if a library is already loaded. */
  isLoaded(key: string): boolean;
}

// ═══════════════════════════════════════════════════════════════
//  IPDFEngine — wraps pdf-lib + PDF.js operations
// ═══════════════════════════════════════════════════════════════

export interface MergeResult  { blob: Blob; pageCount: number; }
export interface CompressResult { blob: Blob; originalSize: number; compressedSize: number; ratio: number; }
export interface TextExtractResult { text: string; pageCount: number; }

export interface CompressOptions {
  scale:   number;  // 0.3–1.5 render scale
  quality: number;  // 0–1 JPEG quality
}

export interface IPDFEngine {
  merge(files: File[], onProgress?: (n: number, total: number) => void): Promise<MergeResult>;
  compress(file: File, opts: CompressOptions, onProgress?: (n: number, total: number) => void): Promise<CompressResult>;
  imagesToPDF(files: File[], onProgress?: (n: number, total: number) => void): Promise<Blob>;
  extractText(file: File, onProgress?: (n: number, total: number) => void): Promise<TextExtractResult>;
  extractTextFromBuffer(buf: Uint8Array): Promise<TextExtractResult>;
}

// ═══════════════════════════════════════════════════════════════
//  IAnnotationTool — each annotation tool implements this
// ═══════════════════════════════════════════════════════════════

export interface PointerPos { x: number; y: number; }

export interface IAnnotationTool {
  readonly id: string;
  onDown(pos: PointerPos, ctx: CanvasRenderingContext2D): void;
  onMove(pos: PointerPos, ctx: CanvasRenderingContext2D): void;
  onUp(pos: PointerPos, ctx: CanvasRenderingContext2D): Annotation | null;
  /** Cursor style while this tool is active */
  readonly cursor: string;
}

// ═══════════════════════════════════════════════════════════════
//  Annotation data types
// ═══════════════════════════════════════════════════════════════

export type AnnotationType =
  | 'freehand' | 'highlight' | 'highlight-brush'
  | 'text' | 'rect' | 'ellipse' | 'line' | 'arrow'
  | 'signature';

export interface BaseAnnotation {
  readonly id:   string;
  type:          AnnotationType;
  color:         string;
  lineWidth:     number;
  pageIndex:     number; // 0-based
}

export interface FreehandAnnotation extends BaseAnnotation { type: 'freehand' | 'highlight-brush'; points: [number, number][]; }
export interface HighlightAnnotation extends BaseAnnotation { type: 'highlight'; x1: number; y1: number; x2: number; y2: number; }
export interface TextAnnotation       extends BaseAnnotation { type: 'text'; x: number; y: number; text: string; fontSize: number; fontFamily: string; bold: boolean; italic: boolean; maxWidth: number; }
export interface ShapeAnnotation      extends BaseAnnotation { type: 'rect' | 'ellipse' | 'line' | 'arrow'; x1: number; y1: number; x2: number; y2: number; }
export interface SignatureAnnotation  extends BaseAnnotation { type: 'signature'; x: number; y: number; w: number; h: number; dataURL: string; _img?: HTMLImageElement; }

export type Annotation =
  | FreehandAnnotation | HighlightAnnotation | TextAnnotation
  | ShapeAnnotation    | SignatureAnnotation;

// ═══════════════════════════════════════════════════════════════
//  IThemeService
// ═══════════════════════════════════════════════════════════════

export type Theme = 'light' | 'dark' | 'system';

export interface IThemeService {
  current: Theme;
  resolved: 'light' | 'dark';
  setTheme(t: Theme): void;
  toggle(): void;
  subscribe(cb: (resolved: 'light' | 'dark') => void): () => void;
}
