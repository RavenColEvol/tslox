import { RuntimeError } from "./interpreter";
import { Token } from "./scanner";

export class Environment {
  values: Map<string, any> = new Map();
  enclosing: Environment | null;
  
  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing;
  }

  define(name: string, value: any) {
    this.values.set(name, value);
  }

  assign(name: Token, value: any) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing != null) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable "${name.lexeme}".`)
  }

  get(name: Token): any {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }

    if (this.enclosing != null) return this.enclosing.get(name);

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`)
  }
}