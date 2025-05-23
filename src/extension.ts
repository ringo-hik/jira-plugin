import * as vscode from 'vscode';
import commands from './commands';
import { configuration, issuesExplorer, jira, logger, store } from './services';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    // Initialize store with context
    store.initialize(context);
    
    // Initialize logger
    logger.initialize(context);
    logger.printInfoMessageInOutput('JIRA Plugin activating...');

    // Register TreeView
    const treeView = vscode.window.createTreeView('issuesExplorer', {
      treeDataProvider: issuesExplorer,
      showCollapseAll: true
    });

    // Add plus button to tree view
    treeView.title = 'JIRA Projects';
    
    context.subscriptions.push(treeView);

    // Register all commands
    context.subscriptions.push(...commands.register());

    // Try to initialize JIRA connection if credentials exist
    if (configuration.isValid()) {
      try {
        await jira.initialize();
        issuesExplorer.refresh();
      } catch (error) {
        logger.printErrorMessageInOutput(`Auto-connection failed: ${error.message}`);
      }
    } else {
      vscode.window.showInformationMessage('Setup JIRA connection to get started', 'Setup Now').then(selection => {
        if (selection === 'Setup Now') {
          vscode.commands.executeCommand('jira-plugin.setupCredentials');
        }
      });
    }

    logger.printInfoMessageInOutput('JIRA Plugin activated successfully');
  } catch (error) {
    logger.printErrorMessageInOutput(`Activation failed: ${error.message}`);
  }
}

export function deactivate(): void {
  logger.printInfoMessageInOutput('JIRA Plugin deactivated');
}