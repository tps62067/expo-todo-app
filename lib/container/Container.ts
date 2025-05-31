export interface ServiceDefinition {
  factory: (...args: any[]) => any;
  singleton?: boolean;
  dependencies?: string[];
}

export class Container {
  private services = new Map<string, ServiceDefinition>();
  private instances = new Map<string, any>();
  
  register<T>(name: string, definition: ServiceDefinition): void {
    this.services.set(name, definition);
  }
  
  resolve<T>(name: string): T {
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }
    
    const definition = this.services.get(name);
    if (!definition) {
      throw new Error(`Service ${name} not found`);
    }
    
    const dependencies = definition.dependencies?.map(dep => this.resolve(dep)) || [];
    const instance = definition.factory(...dependencies);
    
    if (definition.singleton !== false) {
      this.instances.set(name, instance);
    }
    
    return instance;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  clear(): void {
    this.instances.clear();
    this.services.clear();
  }

  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }
} 