import { SyncMethodInterface, SyncConfig, SyncResult, SyncMethod } from './types';
import { PluginApiSync } from './methods/PluginApiSync';
import { RestApiSync } from './methods/RestApiSync';

export class SyncManager {
  private methods: Map<SyncMethod, SyncMethodInterface>;

  constructor() {
    this.methods = new Map();
    this.methods.set('plugin_api', new PluginApiSync());
    this.methods.set('rest_api', new RestApiSync());
  }

  async syncSite(config: SyncConfig): Promise<SyncResult> {
    const primaryMethod = this.methods.get(config.preferredMethod);
    
    if (!primaryMethod) {
      return {
        success: false,
        message: `Unknown sync method: ${config.preferredMethod}`,
        method: config.preferredMethod
      };
    }

    // Try primary method first
    console.log(`Attempting sync with ${config.preferredMethod}...`);
    const primaryResult = await primaryMethod.sync(config);

    if (primaryResult.success) {
      console.log(`✅ ${config.preferredMethod} sync successful`);
      return primaryResult;
    }

    // If primary method failed and fallback is enabled, try the other method
    if (config.fallbackEnabled) {
      const fallbackMethod = config.preferredMethod === 'plugin_api' ? 'rest_api' : 'plugin_api';
      const fallbackSync = this.methods.get(fallbackMethod);
      
      if (fallbackSync && fallbackSync.validateConfig(config)) {
        console.log(`⚠️ ${config.preferredMethod} failed, trying ${fallbackMethod}...`);
        
        const fallbackResult = await fallbackSync.sync(config);
        
        if (fallbackResult.success) {
          console.log(`✅ ${fallbackMethod} sync successful (fallback)`);
          return {
            ...fallbackResult,
            message: `${fallbackResult.message} (fallback from ${config.preferredMethod})`
          };
        } else {
          console.log(`❌ Both methods failed`);
          return {
            success: false,
            message: `Both sync methods failed. Primary (${config.preferredMethod}): ${primaryResult.message}. Fallback (${fallbackMethod}): ${fallbackResult.message}`,
            method: config.preferredMethod,
            errors: [
              ...(primaryResult.errors || []),
              ...(fallbackResult.errors || [])
            ]
          };
        }
      }
    }

    console.log(`❌ ${config.preferredMethod} sync failed, no fallback available`);
    return primaryResult;
  }

  getMethodCapabilities(method: SyncMethod) {
    return this.methods.get(method)?.capabilities;
  }

  getAllMethods(): SyncMethod[] {
    return Array.from(this.methods.keys());
  }

  validateConfig(config: SyncConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.siteUrl) {
      errors.push('Site URL is required');
    }
    
    if (!config.preferredMethod) {
      errors.push('Preferred method is required');
    }
    
    const method = this.methods.get(config.preferredMethod);
    if (method && !method.validateConfig(config)) {
      errors.push(`Invalid configuration for ${config.preferredMethod}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
} 