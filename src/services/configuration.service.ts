import * as vscode from 'vscode';
import { store } from '.';
import { CONFIG, CONFIG_NAME } from '../shared/constants';

export default class ConfigurationService {
  private settings: vscode.WorkspaceConfiguration;

  constructor() {
    this.settings = vscode.workspace.getConfiguration(CONFIG_NAME);
  }

  public isValid(): boolean {
    const baseUrl = this.get(CONFIG.BASE_URL);
    const username = this.get(CONFIG.USERNAME);
    const password = this.getPassword();
    
    return !!(baseUrl && username && password);
  }

  public get(key: string): string {
    return this.settings.get(key, '');
  }

  public async set(key: string, value: string): Promise<void> {
    await this.settings.update(key, value, vscode.ConfigurationTarget.Global);
  }

  public getPassword(): string {
    const baseUrl = this.get(CONFIG.BASE_URL);
    if (!baseUrl) {
      return '';
    }

    const credentialsKey = `${CONFIG_NAME}:${baseUrl}`;
    const credentials = store.get(credentialsKey, { username: '', password: '' });
    return credentials.password || '';
  }

  public async setPassword(password: string): Promise<void> {
    const baseUrl = this.get(CONFIG.BASE_URL);
    const username = this.get(CONFIG.USERNAME);
    
    if (baseUrl && username) {
      const credentialsKey = `${CONFIG_NAME}:${baseUrl}`;
      await store.set(credentialsKey, { username, password });
    }
  }
}