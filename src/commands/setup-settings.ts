import * as vscode from 'vscode';

export async function openSettingsDialog(): Promise<void> {
  // 간단한 설정 다이얼로그
  const choice = await vscode.window.showQuickPick([
    'Setup JIRA Credentials',
    'View Extension Settings'
  ], {
    placeHolder: 'What would you like to configure?'
  });

  if (choice === 'Setup JIRA Credentials') {
    vscode.commands.executeCommand('jira-plugin.setupCredentials');
  } else if (choice === 'View Extension Settings') {
    vscode.commands.executeCommand('workbench.action.openSettings', 'jira-plugin');
  }
}
