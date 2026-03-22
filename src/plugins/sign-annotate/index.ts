import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { BASE_STYLES } from '../../ui/tokens/design-tokens.js';
import { loader, PDFEngine, PluginRegistry } from '../../core/index.js';
import type {
  IPlugin, PluginMeta, Annotation, TextAnnotation,
  SignatureAnnotation, ShapeAnnotation, FreehandAnnotation, HighlightAnnotation,
} from '../../core/index.js';
import '../../ui/index.js';

const RENDER_SCALE = 1.5;

const META: PluginMeta = {
  id: 'sign-annotate', name: 'Sign & Annotate', icon: 'sign', tag: 'uwc-plugin-sign',
  description: 'Add signatures, text, shapes and highlights directly on a PDF.',
  category: 'pdf', order: 5,
};
class SignPlugin implements IPlugin { readonly meta = META; }
PluginRegistry.instance.register(new SignPlugin());

type ToolId = 'select' | 'pen' | 'highlight' | 'highlight-brush' | 'text' | 'signature'
             | 'rect' | 'ellipse' | 'line' | 'arrow';

const HL_PRESETS = ['#FFFF00','#90EE90','#FFA500','#FFB6C1','#ADD8E6','#E6BBFF'];

function nanoid() { return Math.random().toString(36).slice(2, 9); }

@customElement('uwc-plugin-sign')
export class UwcPluginSign extends LitElement {
  static styles = css`
    ${BASE_STYLES}
    :host { display: block; }

    /* ── Upload ── */
    .upload-wrap { max-width: 600px; }
    .file-info   { font-size: var(--uwc-text-sm); color: var(--uwc-text-secondary); margin-top: 6px; }

    /* ── Editor ── */
    .editor { width: fit-content; max-width: 100%; margin-top: var(--uwc-space-4); display: flex; flex-direction: column; gap: var(--uwc-space-2); }

    /* ── Toolbar ── */
    .toolbar {
      display: flex; align-items: center; flex-wrap: wrap; gap: 2px;
      padding: var(--uwc-space-2) var(--uwc-space-3);
      background: var(--uwc-surface); border: 1px solid var(--uwc-border);
      border-radius: var(--uwc-radius-lg); box-shadow: var(--uwc-shadow-sm);
    }
    .tb-sep   { width: 1px; height: 24px; background: var(--uwc-border); margin: 0 4px; flex-shrink: 0; }
    .tb-group { display: flex; align-items: center; gap: 2px; }
    .tb-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border: 1.5px solid transparent;
      background: transparent; border-radius: var(--uwc-radius-md);
      cursor: pointer; color: var(--uwc-text-secondary);
      transition: background var(--uwc-duration-fast), color var(--uwc-duration-fast);
      font-size: 15px; flex-shrink: 0;
    }
    .tb-btn:hover  { background: var(--uwc-surface-hover); color: var(--uwc-text-primary); }
    .tb-btn.active { background: var(--uwc-color-primary); color: #fff; border-color: var(--uwc-color-primary); }
    .tb-btn.danger:hover { background: #fee2e2; color: var(--uwc-color-danger); }
    .tb-select {
      height: 28px; padding: 0 6px; font-size: 12px;
      border: 1.5px solid var(--uwc-border); border-radius: var(--uwc-radius-sm);
      background: var(--uwc-surface); color: var(--uwc-text-primary); cursor: pointer;
    }

    /* ── Hint bar ── */
    .hint-bar {
      padding: var(--uwc-space-2) var(--uwc-space-4);
      background: #fef3c7; border: 1px solid #f59e0b;
      border-radius: var(--uwc-radius-md); font-size: var(--uwc-text-sm);
      display: flex; align-items: center; gap: var(--uwc-space-3);
    }

    /* ── Page nav ── */
    .page-nav {
      display: flex; align-items: center; gap: var(--uwc-space-3);
      font-size: var(--uwc-text-sm); font-weight: var(--uwc-weight-medium);
    }

    /* ── Canvas ── */
    .canvas-viewport {
      border: 1px solid var(--uwc-border); border-radius: var(--uwc-radius-lg);
      overflow: auto; background: #64748b; max-height: 68vh;
    }
    .canvas-inner { position: relative; display: inline-block; }
    #pdf-cv  { display: block; }
    #over-cv { position: absolute; top: 0; left: 0; cursor: crosshair; touch-action: none; }

    /* ── Text portal ── */
    .text-portal { position: absolute; display: none; z-index: 30; }
    .text-ta {
      display: block; width: 200px; min-height: 36px;
      background: rgba(255,255,210,.93); border: 2px dashed #f59e0b;
      outline: none; padding: 4px 6px; line-height: 1.45; resize: both;
      overflow: auto; font-size: 16px; border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,.15); white-space: pre-wrap;
      word-break: break-word; box-sizing: border-box;
    }
    .text-hint {
      background: rgba(255,255,200,.9); border-top: 1px solid #f0d070;
      padding: 2px 6px; font-size: 10px; color: #666;
      display: flex; justify-content: space-between; align-items: center; gap: 4px;
    }
    .text-hint button {
      all: unset; cursor: pointer; padding: 1px 6px; font-size: 11px;
      border: 1px solid #ccc; background: #fff; border-radius: 3px;
    }

    /* ── Color swatch ── */
    .color-swatch {
      width: 22px; height: 22px; border-radius: 50%; cursor: pointer;
      border: 2px solid transparent; flex-shrink: 0;
      transition: transform var(--uwc-duration-fast);
    }
    .color-swatch:hover { transform: scale(1.2); border-color: var(--uwc-text-secondary); }
    .color-swatch.active { border-color: var(--uwc-text-primary); box-shadow: 0 0 0 2px #fff inset; }

    /* ── Signature modal ── */
    .sig-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.5);
      z-index: 400; display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .sig-modal {
      background: var(--uwc-surface); border-radius: var(--uwc-radius-xl);
      width: 520px; max-width: 95vw; box-shadow: var(--uwc-shadow-xl);
      padding: 24px; display: flex; flex-direction: column; gap: 16px;
    }
    .sig-modal-title { font-size: 16px; font-weight: 600; }
    .sig-tabs { display: flex; border-bottom: 2px solid var(--uwc-border); }
    .sig-tab  {
      padding: 6px 16px; font-size: 13px; cursor: pointer;
      border: none; background: none; color: var(--uwc-text-secondary);
      font-weight: var(--uwc-weight-medium);
      border-bottom: 2px solid transparent; margin-bottom: -2px;
      transition: color var(--uwc-duration-fast);
    }
    .sig-tab.active { color: var(--uwc-color-primary); border-bottom-color: var(--uwc-color-primary); font-weight: var(--uwc-weight-semibold); }
    .draw-cv {
      border: 1.5px dashed var(--uwc-border-strong); border-radius: var(--uwc-radius-md);
      display: block; cursor: crosshair; background: var(--uwc-bg-subtle);
      touch-action: none; width: 100%; height: 130px;
    }
    .draw-controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 8px; font-size: 13px; }
    .type-input {
      width: 100%; padding: 10px; font-size: 26px;
      border: 1.5px solid var(--uwc-border); border-radius: var(--uwc-radius-md);
      font-family: Georgia, serif; text-align: center;
      background: var(--uwc-surface); color: var(--uwc-text-primary);
    }
    .preview-cv {
      width: 100%; height: 70px; display: block; margin-top: 8px;
      border: 1px solid var(--uwc-border); border-radius: var(--uwc-radius-md);
      background: var(--uwc-surface);
    }
    .upload-zone {
      border: 2px dashed var(--uwc-border-strong); border-radius: var(--uwc-radius-lg);
      padding: 20px; text-align: center; cursor: pointer;
      font-size: 13px; color: var(--uwc-text-secondary);
      background: var(--uwc-bg-subtle); position: relative;
    }
    .upload-zone:hover { border-color: var(--uwc-color-primary); background: var(--uwc-color-primary-light); }
    .upload-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .upload-preview-cv {
      width: 100%; height: 90px; display: none; margin-top: 8px;
      border: 1px solid var(--uwc-border); border-radius: var(--uwc-radius-md);
      background: var(--uwc-surface);
    }
    .sig-footer { display: flex; gap: 10px; justify-content: flex-end; }

    .actions-row { margin-top: var(--uwc-space-4); display: flex; gap: var(--uwc-space-3); flex-wrap: wrap; }
  `;

