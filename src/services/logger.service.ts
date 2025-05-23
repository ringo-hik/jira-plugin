import * as vscode from 'vscode';

export default class LoggerService {
  private outputChannel: vscode.OutputChannel | undefined;

  public initialize(context: vscode.ExtensionContext): void {
    this.outputChannel = vscode.window.createOutputChannel('JIRA-PLUGIN');
    context.subscriptions.push(this.outputChannel);
  }

  public printInfoMessageInOutput(message: string): void {
    this.print('INFO', message);
  }

  public printErrorMessageInOutput(message: string): void {
    this.print('ERROR', message);
  }

  public printErrorMessageInOutputAndShowAlert(error: Error | string): void {
    const message = error instanceof Error ? error.message : error;
    this.printErrorMessageInOutput(message);
    vscode.window.showErrorMessage(message);
  }

  private print(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (this.outputChannel) {
      this.outputChannel.appendLine(logMessage);
    }
    
    console.log(logMessage);
  }
}
