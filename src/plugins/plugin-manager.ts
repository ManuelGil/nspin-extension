import type { SpinnerPlugin } from '../types/index.js';

/**
 * Manages plugins and their error counters.
 * This class encapsulates plugin notification logic to follow the Single Responsibility Principle.
 */
export class PluginManager {
  private plugins: SpinnerPlugin[] = [];
  private errorCounters: WeakMap<SpinnerPlugin, number> = new WeakMap();
  private readonly PLUGIN_ERROR_THRESHOLD = 3;

  /**
   * Registers a plugin.
   * @param plugin - The plugin to register.
   */
  public register(plugin: SpinnerPlugin): void {
    if (!this.plugins.includes(plugin)) {
      this.plugins.push(plugin);
    }
  }

  /**
   * Unregisters a plugin.
   * @param plugin - The plugin to unregister.
   */
  public unregister(plugin: SpinnerPlugin): void {
    this.plugins = this.plugins.filter((p) => p !== plugin);
  }

  /**
   * Notifies all registered plugins by calling the provided callback.
   * If a plugin exceeds the error threshold, it will be skipped.
   * @param callback - Callback function to invoke on each plugin.
   */
  public notify(callback: (plugin: SpinnerPlugin) => void): void {
    for (const plugin of this.plugins) {
      const count = this.errorCounters.get(plugin) ?? 0;
      if (count >= this.PLUGIN_ERROR_THRESHOLD) {
        continue;
      }
      try {
        callback(plugin);
        if (count > 0) this.errorCounters.set(plugin, 0);
      } catch {
        this.errorCounters.set(plugin, count + 1);
      }
    }
  }

  /**
   * Resets the error counters for all plugins.
   */
  public resetErrorCounters(): void {
    for (const plugin of this.plugins) {
      this.errorCounters.set(plugin, 0);
    }
  }

  /**
   * Returns all registered plugins.
   */
  public getPlugins(): SpinnerPlugin[] {
    return this.plugins;
  }
}