  // ── Reactive state ──────────────────────────────────────────
  @state() private _pdfBytes:    Uint8Array | null = null;
  @state() private _pdfJsDoc:    unknown = null;
  @state() private _totalPages   = 0;
  @state() private _currentPage  = 1;
  @state() private _activeTool: ToolId = 'pen';
  @state() private _hlColor      = '#FFFF00';
  @state() private _color        = '#1a1a1a';
  @state() private _strokeSize   = 2;
  @state() private _fontSize     = 16;
  @state() private _fontFamily   = 'Arial, sans-serif';
  @state() private _bold         = false;
  @state() private _italic       = false;
  @state() private _annotations: Record<number, Annotation[]> = {};
  @state() private _pendingSig:  string | null = null;
  @state() private _selIdx:      number | null = null;
  @state() private _busy         = false;
  @state() private _status       = '';
  @state() private _sigModalOpen = false;
  @state() private _sigTab: 'draw' | 'type' | 'upload' = 'draw';
  @state() private _textPortalOpen = false;
  @state() private _showHlDrop   = false;
  @state() private _showShapesDrop = false;
  @state() private _curShapeIcon = '□';
  @state() private _curShapeTool: 'rect' | 'ellipse' | 'line' | 'arrow' = 'rect';
  @state() private _uploadSigUrl: string | null = null;

  // ── Non-reactive drawing state ──────────────────────────────
  private _isDrawing   = false;
  private _drawStart   = { x: 0, y: 0 };
  private _activePath: [number, number][] = [];
  private _dragMode:   string | null = null;
  private _dragStart   = { x: 0, y: 0 };
  private _dragOrig:   Annotation | null = null;
  private _textAnchor  = { cx: 0, cy: 0 };
  // FIX: flag so we don't attach canvas listeners more than once
  private _eventsReady = false;

  @query('#pdf-cv')              private _pdfCv!:       HTMLCanvasElement;
  @query('#over-cv')             private _overCv!:      HTMLCanvasElement;
  @query('.canvas-inner')        private _inner!:        HTMLDivElement;
  @query('.text-portal')         private _textPortalEl!: HTMLDivElement;
  @query('.text-ta')             private _textTa!:       HTMLTextAreaElement;
  @query('.draw-cv')             private _drawCv!:       HTMLCanvasElement;
  @query('.preview-cv')          private _prevCv!:       HTMLCanvasElement;
  @query('.upload-preview-cv')   private _upCv!:         HTMLCanvasElement;

  // ── Helpers ─────────────────────────────────────────────────
  private get _ovCtx() { return this._overCv?.getContext('2d') ?? null; }

  private _pageAnnots(pg = this._currentPage): Annotation[] {
    if (!this._annotations[pg]) this._annotations = { ...this._annotations, [pg]: [] };
    return this._annotations[pg]!;
  }
  private _pushAnnot(a: Annotation): void {
    const pg   = a.pageIndex ?? this._currentPage;
    const list = [...(this._annotations[pg] ?? []), a];
    this._annotations = { ...this._annotations, [pg]: list };
  }
  private _ovXY(e: PointerEvent): [number, number] {
    const r = this._overCv.getBoundingClientRect();
    return [
      (e.clientX - r.left) * (this._overCv.width  / r.width),
      (e.clientY - r.top)  * (this._overCv.height / r.height),
    ];
  }

  // ── Lifecycle ────────────────────────────────────────────────
  protected updated(changed: PropertyValues): void {
    // FIX: Attach canvas pointer events as soon as the canvas enters the DOM.
    // 'firstUpdated' is too early — the canvas only renders after _pdfJsDoc is set.
    if (!this._eventsReady && this._overCv) {
      this._setupOverCanvas();
    }
    if (
      changed.has('_annotations') || changed.has('_currentPage') ||
      changed.has('_selIdx')      || changed.has('_pendingSig')
    ) {
      this._redraw();
    }
  }

  // ── PDF Load ────────────────────────────────────────────────
  private async _loadFile(files: File[]): Promise<void> {
    const file = files[0];
    if (!file) return;
    this._status = 'Loading…';
    try {
      this._pdfBytes    = new Uint8Array(await file.arrayBuffer());
      const lib         = await loader.pdfjs();
      // Give PDF.js its own copy so it can't detach our buffer
      this._pdfJsDoc    = await (lib as any).getDocument({ data: this._pdfBytes.slice() }).promise;
      this._totalPages  = (this._pdfJsDoc as any).numPages;
      this._currentPage = 1;
      this._annotations = {};
      this._selIdx      = null;
      // Wait for Lit to render the canvas elements before accessing them
      await this.updateComplete;
      await this._renderPage(1);
      this._status = `${file.name} · ${this._totalPages} page(s)`;
    } catch (e) { this._status = `❌ ${(e as Error).message}`; }
  }

