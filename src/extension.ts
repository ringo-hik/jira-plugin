import * as vscode from 'vscode';
import commands from './commands';
import './services';
import { gitIntegration, issuesExplorer, statusBar, store } from './services';
import { CONFIG_NAME } from './shared/constants';
import { openSettingsDialog } from './commands/setup-settings';

export const activate = async (context: vscode.ExtensionContext): Promise<void> => {
  try {
    const channel: vscode.OutputChannel = vscode.window.createOutputChannel(CONFIG_NAME.toUpperCase());
    context.subscriptions.push(channel);
    store.state.channel = channel;
    store.state.context = context;
    const treeView = vscode.window.createTreeView('issuesExplorer', { treeDataProvider: issuesExplorer });
    context.subscriptions.push(treeView); // Make sure treeView is properly disposed
    context.subscriptions.push(statusBar);
    context.subscriptions.push(gitIntegration);
    context.subscriptions.push(...commands.register());
    // create Jira Instance and try to connect
    await store.connectToJira();
  } catch (error) {
    // Prevent extension activation failures
    console.error('Error activating Jira Plugin:', error);
    vscode.window.showErrorMessage('Jira Plugin activation failed: ' + (error.message || 'Unknown error'));
  }
};
