import * as vscode from 'vscode';
import { configuration, issuesExplorer, store } from '../services';
import { CONFIG } from '../shared/constants';

export async function openSettingsDialog() {
  const section = await vscode.window.showQuickPick(
    [
      { label: 'Connection Settings', description: 'Configure Jira URL, username, and password' },
      { label: 'Project Settings', description: 'Configure working project and related settings' },
      { label: 'Issue Settings', description: 'Configure working issue settings and filters' },
      { label: 'Display Settings', description: 'Configure explorer display settings' },
    ],
    { placeHolder: 'Select settings section to configure' }
  );

  if (!section) {
    return;
  }

  switch (section.label) {
    case 'Connection Settings':
      await configureConnectionSettings();
      break;
    case 'Project Settings':
      await configureProjectSettings();
      break;
    case 'Issue Settings':
      await configureIssueSettings();
      break;
    case 'Display Settings':
      await configureDisplaySettings();
      break;
  }
}

async function configureConnectionSettings() {
  const baseUrl = await vscode.window.showInputBox({
    placeHolder: 'Enter your Jira base URL (e.g. https://mycompany.atlassian.net)',
    prompt: 'Jira Base URL',
    value: configuration.get(CONFIG.BASE_URL),
  });

  if (baseUrl === undefined) { return; } // User cancelled

  await configuration.set(CONFIG.BASE_URL, baseUrl);

  const username = await vscode.window.showInputBox({
    placeHolder: 'Enter your Jira username or email',
    prompt: 'Jira Username',
    value: configuration.get(CONFIG.USERNAME),
  });

  if (username === undefined) { return; } // User cancelled

  await configuration.set(CONFIG.USERNAME, username);

  // Ask for password
  const password = await vscode.window.showInputBox({
    placeHolder: 'Enter your Jira password or API token',
    prompt: 'Jira Password/Token',
    password: true,
  });

  if (password === undefined) { return; } // User cancelled

  await configuration.setPassword(password);

  // Ask for strictSSL
  const strictSSL = await vscode.window.showQuickPick(
    [
      { label: 'true', description: 'Enable strict SSL certificate validation' },
      { label: 'false', description: 'Disable strict SSL certificate validation' },
    ],
    { placeHolder: 'Configure SSL validation (choose false if you have certificate issues)' }
  );

  if (strictSSL) {
    await configuration.set(CONFIG.STRICT_SSL, strictSSL.label);
  }

  // Reconnect to Jira
  await store.connectToJira();
  vscode.window.showInformationMessage('Jira connection settings updated successfully!');
}

async function configureProjectSettings() {
  // Ask for working project
  const workingProject = await vscode.window.showInputBox({
    placeHolder: 'Enter your default working project key (e.g. PROJ)',
    prompt: 'Working Project Key',
    value: configuration.get(CONFIG.WORKING_PROJECT),
  });

  if (workingProject === undefined) { return; } // User cancelled

  await configuration.set(CONFIG.WORKING_PROJECT, workingProject);

  // Ask for projects to show/hide
  const projectsToShow = await vscode.window.showInputBox({
    placeHolder: 'Enter project keys to show (comma separated, e.g. PROJ1, PROJ2)',
    prompt: 'Projects to Show (leave empty to show all)',
    value: configuration.get(CONFIG.PROJECTS_TO_SHOW),
  });

  if (projectsToShow !== undefined) {
    await configuration.set(CONFIG.PROJECTS_TO_SHOW, projectsToShow);
  }

  const projectsToHide = await vscode.window.showInputBox({
    placeHolder: 'Enter project keys to hide (comma separated, e.g. PROJ1, PROJ2)',
    prompt: 'Projects to Hide',
    value: configuration.get(CONFIG.PROJECTS_TO_HIDE),
  });

  if (projectsToHide !== undefined) {
    await configuration.set(CONFIG.PROJECTS_TO_HIDE, projectsToHide);
  }

  // Git integration
  const enableGit = await vscode.window.showQuickPick(
    [
      { label: 'Enable', description: 'Enable Git integration' },
      { label: 'Disable', description: 'Disable Git integration' },
    ],
    { placeHolder: 'Configure Git integration' }
  );

  if (enableGit) {
    await configuration.set(CONFIG.GIT_INTEGRATION_ENABLED, enableGit.label === 'Enable');
  }

  vscode.window.showInformationMessage('Jira project settings updated successfully!');
  issuesExplorer.refresh();
}

