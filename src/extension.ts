import * as vscode from 'vscode';
import commands from './commands';
import './services';
import { configuration, gitIntegration, issuesExplorer, statusBar, store } from './services';
import { CONFIG, CONFIG_NAME } from './shared/constants';

// Function to open the settings dialog
async function openSettingsDialog() {
  const baseUrl = await vscode.window.showInputBox({
    placeHolder: 'Enter your Jira base URL (e.g. https://mycompany.atlassian.net)',
    prompt: 'Jira Base URL',
    value: configuration.get(CONFIG.BASE_URL)
  });
  
  if (baseUrl !== undefined) { // User didn't cancel
    await configuration.set(CONFIG.BASE_URL, baseUrl);
    
    const username = await vscode.window.showInputBox({
      placeHolder: 'Enter your Jira username or email',
      prompt: 'Jira Username',
      value: configuration.get(CONFIG.USERNAME)
    });
    
    if (username !== undefined) {
      await configuration.set(CONFIG.USERNAME, username);
      
      // Ask for password
      const password = await vscode.window.showInputBox({
        placeHolder: 'Enter your Jira password or API token',
        prompt: 'Jira Password/Token',
        password: true
      });
      
      if (password !== undefined) {
        await configuration.setPassword(password);
        
        // Ask for working project
        const workingProject = await vscode.window.showInputBox({
          placeHolder: 'Enter your default working project key (e.g. PROJ)',
          prompt: 'Working Project Key',
          value: configuration.get(CONFIG.WORKING_PROJECT)
        });
        
        if (workingProject !== undefined) {
          await configuration.set(CONFIG.WORKING_PROJECT, workingProject);
          
          // Reconnect to Jira with the new settings
          await store.connectToJira();
          vscode.window.showInformationMessage('Jira settings updated successfully!');
        }
      }
    }
  }
}

export const activate = async (context: vscode.ExtensionContext): Promise<void> => {
  const channel: vscode.OutputChannel = vscode.window.createOutputChannel(CONFIG_NAME.toUpperCase());
  context.subscriptions.push(channel);
  store.state.channel = channel;
  store.state.context = context;
  const treeView = vscode.window.createTreeView('issuesExplorer', { treeDataProvider: issuesExplorer });
  context.subscriptions.push(statusBar);
  context.subscriptions.push(gitIntegration);
  context.subscriptions.push(...commands.register());
  
  // Register the open settings command
  context.subscriptions.push(vscode.commands.registerCommand('jira-plugin.openSettings', () => {
    openSettingsDialog();
  }));
  // create Jira Instance and try to connect
  await store.connectToJira();
};
