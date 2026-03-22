// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModule = any;

const CDN = {
  pdfLib:    'https://esm.sh/pdf-lib@1.17.1',
  pdfjs:     'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.mjs',
  docx:      'https://esm.sh/docx@8.5.0',
  tesseract: 'https://esm.sh/tesseract.js@5',
  webllm:    'https://esm.run/@mlc-ai/web-llm',
} as const;

export type LibraryKey = keyof typeof CDN;

class LibraryLoaderImpl {
  private readonly _cache = new Map<string, Promise<AnyModule>>();

  load<T = AnyModule>(key: string, loader: () => Promise<T>): Promise<T> {
    if (!this._cache.has(key)) this._cache.set(key, loader() as Promise<AnyModule>);
    return this._cache.get(key) as Promise<T>;
  }

  isLoaded(key: string): boolean { return this._cache.has(key); }
  preload(keys: string[]): void { keys.forEach(k => { if (k in CDN) this.load(k, () => import(CDN[k as LibraryKey])); }); }

  pdfLib()    { return this.load('pdfLib',    () => import(/* @vite-ignore */ CDN.pdfLib)); }
  docx()      { return this.load('docx',      () => import(/* @vite-ignore */ CDN.docx)); }
  tesseract() { return this.load('tesseract', () => import(/* @vite-ignore */ CDN.tesseract)); }
  webllm()    { return this.load('webllm',    () => import(/* @vite-ignore */ CDN.webllm)); }

  pdfjs() {
    return this.load('pdfjs', async () => {
      const m = await import(/* @vite-ignore */ CDN.pdfjs) as AnyModule;
      m.GlobalWorkerOptions.workerSrc =
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.mjs';
      return m;
    });
  }
}

export const loader = new LibraryLoaderImpl();
