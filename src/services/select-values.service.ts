import * as vscode from 'vscode';
import { issuesExplorer } from '.';

export default class SelectValuesService {
  public async refreshExplorer(): Promise<void> {
    issuesExplorer.refresh();
  }

  public async addProject(): Promise<void> {
    const projectKey = await vscode.window.showInputBox({
      prompt: 'Enter JIRA project key (e.g., PROJ)',
      placeHolder: 'PROJECT-KEY',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Project key is required';
        }
        return null;
      }
    });

    if (projectKey) {
      issuesExplorer.addProject(projectKey.trim().toUpperCase());
      vscode.window.showInformationMessage(`Added project: ${projectKey}`);
    }
  }

  public async searchIssues(): Promise<void> {
    const searchOptions = [
      { label: '$(search) Search by Issue ID', value: 'id' },
      { label: '$(search) Search by Text', value: 'text' },
      { label: '$(search) Custom JQL Query', value: 'jql' }
    ];

    const searchType = await vscode.window.showQuickPick(searchOptions, {
      placeHolder: 'Select search type'
    });

    if (!searchType) {
      return;
    }

    let jql = '';

    switch (searchType.value) {
      case 'id':
        const issueId = await vscode.window.showInputBox({
          prompt: 'Enter issue ID (e.g., PROJ-123)',
          placeHolder: 'PROJECT-123'
        });
        if (issueId) {
          jql = `key = ${issueId}`;
        }
        break;

      case 'text':
        const searchText = await vscode.window.showInputBox({
          prompt: 'Enter search text (searches in summary and description)',
          placeHolder: 'search keywords...'
        });
        if (searchText) {
          jql = `text ~ "${searchText}" ORDER BY updated DESC`;
        }
        break;

      case 'jql':
        jql = await vscode.window.showInputBox({
          prompt: 'Enter JQL query',
          placeHolder: 'project = PROJ AND status = "In Progress"',
          value: 'project = '
        }) || '';
        break;
    }

    if (jql) {
      issuesExplorer.showSearchResults(jql);
    }
  }
}