async function configureIssueSettings() {
  // Configure working issue settings
  const enableWorkingIssue = await vscode.window.showQuickPick(
    [
      { label: 'Enable', description: 'Enable working issue functionality' },
      { label: 'Disable', description: 'Disable working issue functionality' },
    ],
    { placeHolder: 'Configure working issue functionality' }
  );

  if (enableWorkingIssue) {
    await configuration.set(CONFIG.ENABLE_WORKING_ISSUE, enableWorkingIssue.label === 'Enable');
  }

  const workingIssueStatuses = await vscode.window.showInputBox({
    placeHolder: 'Enter statuses for working issues (comma separated, e.g. In Progress, Development)',
    prompt: 'Working Issue Statuses',
    value: configuration.get(CONFIG.WORKING_ISSUE_STATUSES),
  });

  if (workingIssueStatuses !== undefined) {
    await configuration.set(CONFIG.WORKING_ISSUE_STATUSES, workingIssueStatuses);
  }

  const workingIssueAssignees = await vscode.window.showInputBox({
    placeHolder: 'Enter assignees for working issues (comma separated, CURRENT_USER for yourself)',
    prompt: 'Working Issue Assignees',
    value: configuration.get(CONFIG.WORKING_ISSUE_ASSIGNEES),
  });

  if (workingIssueAssignees !== undefined) {
    await configuration.set(CONFIG.WORKING_ISSUE_ASSIGNEES, workingIssueAssignees);
  }

  const showTimer = await vscode.window.showQuickPick(
    [
      { label: 'Show', description: 'Show working issue timer in status bar' },
      { label: 'Hide', description: 'Hide working issue timer in status bar' },
    ],
    { placeHolder: 'Configure working issue timer visibility' }
  );

  if (showTimer) {
    await configuration.set(CONFIG.WORKING_ISSUE_SHOW_TIMER, showTimer.label === 'Show');
  }

  vscode.window.showInformationMessage('Jira issue settings updated successfully!');
}

async function configureDisplaySettings() {
  // Configure display settings
  const numberOfIssues = await vscode.window.showInputBox({
    placeHolder: 'Enter the maximum number of issues to display (e.g. 50)',
    prompt: 'Number of Issues',
    value: configuration.get(CONFIG.NUMBER_ISSUES_IN_LIST).toString(),
  });

  if (numberOfIssues !== undefined) {
    const numberValue = parseInt(numberOfIssues);
    if (!isNaN(numberValue)) {
      await configuration.set(CONFIG.NUMBER_ISSUES_IN_LIST, numberValue);
    }
  }

  const autoRefreshInterval = await vscode.window.showInputBox({
    placeHolder: 'Enter auto-refresh interval in minutes (0 to disable)',
    prompt: 'Auto-refresh Interval',
    value: configuration.get(CONFIG.ISSUE_LIST_AUTO_REFRESH_INTERVAL).toString(),
  });

  if (autoRefreshInterval !== undefined) {
    const numberValue = parseInt(autoRefreshInterval);
    if (!isNaN(numberValue)) {
      await configuration.set(CONFIG.ISSUE_LIST_AUTO_REFRESH_INTERVAL, numberValue);
    }
  }

  const groupSubtasks = await vscode.window.showQuickPick(
    [
      { label: 'Enable', description: 'Group tasks and subtasks in explorer' },
      { label: 'Disable', description: 'Show tasks and subtasks separately' },
    ],
    { placeHolder: 'Configure task and subtask grouping' }
  );

  if (groupSubtasks) {
    await configuration.set(CONFIG.GROUP_TASK_AND_SUBTASKS, groupSubtasks.label === 'Enable');
  }

  vscode.window.showInformationMessage('Jira display settings updated successfully!');
  issuesExplorer.refresh();
}
