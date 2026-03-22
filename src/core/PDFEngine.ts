import { loader } from './LibraryLoader.js';
import type {
  IPDFEngine,
  MergeResult, CompressResult, CompressOptions, TextExtractResult,
} from './interfaces/index.js';

/**
 * PDFEngine
 * Implements all core PDF operations using pdf-lib (write) and PDF.js (read/render).
 * Depends on LibraryLoader for lazy, cached library imports.
 * All methods are side-effect free: they return Blobs / data without mutating state.
 */
export class PDFEngine implements IPDFEngine {

  // ── Utility: read File as ArrayBuffer ──────────────────────
  private _readBuf(f: File): Promise<ArrayBuffer> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result as ArrayBuffer);
      r.onerror = () => rej(new Error(`Failed to read ${f.name}`));
      r.readAsArrayBuffer(f);
    });
  }

  private _readDataURL(f: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result as string);
      r.onerror = () => rej(new Error(`Failed to read ${f.name}`));
      r.readAsDataURL(f);
    });
  }

  private _dataURLtoPng(dataUrl: string): Promise<Uint8Array> {
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const c = Object.assign(document.createElement('canvas'),
          { width: img.naturalWidth, height: img.naturalHeight });
        c.getContext('2d')!.drawImage(img, 0, 0);
        c.toBlob(b => b!.arrayBuffer().then(r => res(new Uint8Array(r))), 'image/png');
      };
      img.src = dataUrl;
    });
  }

  private _canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
    return new Promise(res =>
      canvas.toBlob(b => b!.arrayBuffer().then(r => res(new Uint8Array(r))), 'image/jpeg', quality));
  }

  // ── MERGE ──────────────────────────────────────────────────

  async merge(
    files: File[],
    onProgress?: (n: number, total: number) => void,
  ): Promise<MergeResult> {
    const { PDFDocument } = await loader.pdfLib();
    const merged = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const buf = await this._readBuf(files[i]!);
      const src  = await PDFDocument.load(buf);
      const pgs  = await merged.copyPages(src, src.getPageIndices());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pgs.forEach((p: any) => merged.addPage(p));
      onProgress?.(i + 1, files.length);
    }

    const bytes = await merged.save();
    return {
      blob:      new Blob([bytes], { type: 'application/pdf' }),
      pageCount: merged.getPageCount(),
    };
  }

  // ── COMPRESS ───────────────────────────────────────────────

  async compress(
    file: File,
    opts: CompressOptions,
    onProgress?: (n: number, total: number) => void,
  ): Promise<CompressResult> {
    const [pdfjs, { PDFDocument }] = await Promise.all([loader.pdfjs(), loader.pdfLib()]);
    const origBuf = await this._readBuf(file);
    const origSize = origBuf.byteLength;

    const src    = await pdfjs.getDocument({ data: new Uint8Array(origBuf) }).promise;
    const newPdf = await PDFDocument.create();

    for (let i = 1; i <= src.numPages; i++) {
      const page = await src.getPage(i);
      const vp   = page.getViewport({ scale: opts.scale });
      const cv   = Object.assign(document.createElement('canvas'), { width: vp.width, height: vp.height });
      await page.render({ canvasContext: cv.getContext('2d')!, viewport: vp }).promise;
      const jpg = await this._canvasToJpeg(cv, opts.quality);
      const img = await newPdf.embedJpg(jpg);
      newPdf.addPage([vp.width, vp.height]).drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height });
      onProgress?.(i, src.numPages);
    }

    const out = await newPdf.save();
    const compressedSize = out.byteLength;
    return {
      blob:           new Blob([out], { type: 'application/pdf' }),
      originalSize:   origSize,
      compressedSize,
      ratio:          1 - compressedSize / origSize,
    };
  }

  // ── IMAGES → PDF ───────────────────────────────────────────

  async imagesToPDF(
    files: File[],
    onProgress?: (n: number, total: number) => void,
  ): Promise<Blob> {
    const { PDFDocument } = await loader.pdfLib();
    const pdf = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const dataUrl = await this._readDataURL(files[i]!);
      const mime    = files[i]!.type;
      let emb;
      if (mime === 'image/jpeg' || mime === 'image/jpg') {
        const b = Uint8Array.from(atob(dataUrl.split(',')[1]!), c => c.charCodeAt(0));
        emb = await pdf.embedJpg(b);
      } else {
        emb = await pdf.embedPng(await this._dataURLtoPng(dataUrl));
      }
      pdf.addPage([emb.width, emb.height])
         .drawImage(emb, { x: 0, y: 0, width: emb.width, height: emb.height });
      onProgress?.(i + 1, files.length);
    }

    return new Blob([await pdf.save()], { type: 'application/pdf' });
  }

  // ── EXTRACT TEXT ────────────────────────────────────────────

  async extractText(
    file: File,
    onProgress?: (n: number, total: number) => void,
  ): Promise<TextExtractResult> {
    const buf = new Uint8Array(await this._readBuf(file));
    return this.extractTextFromBuffer(buf, onProgress);
  }

  async extractTextFromBuffer(
    buf: Uint8Array,
    onProgress?: (n: number, total: number) => void,
  ): Promise<TextExtractResult> {
    const pdfjs = await loader.pdfjs();
    const pdf   = await pdfjs.getDocument({ data: buf }).promise;
    let text = '';
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const ct   = await page.getTextContent();
      text += (ct.items as Array<{ str: string }>).map((i: {str: string}) => i.str).join(' ') + '\n\n';
      onProgress?.(p, pdf.numPages);
    }
    return { text: text.trim(), pageCount: pdf.numPages };
  }

  // ── BUILD DOCX FROM TEXT ────────────────────────────────────

  async textToDocxBlob(text: string): Promise<Blob> {
    const { Document, Packer, Paragraph, TextRun } = await loader.docx();
    const children = text.split('\n').map(l =>
      new Paragraph({ children: [new TextRun({ text: l })] })
    );
    return Packer.toBlob(new Document({ sections: [{ properties: {}, children }] }));
  }

  // ── DOWNLOAD helper ─────────────────────────────────────────

  static download(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: name }).click();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  }
}

// Export a singleton for convenience
export const pdfEngine = new PDFEngine();
