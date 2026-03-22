import type { IPlugin, PluginMeta } from './interfaces/index.js';

/**
 * PluginRegistry (Singleton)
 * Manages registration and lookup of all FolioForge plugins.
 *
 * Plugins self-register on import:
 *   PluginRegistry.instance.register(new MyPlugin());
 *
 * The app shell reads the registry to build the navigation.
 * New plugins can be added at runtime (dynamic import).
 */
export class PluginRegistry {
  private static _instance: PluginRegistry | null = null;
  static get instance(): PluginRegistry {
    return (this._instance ??= new PluginRegistry());
  }

  private readonly _plugins = new Map<string, IPlugin>();
  private readonly _listeners = new Set<() => void>();

  private constructor() {}

  /** Register a plugin. Throws if the id is already taken. */
  register(plugin: IPlugin): void {
    if (this._plugins.has(plugin.meta.id)) {
      console.warn(`[PluginRegistry] Plugin "${plugin.meta.id}" is already registered.`);
      return;
    }
    this._plugins.set(plugin.meta.id, plugin);
    this._emit();
  }

  /** Unregister a plugin by id. */
  unregister(id: string): void {
    this._plugins.delete(id);
    this._emit();
  }

  /** Get all registered plugins sorted by category then order. */
  getAll(): IPlugin[] {
    return [...this._plugins.values()].sort((a, b) => {
      if (a.meta.category !== b.meta.category) {
        return a.meta.category === 'pdf' ? -1 : 1;
      }
      return a.meta.order - b.meta.order;
    });
  }

  getById(id: string): IPlugin | undefined {
    return this._plugins.get(id);
  }

  getMeta(): PluginMeta[] {
    return this.getAll().map(p => p.meta);
  }

  /** Subscribe to registry changes (new plugins added at runtime). */
  subscribe(cb: () => void): () => void {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  private _emit(): void {
    this._listeners.forEach(cb => cb());
  }
}
