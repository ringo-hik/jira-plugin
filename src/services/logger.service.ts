import * as vscode from 'vscode';
import { store } from '.';

export default class LoggerService {
  public printErrorMessageInOutputAndShowAlert(err: any) {
    if (store.state.channel) {
      vscode.window.showErrorMessage(`Check logs in Jira Plugin terminal output.`);
      store.state.channel.append(`${err.message || err}\n`);
    }
  }

  public printErrorMessageInOutput(err: any) {
    if (store.state.channel) {
      // Skip logging SSL related errors
      const errorMessage = err.message || err;
      if (typeof errorMessage === 'string' && 
          (errorMessage.includes('SSL') || 
           errorMessage.includes('certificate') || 
           errorMessage.includes('cert'))) {
        // Skip SSL related errors
        return;
      }
      store.state.channel.append(`${errorMessage}\n`);
    }
  }

  private debugMode() {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document) {
      const text = editor.document.getText();
      if (text.indexOf('JIRA_PLUGIN_DEBUG_MODE') !== -1) {
        return true;
      }
    }
    return false;
  }

  public jiraPluginDebugLog(message: string, value: any) {
    if (this.debugMode() && store.state.channel) {
      store.state.channel.append(`${message}: ${value}\n`);
    }
  }
}
