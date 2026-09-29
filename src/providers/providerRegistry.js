import { MockImageProvider } from './mockProvider.js';

class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.activeProviderName = 'mock';
    // Register default mock provider
    this.register('mock', new MockImageProvider());
  }

  register(name, providerInstance) {
    this.providers.set(name, providerInstance);
  }

  getActiveProvider() {
    return this.providers.get(this.activeProviderName) || this.providers.get('mock');
  }

  setActiveProvider(name) {
    if (!this.providers.has(name)) {
      throw new Error(`Provider "${name}" is not registered.`);
    }
    this.activeProviderName = name;
  }

  listProviders() {
    return Array.from(this.providers.keys()).map(name => ({
      name,
      active: name === this.activeProviderName,
      description: this.providers.get(name)?.name || name
    }));
  }
}

export const providerRegistry = new ProviderRegistry();
