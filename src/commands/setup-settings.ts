import * as vscode from 'vscode';
import { configuration, configUI, issuesExplorer, store } from '../services';
import { CONFIG } from '../shared/constants';
import { ConfigGroup } from '../services/configuration.model';

/**
 * 설정 대화상자 열기
 * 사용자가 설정을 구성할 수 있는 대화상자를 표시합니다.
 */
export async function openSettingsDialog() {
  // 사용자 설정 구성 카테고리 목록
  const sections = [
    { 
      label: 'Connection Settings', 
      description: 'Configure Jira URL, username, and password',
      group: ConfigGroup.CONNECTION
    },
    { 
      label: 'Project Settings', 
      description: 'Configure working project and related settings',
      group: ConfigGroup.PROJECT
    },
    { 
      label: 'Issue Settings', 
      description: 'Configure working issue settings and filters',
      group: ConfigGroup.ISSUE
    },
    { 
      label: 'Display Settings', 
      description: 'Configure explorer display settings',
      group: ConfigGroup.DISPLAY
    },
  ];

  // 사용자에게 설정 카테고리 선택 요청
  const section = await vscode.window.showQuickPick(
    sections,
    { placeHolder: 'Select settings section to configure' }
  );

  if (!section) {
    return; // 사용자가 취소함
  }

  // 확인을 위한 메시지 표시
  const configuring = `Configuring ${section.label.toLowerCase()}...`;
  await vscode.window.withProgress(
    { 
      location: vscode.ProgressLocation.Notification,
      title: configuring,
      cancellable: false
    },
    async () => {
      // 선택한 설정 그룹에 따라 적절한 설정 UI 표시
      switch (section.group) {
        case ConfigGroup.CONNECTION:
          // 연결 설정은 추상화된 UI를 사용하지 않고 직접 구현
          // 비밀번호 처리 등의 특수한 로직이 필요하기 때문
          await configureConnectionSettings();
          break;
          
        default:
          // 기타 설정은 추상화된 UI 사용
          await configUI.showGroupSettings(section.group);
          
          // 설정 변경 후 필요한 업데이트 작업
          if (section.group === ConfigGroup.PROJECT) {
            issuesExplorer.refresh();
          }
          break;
      }
    }
  );
}

async function configureConnectionSettings() {
  const baseUrl = await vscode.window.showInputBox({
    placeHolder: 'Enter your Jira base URL (e.g. https://mycompany.atlassian.net)',
    prompt: 'Jira Base URL',
    value: configuration.get(CONFIG.BASE_URL),
  });

  if (baseUrl === undefined) {
    return;
  } // User cancelled

  await configuration.set(CONFIG.BASE_URL, baseUrl);

  const username = await vscode.window.showInputBox({
    placeHolder: 'Enter your Jira username or email',
    prompt: 'Jira Username',
    value: configuration.get(CONFIG.USERNAME),
  });

  if (username === undefined) {
    return;
  } // User cancelled

  await configuration.set(CONFIG.USERNAME, username);

  // Ask for password
  const password = await vscode.window.showInputBox({
    placeHolder: 'Enter your Jira password or API token',
    prompt: 'Jira Password/Token',
    password: true,
  });

  if (password === undefined) {
    return;
  } // User cancelled

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

  // 호환성은 연결 과정에서 자동으로 검증되므로 여기서는 간단한 안내 메시지만 표시
  const message = 'Jira 연결 설정이 업데이트되었습니다. 이 확장은 Jira 서버 8.x 버전에서만 작동합니다.';
  const testCompatButton = '호환성 테스트';
  
  const result = await vscode.window.showInformationMessage(message, testCompatButton);
  
  // 호환성 테스트 버튼 클릭 시 모의 테스트 실행 (사내망에서 테스트용)
  if (result === testCompatButton) {
    const versionInput = await vscode.window.showInputBox({
      placeHolder: '테스트할 Jira 서버 버전을 입력하세요 (예: 7.13.0, 8.5.4, 9.0.0)',
      prompt: '서버 버전 호환성 테스트',
      value: '8.0.0',
    });
    
    if (versionInput) {
      // 모의 서버 버전으로 호환성 테스트
      if (store.state.jira) {
        const isCompatible = store.state.jira.isCompatibleServerVersion(versionInput);
        if (isCompatible) {
          vscode.window.showInformationMessage(
            `호환성 테스트 통과: Jira 서버 버전 ${versionInput}은(는) 이 확장과 호환됩니다.`
          );
        } else {
          vscode.window.showErrorMessage(
            `호환성 테스트 실패: Jira 서버 버전 ${versionInput}은(는) 이 확장과 호환되지 않습니다. ` +
            `이 확장은 Jira 서버 8.x 버전에서만 지원됩니다.`
          );
        }
      } else {
        vscode.window.showErrorMessage('Jira 클라이언트가 초기화되지 않았습니다.');
      }
    }
  }
}

async function configureProjectSettings() {
  // Ask for working project
  const workingProject = await vscode.window.showInputBox({
    placeHolder: 'Enter your default working project key (e.g. PROJ)',
    prompt: 'Working Project Key',
    value: configuration.get(CONFIG.WORKING_PROJECT),
  });

  if (workingProject === undefined) {
    return;
  } // User cancelled

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
