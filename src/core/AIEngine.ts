import { loader } from './LibraryLoader.js';

export type AIStatus = 'idle' | 'loading' | 'ready' | 'error' | 'no-gpu';

export type AIModelId =
  | 'Llama-3.2-1B-Instruct-q4f16_1-MLC'
  | 'SmolLM2-1.7B-Instruct-q4f16_1-MLC'
  | 'Llama-3.2-3B-Instruct-q4f16_1-MLC'
  | 'Phi-3.5-mini-instruct-q4f16_1-MLC';

export interface AIModelOption {
  id:    AIModelId;
  label: string;
  size:  string;
}

export const AI_MODELS: AIModelOption[] = [
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',   label: 'Llama 3.2 · 1B',      size: '~380 MB' },
  { id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',   label: 'SmolLM2 · 1.7B',      size: '~950 MB' },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',   label: 'Llama 3.2 · 3B',      size: '~1.9 GB' },
  { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',   label: 'Phi-3.5 Mini · 3.8B', size: '~2.1 GB' },
];

export interface LoadProgress { progress: number; text: string; }

type StatusListener  = (s: AIStatus, msg: string) => void;
type ProgressListener = (p: LoadProgress) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Engine = any;

class AIEngineService {
  private _engine: Engine = null;
  private _status:  AIStatus = 'idle';
  private _statusMsg = '';
  private _modelId: AIModelId = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';

  private _statusListeners  = new Set<StatusListener>();
  private _progressListeners = new Set<ProgressListener>();

  get status():   AIStatus { return this._status; }
  get statusMsg():  string { return this._statusMsg; }
  get modelId(): AIModelId { return this._modelId; }
  get isReady():  boolean  { return this._status === 'ready'; }

  setModel(id: AIModelId): void { this._modelId = id; }

  subscribeStatus(fn: StatusListener):   () => void {
    this._statusListeners.add(fn);
    return () => this._statusListeners.delete(fn);
  }
  subscribeProgress(fn: ProgressListener): () => void {
    this._progressListeners.add(fn);
    return () => this._progressListeners.delete(fn);
  }

  private _emit(s: AIStatus, msg = ''): void {
    this._status    = s;
    this._statusMsg = msg;
    this._statusListeners.forEach(fn => fn(s, msg));
  }
  private _emitProgress(p: LoadProgress): void {
    this._progressListeners.forEach(fn => fn(p));
  }

  async checkGPU(): Promise<boolean> {
    if (!(navigator as any).gpu) return false;
    try { return !!(await (navigator as any).gpu.requestAdapter()); }
    catch { return false; }
  }

  async load(modelId?: AIModelId): Promise<void> {
    if (this._status === 'ready' || this._status === 'loading') return;

    if (modelId) this._modelId = modelId;

    const hasGPU = await this.checkGPU();
    if (!hasGPU) { this._emit('no-gpu', 'WebGPU not available in this browser.'); return; }

    this._emit('loading', 'Importing WebLLM…');
    try {
      const { CreateMLCEngine } = await loader.webllm();
      this._emit('loading', `Downloading ${this._modelId} (cached after first run)…`);

      this._engine = await CreateMLCEngine(this._modelId, {
        initProgressCallback: (p: { progress: number; text: string }) => {
          const pct = Math.round((p.progress ?? 0) * 100);
          const txt  = p.text ?? `Loading… ${pct}%`;
          this._emitProgress({ progress: pct, text: txt });
          this._emit('loading', txt);
        },
      });

      this._emit('ready', `✓ ${this._modelId.split('-').slice(0, 3).join(' ')}`);
      this._emitProgress({ progress: 100, text: 'Model ready' });
    } catch (e) {
      this._emit('error', (e as Error).message);
    }
  }

  unload(): void {
    this._engine = null;
    this._emit('idle', '');
  }

  /** Stream a completion. Calls `onChunk` with each delta token. Returns full text. */
  async stream(
    systemPrompt: string,
    userPrompt:   string,
    onChunk:     (delta: string, full: string) => void,
    maxTokens = 2000,
    temperature = 0.4,
  ): Promise<string> {
    if (!this._engine) throw new Error('AI model not loaded. Click "Load AI Model" above.');

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ];
    const stream = await this._engine.chat.completions.create({
      messages, max_tokens: maxTokens, stream: true, temperature,
    });

    let full = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      full += delta;
      onChunk(delta, full);
    }
    return full;
  }

  /** Multi-turn stream with history. Callers manage history array. */
  async streamWithHistory(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: any[],
    onChunk:  (delta: string, full: string) => void,
    maxTokens = 1000,
  ): Promise<string> {
    if (!this._engine) throw new Error('AI model not loaded. Click "Load AI Model" above.');
    const s = await this._engine.chat.completions.create({
      messages, max_tokens: maxTokens, stream: true, temperature: 0.35,
    });
    let full = '';
    for await (const chunk of s) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      full += delta;
      onChunk(delta, full);
    }
    return full;
  }
}

export const aiEngine = new AIEngineService();
