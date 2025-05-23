import * as vscode from 'vscode';
import { configuration, jira, logger, issuesExplorer } from '../services';
import { CONFIG } from '../shared/constants';

export default async function setupCredentials(): Promise<void> {
  try {
    // JIRA URL 입력
    const baseUrl = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: 'https://your-company.atlassian.net',
      prompt: 'Enter your JIRA server URL',
      value: configuration.get(CONFIG.BASE_URL),
      validateInput: (value) => {
        if (!value || value.trim() === '') {
          return 'JIRA URL is required';
        }
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          return 'URL must start with http:// or https://';
        }
        return null;
      }
    });

    if (!baseUrl) {
      return;
    }

    // 사용자 ID 입력
    const username = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: 'your-email@company.com',
      prompt: 'Enter your JIRA username/email',
      value: configuration.get(CONFIG.USERNAME),
      validateInput: (value) => {
        if (!value || value.trim() === '') {
          return 'Username is required';
        }
        return null;
      }
    });

    if (!username) {
      return;
    }

    // PAT 토큰 입력
    const password = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      password: true,
      placeHolder: 'Personal Access Token',
      prompt: 'Enter your JIRA Personal Access Token (PAT)',
      validateInput: (value) => {
        if (!value || value.trim() === '') {
          return 'PAT is required';
        }
        return null;
      }
    });

    if (!password) {
      return;
    }

    // 설정 저장
    await configuration.set(CONFIG.BASE_URL, baseUrl.trim().replace(/\/$/, ''));
    await configuration.set(CONFIG.USERNAME, username.trim());
    await configuration.setPassword(password.trim());

    logger.printInfoMessageInOutput('Credentials saved, testing connection...');

    // 연결 테스트
    try {
      await jira.initialize();
      issuesExplorer.refresh();
      vscode.window.showInformationMessage('JIRA connection successful!');
    } catch (error) {
      throw new Error(`Connection failed: ${error.message}`);
    }

  } catch (error) {
    logger.printErrorMessageInOutputAndShowAlert(error);
  }
}