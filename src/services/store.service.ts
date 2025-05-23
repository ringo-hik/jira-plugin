import * as vscode from 'vscode';

export default class StoreService {
  private memento: vscode.Memento | undefined;

  public initialize(context: vscode.ExtensionContext): void {
    this.memento = context.globalState;
  }

  public get<T>(key: string, defaultValue?: T): T {
    if (!this.memento) {
      return defaultValue as T;
    }
    return this.memento.get(key, defaultValue) as T;
  }

  public async set(key: string, value: any): Promise<void> {
    if (this.memento) {
      await this.memento.update(key, value);
    }
  }

  public async delete(key: string): Promise<void> {
    if (this.memento) {
      await this.memento.update(key, undefined);
    }
  }
}