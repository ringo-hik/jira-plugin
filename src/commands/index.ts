import * as vscode from 'vscode';
import { selectValues } from '../services';
import openIssue from './open-issue';
import setupCredentials from './setup-credentials';
import { openSettingsDialog } from './setup-settings';

const { registerCommand } = vscode.commands;

export default {
  /**
   * Registers all plugin related commands
   *
   * @returns {vscode.Disposable[]}
   */
  register(): vscode.Disposable[] {
    return [
      // initial setup
      registerCommand('jira-plugin.setupCredentials', setupCredentials),
      registerCommand('jira-plugin.openSettings', openSettingsDialog),

      // explorer
      registerCommand('jira-plugin.refresh', () => selectValues.refreshExplorer()),
      registerCommand('jira-plugin.addProject', () => selectValues.addProject()),
      registerCommand('jira-plugin.searchIssues', () => selectValues.searchIssues()),
      
      // issue actions
      registerCommand('jira-plugin.openIssue', openIssue),
    ];
  },
};
