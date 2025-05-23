import * as vscode from 'vscode';
import { configuration } from '../services';
import { CONFIG } from '../shared/constants';
import { IssueItem } from '../explorer/issues-explorer';

export default async function openIssue(issueItem: IssueItem): Promise<void> {
  if (!issueItem.issue) {
    return;
  }
  
  const issueKey = issueItem.issue.key;
  const url = `${configuration.get(CONFIG.BASE_URL)}/browse/${issueKey}`;
  vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
}