  private async _renderPage(num: number): Promise<void> {
    const doc  = this._pdfJsDoc as any;
    const page = await doc.getPage(num);
    const vp   = page.getViewport({ scale: RENDER_SCALE });
    this._pdfCv.width  = this._overCv.width  = vp.width;
    this._pdfCv.height = this._overCv.height = vp.height;
    this._inner.style.width  = vp.width  + 'px';
    this._inner.style.height = vp.height + 'px';
    await page.render({ canvasContext: this._pdfCv.getContext('2d')!, viewport: vp }).promise;
    this._selIdx = null;
    this._redraw();
  }

  // ── Canvas pointer event setup ───────────────────────────────
  private _setupOverCanvas(): void {
    if (!this._overCv || this._eventsReady) return;
    this._eventsReady = true;
    this._overCv.addEventListener('pointerdown', (e) => this._onDown(e as PointerEvent));
    this._overCv.addEventListener('pointermove', (e) => this._onMove(e as PointerEvent));
    this._overCv.addEventListener('pointerup',   (e) => this._onUp(e as PointerEvent));
  }

  // ── Annotation drawing ───────────────────────────────────────
  private _redraw(tempAnnot?: Annotation): void {
    const ctx = this._ovCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this._overCv.width, this._overCv.height);
    const list = [...this._pageAnnots()];
    if (tempAnnot) list.push(tempAnnot);
    list.forEach((a, i) => {
      this._drawAnnot(ctx, a);
      if (i === this._selIdx) this._drawHandles(ctx, a);
    });
  }

  private _drawAnnot(ctx: CanvasRenderingContext2D, a: Annotation): void {
    ctx.save();
    ctx.lineCap = ctx.lineJoin = 'round';

    if (a.type === 'highlight') {
      const ha = a as HighlightAnnotation;
      ctx.globalAlpha = 0.38; ctx.fillStyle = ha.color;
      ctx.fillRect(Math.min(ha.x1,ha.x2), Math.min(ha.y1,ha.y2), Math.abs(ha.x2-ha.x1), Math.abs(ha.y2-ha.y1));
      ctx.restore(); return;
    }
    if (a.type === 'highlight-brush') {
      const fa = a as FreehandAnnotation;
      if (!fa.points?.length) { ctx.restore(); return; }
      ctx.globalAlpha = 0.38; ctx.strokeStyle = fa.color; ctx.lineWidth = fa.lineWidth;
      ctx.beginPath(); ctx.moveTo(fa.points[0]![0], fa.points[0]![1]);
      fa.points.forEach(([x, y]: [number, number]) => ctx.lineTo(x, y));
      ctx.stroke(); ctx.restore(); return;
    }

    ctx.strokeStyle = a.color; ctx.fillStyle = a.color; ctx.lineWidth = a.lineWidth;

    switch (a.type) {
      case 'freehand': {
        const fa = a as FreehandAnnotation;
        if (!fa.points?.length) break;
        ctx.beginPath(); ctx.moveTo(fa.points[0]![0], fa.points[0]![1]);
        for (let i = 1; i < fa.points.length; i++) {
          const mx = (fa.points[i-1]![0] + fa.points[i]![0]) / 2;
          const my = (fa.points[i-1]![1] + fa.points[i]![1]) / 2;
          ctx.quadraticCurveTo(fa.points[i-1]![0], fa.points[i-1]![1], mx, my);
        }
        ctx.stroke(); break;
      }
      case 'text': {
        const ta = a as TextAnnotation;
        ctx.font = `${ta.italic?'italic ':''}${ta.bold?'bold ':''}${ta.fontSize}px ${ta.fontFamily}`;
        ctx.fillStyle = ta.color;
        let cy = ta.y;
        for (const rawLine of ta.text.split('\n')) {
          if (ta.maxWidth > 0) {
            const words = rawLine.split(' '); let line = '';
            for (const w of words) {
              const test = line ? line + ' ' + w : w;
              if (ctx.measureText(test).width > ta.maxWidth && line) {
                ctx.fillText(line, ta.x, cy); cy += ta.fontSize * 1.4; line = w;
              } else { line = test; }
            }
            if (line) { ctx.fillText(line, ta.x, cy); cy += ta.fontSize * 1.4; }
          } else { ctx.fillText(rawLine, ta.x, cy); cy += ta.fontSize * 1.4; }
        }
        break;
      }
      case 'rect': case 'ellipse': case 'line': case 'arrow': {
        const sa = a as ShapeAnnotation;
        const [x1,y1,x2,y2] = [Math.min(sa.x1,sa.x2),Math.min(sa.y1,sa.y2),Math.max(sa.x1,sa.x2),Math.max(sa.y1,sa.y2)];
        if (a.type === 'rect')    { ctx.strokeRect(x1,y1,x2-x1,y2-y1); break; }
        if (a.type === 'ellipse') {
          ctx.beginPath();
          ctx.ellipse((x1+x2)/2,(y1+y2)/2,Math.abs(x2-x1)/2,Math.abs(y2-y1)/2,0,0,Math.PI*2);
          ctx.stroke(); break;
        }
        ctx.beginPath(); ctx.moveTo(sa.x1,sa.y1); ctx.lineTo(sa.x2,sa.y2); ctx.stroke();
        if (a.type === 'arrow') {
          const ang = Math.atan2(sa.y2-sa.y1,sa.x2-sa.x1);
          const hs  = Math.max(a.lineWidth*5,14);
          ctx.beginPath(); ctx.moveTo(sa.x2,sa.y2);
          ctx.lineTo(sa.x2-hs*Math.cos(ang-.4),sa.y2-hs*Math.sin(ang-.4));
          ctx.lineTo(sa.x2-hs*Math.cos(ang+.4),sa.y2-hs*Math.sin(ang+.4));
          ctx.closePath(); ctx.fill();
        }
        break;
      }
      case 'signature': {
        const sig = a as SignatureAnnotation;
        if (!sig._img) {
          sig._img = new Image(); sig._img.onload = () => this._redraw(); sig._img.src = sig.dataURL;
        }
        if (sig._img.complete && sig._img.naturalWidth) ctx.drawImage(sig._img, sig.x, sig.y, sig.w, sig.h);
        break;
      }
    }
    ctx.restore();
  }

  // ── Bounding box for every annotation type ───────────────────
  private _getBBox(a: Annotation) {
    if (a.type === 'signature') {
      const s = a as SignatureAnnotation;
      return { x1: s.x, y1: s.y, x2: s.x + s.w, y2: s.y + s.h };
    }
    if (a.type === 'text') {
      const ta = a as TextAnnotation;
      const ctx = this._ovCtx!;
      ctx.save(); ctx.font = `${ta.fontSize}px ${ta.fontFamily}`;
      const w = ta.maxWidth > 0 ? ta.maxWidth : ctx.measureText(ta.text).width;
      ctx.restore();
      return { x1: ta.x, y1: ta.y - ta.fontSize, x2: ta.x + w, y2: ta.y + ta.fontSize };
    }
    if (['rect','ellipse','line','arrow','highlight'].includes(a.type)) {
      const s = a as ShapeAnnotation;
      return { x1: Math.min(s.x1,s.x2), y1: Math.min(s.y1,s.y2), x2: Math.max(s.x1,s.x2), y2: Math.max(s.y1,s.y2) };
    }
    if (a.type === 'freehand' || a.type === 'highlight-brush') {
      const fa = a as FreehandAnnotation;
      const xs = fa.points.map((p: [number,number]) => p[0]!), ys = fa.points.map((p: [number,number]) => p[1]!);
      const pad = fa.lineWidth / 2;
      return { x1: Math.min(...xs)-pad, y1: Math.min(...ys)-pad, x2: Math.max(...xs)+pad, y2: Math.max(...ys)+pad };
    }
    return null;
  }

  private _handles(b: {x1:number;y1:number;x2:number;y2:number}) {
    const mx = (b.x1+b.x2)/2, my = (b.y1+b.y2)/2;
    return [
      {id:'nw',x:b.x1,y:b.y1},{id:'n',x:mx,y:b.y1},{id:'ne',x:b.x2,y:b.y1},
      {id:'e',x:b.x2,y:my},
      {id:'se',x:b.x2,y:b.y2},{id:'s',x:mx,y:b.y2},{id:'sw',x:b.x1,y:b.y2},
      {id:'w',x:b.x1,y:my},
    ];
  }
  private _drawHandles(ctx: CanvasRenderingContext2D, a: Annotation): void {
    const b = this._getBBox(a); if (!b) return;
    ctx.save(); ctx.strokeStyle='#6366f1'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
    ctx.strokeRect(b.x1-5,b.y1-5,b.x2-b.x1+10,b.y2-b.y1+10); ctx.setLineDash([]);
    this._handles(b).forEach(h => {
      ctx.fillStyle='#fff'; ctx.strokeStyle='#6366f1'; ctx.lineWidth=1.5;
      ctx.fillRect(h.x-5,h.y-5,10,10); ctx.strokeRect(h.x-5,h.y-5,10,10);
    });
    ctx.restore();
  }
  private _hitTest(x: number, y: number, a: Annotation): string | null {
    const b = this._getBBox(a); if (!b) return null;
    for (const h of this._handles(b)) if (Math.abs(x-h.x)<9 && Math.abs(y-h.y)<9) return h.id;
    if (x>=b.x1-4 && x<=b.x2+4 && y>=b.y1-4 && y<=b.y2+4) return 'move';
    return null;
  }
  private _applyDrag(a: Annotation, handle: string, dx: number, dy: number): void {
    if (handle === 'move') {
      if (a.type === 'signature') {
        const s=a as SignatureAnnotation, o=this._dragOrig as SignatureAnnotation; s.x=o.x+dx; s.y=o.y+dy;
      } else if (a.type === 'text') {
        const t=a as TextAnnotation, o=this._dragOrig as TextAnnotation; t.x=o.x+dx; t.y=o.y+dy;
      } else if (['rect','ellipse','line','arrow','highlight'].includes(a.type)) {
        const s=a as ShapeAnnotation, o=this._dragOrig as ShapeAnnotation;
        s.x1=o.x1+dx; s.y1=o.y1+dy; s.x2=o.x2+dx; s.y2=o.y2+dy;
      } else if (a.type==='freehand'||a.type==='highlight-brush') {
        const fa=a as FreehandAnnotation, oa=this._dragOrig as FreehandAnnotation;
        fa.points=oa.points.map(([px,py])=>[px+dx,py+dy] as [number,number]);
      }
      return;
    }
    if (a.type === 'signature') {
      const s=a as SignatureAnnotation, o=this._dragOrig as SignatureAnnotation;
      let {x,y,w,h}={x:o.x,y:o.y,w:o.w,h:o.h};
      if (handle.includes('e')) w=Math.max(20,o.w+dx);
      if (handle.includes('s')) h=Math.max(20,o.h+dy);
      if (handle.includes('w')) { x=o.x+dx; w=Math.max(20,o.w-dx); }
      if (handle.includes('n')) { y=o.y+dy; h=Math.max(20,o.h-dy); }
      Object.assign(s,{x,y,w,h});
    } else if (['rect','ellipse','line','arrow','highlight'].includes(a.type)) {
      const s=a as ShapeAnnotation, o=this._dragOrig as ShapeAnnotation;
      if (handle.includes('e')) s.x2=o.x2+dx;
      if (handle.includes('w')) s.x1=o.x1+dx;
      if (handle.includes('s')) s.y2=o.y2+dy;
      if (handle.includes('n')) s.y1=o.y1+dy;
    }
  }

  // ── Pointer events ───────────────────────────────────────────
  private _onDown(e: PointerEvent): void {
    e.preventDefault();
    this._overCv.setPointerCapture(e.pointerId);
    const [x, y] = this._ovXY(e);

    // ── SELECT ──
    if (this._activeTool === 'select') {
      if (this._selIdx !== null) {
        const hit = this._hitTest(x, y, this._pageAnnots()[this._selIdx]!);
        if (hit) {
          this._dragMode  = hit;
          this._dragStart = { x, y };
          this._dragOrig  = JSON.parse(JSON.stringify(this._pageAnnots()[this._selIdx]));
          return;
        }
      }
      const list = this._pageAnnots();
      for (let i = list.length - 1; i >= 0; i--) {
        if (this._hitTest(x, y, list[i]!)) {
          this._selIdx    = i;
          this._dragMode  = 'move';
          this._dragStart = { x, y };
          this._dragOrig  = JSON.parse(JSON.stringify(list[i]!));
          this._redraw(); return;
        }
      }
      this._selIdx = null; this._redraw(); return;
    }

    // FIX: Signature placement — check _pendingSig first, tool name second
    // This is robust regardless of how _activeTool was set
    if (this._pendingSig) {
      this._placeSig(x, y); return;
    }

    // ── TEXT ──
    if (this._activeTool === 'text') {
      if (this._textPortalOpen) this._commitText();
      this._openTextPortal(x, y); return;
    }

    // ── DRAW ──
    this._isDrawing = true;
    this._drawStart = { x, y };
    if (this._activeTool === 'pen' || this._activeTool === 'highlight-brush') {
      this._activePath = [[x, y]];
    }
  }

  private _onMove(e: PointerEvent): void {
    e.preventDefault();
    const [x, y] = this._ovXY(e);

    if (this._dragMode !== null && this._selIdx !== null) {
      this._applyDrag(this._pageAnnots()[this._selIdx]!, this._dragMode, x - this._dragStart.x, y - this._dragStart.y);
      this._redraw(); return;
    }
    if (!this._isDrawing) return;

    if (this._activeTool === 'pen') {
      this._activePath.push([x, y]);
      this._redraw({ id:'t', type:'freehand', pageIndex:this._currentPage, points:[...this._activePath], color:this._color, lineWidth:this._strokeSize } as FreehandAnnotation);
    } else if (this._activeTool === 'highlight-brush') {
      this._activePath.push([x, y]);
      this._redraw({ id:'t', type:'highlight-brush', pageIndex:this._currentPage, points:[...this._activePath], color:this._hlColor, lineWidth:this._strokeSize*3+4 } as FreehandAnnotation);
    } else if (this._activeTool === 'highlight') {
      this._redraw({ id:'t', type:'highlight', pageIndex:this._currentPage, x1:this._drawStart.x, y1:this._drawStart.y, x2:x, y2:y, color:this._hlColor, lineWidth:1 } as HighlightAnnotation);
    } else {
      this._redraw({ id:'t', type:this._activeTool as any, pageIndex:this._currentPage, x1:this._drawStart.x, y1:this._drawStart.y, x2:x, y2:y, color:this._color, lineWidth:this._strokeSize } as ShapeAnnotation);
    }
  }

  private _onUp(e: PointerEvent): void {
    e.preventDefault();
    const [x, y] = this._ovXY(e);

    if (this._dragMode !== null) { this._dragMode = null; this._dragOrig = null; this._redraw(); return; }
    if (!this._isDrawing) return;
    this._isDrawing = false;

    const dx = Math.abs(x - this._drawStart.x);
    const dy = Math.abs(y - this._drawStart.y);

    if      (this._activeTool === 'pen' && this._activePath.length > 1)
      this._pushAnnot({ id:nanoid(), type:'freehand', pageIndex:this._currentPage, points:[...this._activePath], color:this._color, lineWidth:this._strokeSize });
    else if (this._activeTool === 'highlight-brush' && this._activePath.length > 1)
      this._pushAnnot({ id:nanoid(), type:'highlight-brush', pageIndex:this._currentPage, points:[...this._activePath], color:this._hlColor, lineWidth:this._strokeSize*3+4 });
    else if (this._activeTool === 'highlight' && (dx > 4 || dy > 4))
      this._pushAnnot({ id:nanoid(), type:'highlight', pageIndex:this._currentPage, x1:this._drawStart.x, y1:this._drawStart.y, x2:x, y2:y, color:this._hlColor, lineWidth:1 });
    else if (['rect','ellipse','line','arrow'].includes(this._activeTool) && (dx > 3 || dy > 3))
      this._pushAnnot({ id:nanoid(), type:this._activeTool as any, pageIndex:this._currentPage, x1:this._drawStart.x, y1:this._drawStart.y, x2:x, y2:y, color:this._color, lineWidth:this._strokeSize });

    this._activePath = [];
    this._redraw();
  }

  // ── Text portal ──────────────────────────────────────────────
  private _openTextPortal(cx: number, cy: number): void {
    const r    = this._overCv.getBoundingClientRect();
    const cssX = cx / (this._overCv.width  / r.width);
    const cssY = cy / (this._overCv.height / r.height);
    this._textPortalEl.style.cssText = `display:block;left:${cssX}px;top:${cssY}px;position:absolute;z-index:30;`;
    this._textTa.style.fontSize   = this._fontSize + 'px';
    this._textTa.style.fontFamily = this._fontFamily;
    this._textTa.style.fontWeight = this._bold   ? 'bold'   : 'normal';
    this._textTa.style.fontStyle  = this._italic ? 'italic' : 'normal';
    this._textTa.style.color      = this._color;
    this._textTa.value = '';
    this._textAnchor   = { cx, cy };
    this._textPortalOpen = true;
    setTimeout(() => this._textTa.focus(), 10);
  }

  private _commitText(): void {
    if (!this._textPortalOpen) return;
    this._textPortalOpen = false;
    const txt = this._textTa.value;
    if (txt.trim()) {
      const taR = this._textTa.getBoundingClientRect();
      const ovR = this._overCv.getBoundingClientRect();
      const mw  = taR.width * (this._overCv.width / ovR.width);
      this._pushAnnot({
        id: nanoid(), type: 'text', pageIndex: this._currentPage,
        x: this._textAnchor.cx, y: this._textAnchor.cy + this._fontSize,
        text: txt, fontSize: this._fontSize, fontFamily: this._fontFamily,
        bold: this._bold, italic: this._italic, color: this._color, maxWidth: mw, lineWidth: 1,
      });
    }
    this._textPortalEl.style.display = 'none';
    this._textTa.value = '';
  }

  // ── Signature ────────────────────────────────────────────────
  // FIX: _placeSig is called when _pendingSig is truthy, regardless of _activeTool
  private _placeSig(x: number, y: number): void {
    this._pushAnnot({
      id: nanoid(), type: 'signature', pageIndex: this._currentPage,
      x, y, w: 200, h: 80, dataURL: this._pendingSig!, color: 'transparent', lineWidth: 0,
    });
    const newIdx      = this._pageAnnots().length - 1;
    this._pendingSig  = null;   // clears hint bar
    this._activeTool  = 'select';
    this._selIdx      = newIdx;
    if (this._overCv) this._overCv.style.cursor = 'default';
  }

  private _useSig(): void {
    const tab = this._sigTab;
    let dataURL: string | null = null;
    if (tab === 'draw') {
      if (!this._drawCv) return;
      const hasContent = this._drawCv.getContext('2d')!
        .getImageData(0, 0, this._drawCv.width, this._drawCv.height)
        .data.some(v => v !== 0);
      if (!hasContent) { alert('Please draw your signature first.'); return; }
      dataURL = this._drawCv.toDataURL('image/png');
    } else if (tab === 'type') {
      if (!this._prevCv) return;
      dataURL = this._prevCv.toDataURL('image/png');
    } else if (tab === 'upload') {
      if (!this._uploadSigUrl) { alert('Please upload an image.'); return; }
      dataURL = this._uploadSigUrl;
    }
    if (!dataURL) return;

    // FIX: set _pendingSig THEN close modal. _onDown checks _pendingSig directly.
    this._pendingSig   = dataURL;
    this._sigModalOpen = false;
    this._activeTool   = 'signature';
    if (this._overCv) this._overCv.style.cursor = 'copy';
  }

  private _updateTypePreview(): void {
    if (!this._prevCv) return;
    const ctx = this._prevCv.getContext('2d')!;
    ctx.clearRect(0, 0, this._prevCv.width, this._prevCv.height);
    const inp  = this.shadowRoot?.querySelector('.type-input') as HTMLInputElement;
    const sel  = this.shadowRoot?.querySelector('.sig-font-sel') as HTMLSelectElement;
    ctx.font         = sel?.value || 'italic 32px Georgia,serif';
    ctx.fillStyle    = '#1a3080';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(inp?.value || 'Your Signature', this._prevCv.width/2, this._prevCv.height/2);
  }

  private _initDrawCanvas(): void {
    const cv = this._drawCv; if (!cv) return;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, cv.width, cv.height);
    Object.assign(ctx, { strokeStyle:'#1a1a1a', lineWidth:2, lineCap:'round', lineJoin:'round' });
    let drawing = false;
    const xy = (e: PointerEvent): [number,number] => {
      const r = cv.getBoundingClientRect();
      return [(e.clientX-r.left)*(cv.width/r.width), (e.clientY-r.top)*(cv.height/r.height)];
    };
    cv.onpointerdown = (e) => { drawing=true; cv.setPointerCapture(e.pointerId); const [x,y]=xy(e); ctx.beginPath(); ctx.moveTo(x,y); };
    cv.onpointermove = (e) => { if (!drawing) return; const [x,y]=xy(e); ctx.lineTo(x,y); ctx.stroke(); };
    cv.onpointerup   = () => drawing = false;
  }

  // ── Tool management ──────────────────────────────────────────
  private _setTool(t: ToolId): void {
    if (this._textPortalOpen) this._commitText();
    this._activeTool = t;
    if (t !== 'select') this._selIdx = null;
    const cursors: Record<ToolId, string> = {
      select:'default', pen:'crosshair', highlight:'crosshair', 'highlight-brush':'crosshair',
      text:'text', signature:'copy', rect:'crosshair', ellipse:'crosshair', line:'crosshair', arrow:'crosshair',
    };
    if (this._overCv) this._overCv.style.cursor = cursors[t];
  }
  private _undo(): void {
    const list = this._annotations[this._currentPage];
    if (list?.length) { list.pop(); this._annotations = { ...this._annotations }; this._selIdx = null; }
  }
  private _clearPage(): void {
    this._annotations = { ...this._annotations, [this._currentPage]: [] };
    this._selIdx = null;
  }

  // ── Export PDF ───────────────────────────────────────────────
  private async _export(): Promise<void> {
    if (!this._pdfBytes) return;
    this._busy = true; this._status = 'Exporting…';
    try {
      const { PDFDocument } = await loader.pdfLib();
      const doc   = await PDFDocument.load(this._pdfBytes.slice());
      const pages = doc.getPages();

      for (const [pgStr, annots] of Object.entries(this._annotations)) {
        if (!annots.length) continue;
        const pgIdx = parseInt(pgStr) - 1;
        const page  = pages[pgIdx]; if (!page) continue;
        const { width: pw, height: ph } = page.getSize();

        const fc = document.createElement('canvas');
        fc.width  = Math.round(pw * RENDER_SCALE);
        fc.height = Math.round(ph * RENDER_SCALE);
        const fx  = fc.getContext('2d')!;

        for (const a of annots) { if (a.type !== 'signature') this._drawAnnot(fx, a); }
        await Promise.all(annots.filter(a => a.type === 'signature').map(a =>
          new Promise<void>(res => {
            const sig = a as SignatureAnnotation;
            const img = new Image();
            img.onload  = () => { fx.drawImage(img, sig.x, sig.y, sig.w, sig.h); res(); };
            img.onerror = () => res();
            img.src = sig.dataURL;
          })
        ));

        const pngBytes = await new Promise<Uint8Array>(res =>
          fc.toBlob(b => b!.arrayBuffer().then(buf => res(new Uint8Array(buf))), 'image/png'));
        const emb = await doc.embedPng(pngBytes);
        page.drawImage(emb, { x:0, y:0, width:pw, height:ph });
      }

      const out = await doc.save();
      PDFEngine.download(new Blob([out], { type:'application/pdf' }), 'annotated.pdf');
      this._status = '✅ annotated.pdf downloaded';
    } catch (e) {
      this._status = `❌ ${(e as Error).message}`; console.error(e);
    } finally { this._busy = false; }
  }

  // ── Render ───────────────────────────────────────────────────
  render() {
    const T  = (t: ToolId) => this._activeTool === t;
    const shapeIcons: Record<string,string> = { rect:'□', ellipse:'○', line:'╱', arrow:'→' };

    return html`
      <div class="upload-wrap">
        <uwc-file-drop accept=".pdf" label="Drop PDF or click to upload"
          @files-selected="${(e: CustomEvent) => this._loadFile(e.detail as File[])}">
        </uwc-file-drop>
      </div>
      ${this._status ? html`<div class="file-info">${this._status}</div>` : ''}

      ${this._pdfJsDoc ? html`
      <div class="editor">

        <!-- ── Toolbar ── -->
        <div class="toolbar" @click="${(e: Event) => {
          if (!(e.target as HTMLElement).closest('.tb-drop')) {
            this._showHlDrop = false; this._showShapesDrop = false;
          }
        }}">
          <div class="tb-group">

            <!-- Select -->
            <button class="tb-btn ${T('select')?'active':''}" title="Select & Move" @click="${()=>this._setTool('select')}">
              <uwc-icon name="select" size="16"></uwc-icon>
            </button>

            <!-- Pen -->
            <button class="tb-btn ${T('pen')?'active':''}" title="Freehand pen" @click="${()=>this._setTool('pen')}">
              <uwc-icon name="pen" size="16"></uwc-icon>
            </button>

            <!-- Highlight split-button -->
            <div class="tb-drop" style="position:relative;display:flex">
              <button class="tb-btn ${(T('highlight')||T('highlight-brush'))?'active':''}" title="Highlight"
                @click="${()=>this._setTool(T('highlight-brush')?'highlight-brush':'highlight')}">
                <span style="display:inline-block;width:14px;height:9px;border-radius:2px;background:${this._hlColor};border:1px solid rgba(0,0,0,.2)"></span>
              </button>
              <button class="tb-btn" style="width:16px;min-width:16px;font-size:10px;padding:0"
                @click="${(e:Event)=>{e.stopPropagation();this._showHlDrop=!this._showHlDrop;this._showShapesDrop=false;}}">▾</button>
              ${this._showHlDrop ? html`
              <div style="position:absolute;top:calc(100% + 4px);left:0;z-index:200;background:var(--uwc-surface);border:1px solid var(--uwc-border);border-radius:var(--uwc-radius-lg);padding:10px;box-shadow:var(--uwc-shadow-lg);min-width:140px">
                <div style="font-size:10px;font-weight:700;color:var(--uwc-text-tertiary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Style</div>
                <button style="all:unset;display:block;width:100%;padding:5px 8px;font-size:12px;cursor:pointer;border-radius:4px;${T('highlight')?'background:var(--uwc-color-primary-light);color:var(--uwc-color-primary)':''}"
                  @click="${()=>{this._setTool('highlight');this._showHlDrop=false;}}">▭ Rectangle</button>
                <button style="all:unset;display:block;width:100%;padding:5px 8px;font-size:12px;cursor:pointer;border-radius:4px;${T('highlight-brush')?'background:var(--uwc-color-primary-light);color:var(--uwc-color-primary)':''}"
                  @click="${()=>{this._setTool('highlight-brush');this._showHlDrop=false;}}">🖌 Brush</button>
                <div style="font-size:10px;font-weight:700;color:var(--uwc-text-tertiary);text-transform:uppercase;letter-spacing:.5px;margin:8px 0 6px">Color</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  ${HL_PRESETS.map(c => html`
                    <span class="color-swatch ${this._hlColor===c?'active':''}" style="background:${c}"
                      @click="${()=>{this._hlColor=c;}}"></span>`)}
                </div>
              </div>` : ''}
            </div>

            <!-- Text -->
            <button class="tb-btn ${T('text')?'active':''}" title="Add text" @click="${()=>this._setTool('text')}">
              <uwc-icon name="text-add" size="16"></uwc-icon>
            </button>

            <!-- Signature -->
            <button class="tb-btn ${T('signature')?'active':''}" title="Add signature"
              @click="${()=>{this._sigModalOpen=true;this._sigTab='draw';requestAnimationFrame(()=>this._initDrawCanvas());}}">
              <uwc-icon name="signature" size="16"></uwc-icon>
            </button>

            <!-- Shapes split-button -->
            <div class="tb-drop" style="position:relative;display:flex">
              <button class="tb-btn ${['rect','ellipse','line','arrow'].includes(this._activeTool)?'active':''}" title="Shape"
                @click="${()=>this._setTool(this._curShapeTool)}" style="font-size:16px">${this._curShapeIcon}</button>
              <button class="tb-btn" style="width:16px;min-width:16px;font-size:10px;padding:0"
                @click="${(e:Event)=>{e.stopPropagation();this._showShapesDrop=!this._showShapesDrop;this._showHlDrop=false;}}">▾</button>
              ${this._showShapesDrop ? html`
              <div style="position:absolute;top:calc(100% + 4px);left:0;z-index:200;background:var(--uwc-surface);border:1px solid var(--uwc-border);border-radius:var(--uwc-radius-lg);padding:6px;box-shadow:var(--uwc-shadow-lg);display:flex;gap:4px">
                ${Object.entries(shapeIcons).map(([t,icon]) => html`
                  <button class="tb-btn" style="font-size:18px" title="${t}"
                    @click="${()=>{this._curShapeTool=t as any;this._curShapeIcon=icon;this._setTool(t as ToolId);this._showShapesDrop=false;}}">${icon}</button>`)}
              </div>` : ''}
            </div>
          </div>

          <div class="tb-sep"></div>

          <!-- Color + stroke -->
          <div class="tb-group">
            <input type="color" .value="${this._color}" title="Color"
              style="width:28px;height:28px;border:1px solid var(--uwc-border);border-radius:4px;cursor:pointer;padding:1px"
              @input="${(e:Event)=>this._color=(e.target as HTMLInputElement).value}">
            <input type="range" min="1" max="20" .value="${String(this._strokeSize)}" title="Stroke size"
              style="width:64px;accent-color:var(--uwc-color-primary)"
              @input="${(e:Event)=>this._strokeSize=parseInt((e.target as HTMLInputElement).value)}">
            <span style="font-size:11px;color:var(--uwc-text-tertiary);min-width:18px;text-align:right">${this._strokeSize}</span>
          </div>

          <!-- Text controls (only when text tool active) -->
          ${T('text') ? html`
          <div class="tb-sep"></div>
          <div class="tb-group" style="gap:4px;flex-wrap:wrap">
            <select class="tb-select" title="Font family"
              @change="${(e:Event)=>this._fontFamily=(e.target as HTMLSelectElement).value}">
              <option>Arial, sans-serif</option><option>Georgia, serif</option>
              <option>Courier New, monospace</option><option>Times New Roman, serif</option>
              <option>Verdana, sans-serif</option>
            </select>
            <select class="tb-select" title="Font size" .value="${String(this._fontSize)}"
              @change="${(e:Event)=>this._fontSize=parseInt((e.target as HTMLSelectElement).value)}">
              ${[10,12,14,16,18,20,24,28,32,36,48,64].map(s=>html`<option ?selected="${s===this._fontSize}" value="${s}">${s}</option>`)}
            </select>
            <button class="tb-btn ${this._bold?'active':''}" @click="${()=>this._bold=!this._bold}" title="Bold"><b>B</b></button>
            <button class="tb-btn ${this._italic?'active':''}" @click="${()=>this._italic=!this._italic}" title="Italic"><i>I</i></button>
          </div>` : ''}

          <div class="tb-sep"></div>

          <div class="tb-group">
            <button class="tb-btn" title="Undo" @click="${this._undo}"><uwc-icon name="undo" size="16"></uwc-icon></button>
            <button class="tb-btn danger" title="Clear page" @click="${this._clearPage}"><uwc-icon name="trash" size="16"></uwc-icon></button>
          </div>
        </div>

        <!-- Signature hint bar -->
        ${this._pendingSig ? html`
        <div class="hint-bar">
          ✍ Click anywhere on the PDF to place the signature.
          <uwc-button size="xs" variant="secondary"
            @click="${()=>{this._pendingSig=null;this._setTool('select');}}">Cancel</uwc-button>
        </div>` : ''}

        <!-- Page nav -->
        <div class="page-nav">
          <uwc-button size="sm" variant="secondary" ?disabled="${this._currentPage<=1}"
            @click="${async()=>{this._currentPage--;await this.updateComplete;await this._renderPage(this._currentPage);}}">← Prev</uwc-button>
          <span>Page ${this._currentPage} of ${this._totalPages}</span>
          <uwc-button size="sm" variant="secondary" ?disabled="${this._currentPage>=this._totalPages}"
            @click="${async()=>{this._currentPage++;await this.updateComplete;await this._renderPage(this._currentPage);}}">Next →</uwc-button>
        </div>

        <!-- Canvas viewport -->
        <div class="canvas-viewport">
          <div class="canvas-inner">
            <canvas id="pdf-cv"></canvas>
            <canvas id="over-cv"></canvas>
            <!-- Text portal -->
            <div class="text-portal">
              <textarea class="text-ta" rows="3" placeholder="Type here…"
                @keydown="${(e:KeyboardEvent)=>{
                  if(e.key==='Escape'){e.preventDefault();this._textPortalOpen=false;this._textPortalEl.style.display='none';this._textTa.value='';}
                  if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();this._commitText();}
                }}"></textarea>
              <div class="text-hint">
                <span>Ctrl+Enter ✓  ·  Esc ✕</span>
                <span>
                  <button @click="${this._commitText}">✓ Done</button>
                  <button @click="${()=>{this._textPortalOpen=false;this._textPortalEl.style.display='none';this._textTa.value=''}}">✕</button>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="actions-row">
          <uwc-button variant="primary" ?disabled="${this._busy}" ?loading="${this._busy}" @click="${this._export}">
            <uwc-icon name="download" slot="icon" size="16"></uwc-icon>
            Export Annotated PDF
          </uwc-button>
        </div>
      </div>` : ''}

      <!-- ── Signature Modal ── -->
      ${this._sigModalOpen ? html`
      <div class="sig-overlay" @click="${(e:Event)=>{if(e.target===e.currentTarget)this._sigModalOpen=false;}}">
        <div class="sig-modal">
          <div class="sig-modal-title">✍ Add Signature</div>

          <div class="sig-tabs">
            ${(['draw','type','upload'] as const).map(t => html`
              <button class="sig-tab ${this._sigTab===t?'active':''}"
                @click="${()=>{this._sigTab=t;if(t==='type')setTimeout(()=>this._updateTypePreview(),50);if(t==='draw')setTimeout(()=>this._initDrawCanvas(),50);}}"
              >${{draw:'✏ Draw',type:'T Type',upload:'⬆ Upload'}[t]}</button>`)}
          </div>

          ${this._sigTab === 'draw' ? html`
          <div>
            <canvas class="draw-cv" width="460" height="130"></canvas>
            <div class="draw-controls">
              <label style="display:flex;align-items:center;gap:6px">Color
                <input type="color" value="#1a1a1a" style="width:24px;height:22px;padding:0;border:1px solid #ccc;border-radius:3px;cursor:pointer">
              </label>
              <uwc-button size="xs" variant="secondary"
                @click="${()=>this._drawCv.getContext('2d')!.clearRect(0,0,this._drawCv.width,this._drawCv.height)}">Clear</uwc-button>
            </div>
          </div>` : ''}

          ${this._sigTab === 'type' ? html`
          <div>
            <input class="type-input" type="text" placeholder="Your full name" @input="${this._updateTypePreview}">
            <div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:13px">
              Style:
              <select class="sig-font-sel tb-select" @change="${this._updateTypePreview}">
                <option value="italic 32px Georgia,serif">Cursive Script</option>
                <option value="32px Courier New,monospace">Typewriter</option>
                <option value="bold 30px Arial,sans-serif">Bold Print</option>
                <option value="italic bold 30px Times New Roman,serif">Formal Italic</option>
              </select>
            </div>
            <canvas class="preview-cv" width="460" height="70"></canvas>
          </div>` : ''}

          ${this._sigTab === 'upload' ? html`
          <div>
            <div class="upload-zone">
              <div style="font-size:26px;margin-bottom:8px">📁</div>
              <div>Click to choose or drag & drop an image</div>
              <small style="color:var(--uwc-text-tertiary)">PNG, JPG, WebP — transparent backgrounds work best</small>
              <input type="file" accept="image/*"
                @change="${(e:Event)=>{
                  const f=(e.target as HTMLInputElement).files?.[0]; if(!f) return;
                  const r=new FileReader();
                  r.onload=ev=>{
                    this._uploadSigUrl=ev.target!.result as string;
                    const img=new Image();
                    img.onload=()=>{
                      if(!this._upCv) return;
                      this._upCv.style.display='block';
                      const ctx=this._upCv.getContext('2d')!;
                      ctx.clearRect(0,0,this._upCv.width,this._upCv.height);
                      const sc=Math.min(this._upCv.width/img.width,this._upCv.height/img.height,1);
                      ctx.drawImage(img,(this._upCv.width-img.width*sc)/2,(this._upCv.height-img.height*sc)/2,img.width*sc,img.height*sc);
                    };
                    img.src=this._uploadSigUrl!;
                  };
                  r.readAsDataURL(f);
                }}">
            </div>
            <canvas class="upload-preview-cv" width="460" height="90"></canvas>
          </div>` : ''}

          <div class="sig-footer">
            <uwc-button variant="secondary" @click="${()=>this._sigModalOpen=false}">Cancel</uwc-button>
            <uwc-button variant="primary"   @click="${this._useSig}">Use Signature →</uwc-button>
          </div>
        </div>
      </div>` : ''}
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'uwc-plugin-sign': UwcPluginSign; } }
