import * as vscode from 'vscode';
import { configuration, gitIntegration, issuesExplorer, logger, notifications, statusBar, utilities } from '.';
import NoWorkingIssuePick from '../picks/no-working-issue-pick';
import { CONFIG, LOADING, NO_WORKING_ISSUE } from '../shared/constants';
import { IIssue, IProject } from './http.model';
import { Jira } from './http.service';
import { IState } from './store.model';

export default class StoreService {
  // initial state
  public state: IState = {
    jira: undefined as any,
    context: undefined as any,
    channel: undefined as any,
    documentLinkDisposable: undefined as any,
    statuses: [],
    projects: [],
    issues: [],
    currentSearch: {
      filter: LOADING.text,
      jql: '',
    },
    workingIssue: {
      issue: new NoWorkingIssuePick().pickValue,
      trackingTime: 0,
      awayTime: 0,
      stopped: false,
    },
  };

  public async connectToJira(): Promise<void> {
    try {
      // Disable all SSL validation for internal networks - also set at process level
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      
      this.state.jira = new Jira();
      
      // API 서버 버전 확인 및 호환성 검사 - 8.x에서만 작동
      try {
        const serverInfo = await this.state.jira.getServerInfo();
        const isCompatible = this.state.jira.isCompatibleServerVersion(serverInfo.version);
        
        if (!isCompatible) {
          // 호환되지 않는 서버 버전은 오류 발생 및 종료
          vscode.window.showErrorMessage(
            `이 JIRA 서버 버전(${serverInfo.version})은 이 확장과 호환되지 않습니다. ` +
            `JIRA 서버 8.x 버전에서만 지원됩니다.`
          );
          // 연결 중단 - 상태바 초기화
          statusBar.updateWorkingProjectItem('', true);
          this.changeStateIssues('', '', []);
          return; // 더 이상 진행하지 않음
        }
      } catch (versionError) {
        // 서버 버전 확인 실패 시 오류 표시 및 종료
        vscode.window.showErrorMessage(`서버 버전 확인 실패: ${versionError.message || versionError}`);
        statusBar.updateWorkingProjectItem('', true);
        this.changeStateIssues('', '', []);
        return; // 더 이상 진행하지 않음
      }
      
      // 호환 가능한 버전인 경우에만 아래 코드 실행
      // save statuses and projects in the global state
      this.state.statuses = await this.state.jira.getStatuses();
      this.addAdditionalStatuses();
      this.state.statuses.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

      this.state.projects = utilities.hideProjects(utilities.projectsToShow(await this.state.jira.getProjects()));
      utilities.createDocumentLinkProvider(this.state.projects);

      const project = configuration.get(CONFIG.WORKING_PROJECT);
      statusBar.updateWorkingProjectItem(project, true);
      // refresh Jira explorer list
      if (project) {
        // start notification service
        notifications.startNotificationsWatcher();
        await vscode.commands.executeCommand('jira-plugin.defaultIssues');
      } else {
        // vscode.window.showWarningMessage("Working project isn't set.");
      }
    } catch (err) {
      // Filter SSL errors
      const errorMessage = err.message || err;
      const isSSLError = typeof errorMessage === 'string' && 
          (errorMessage.includes('SSL') || 
           errorMessage.includes('TLS') ||
           errorMessage.includes('certificate') || 
           errorMessage.includes('cert'));
      
      setTimeout(() => {
        statusBar.updateWorkingProjectItem('', true);
      }, 1000);
      this.changeStateIssues('', '', []);
      
      if (!isSSLError) {
        logger.printErrorMessageInOutput(err);
      }
    }
  }

  public canExecuteJiraAPI(): boolean {
    return this.state.jira && configuration.isValid();
  }

  public verifyCurrentProject(project: string | undefined): boolean {
    return !!project && this.state.projects.filter((prj: IProject) => prj.key === project).length > 0;
  }

  public changeStateProject(project: string, checkGlobalStore: boolean): void {
    if (!!project) {
      if (configuration.get(CONFIG.WORKING_PROJECT) !== project) {
        configuration.set(CONFIG.WORKING_PROJECT, project);
        // update project item in the status bar
        statusBar.updateWorkingProjectItem(project, checkGlobalStore);
        // loading in Jira explorer
        this.changeStateIssues(LOADING.text, '', []);
        // start notification service
        notifications.startNotificationsWatcher();
        // launch search for the new project
        setTimeout(() => vscode.commands.executeCommand('jira-plugin.defaultIssues'), 1000);
      }
    }
  }

  public changeStateIssues(filter: string, jql: string, issues: IIssue[]): void {
    this.state.currentSearch.filter = filter;
    this.state.currentSearch.jql = jql;
    this.state.issues = issues;
    issuesExplorer.refresh();
  }

  public async changeStateWorkingIssue(issue: IIssue, trackingTime: number): Promise<void> {
    if (issue.key !== NO_WORKING_ISSUE.key) {
      await gitIntegration.switchToWorkingTicketBranch(issue);
    }
    const awayTime: number = 0; // FIXME: We don't need awayTime when changing issues, not sure best way to handle this.
    this.state.workingIssue = { issue, trackingTime, awayTime, stopped: false };
    statusBar.updateWorkingIssueItem();
  }

  public incrementStateWorkingIssueTimePerSecond(): void {
    if (!this.state.workingIssue.stopped) {
      this.state.workingIssue.trackingTime += 1;
      // prevent writing to much on storage
      if (this.state.workingIssue.trackingTime % 5 === 0) {
        if (this.state.workingIssue.issue.key !== NO_WORKING_ISSUE.key) {
          configuration.setGlobalWorkingIssue(this.state.workingIssue);
        }
      }
    }
  }

  public addAdditionalStatuses() {
    try {
      const additionalStatuses = configuration.get(CONFIG.ADDITIONAL_STATUSES);
      if (!!additionalStatuses) {
        const list = additionalStatuses.split(',');
        list.forEach((status: string) => {
          const newStatus = status.trim();
          if (!!newStatus && !this.state.statuses.find((el) => el.name.toLowerCase() === newStatus.toLowerCase())) {
            this.state.statuses.push({
              description: newStatus,
              name: newStatus,
            });
          }
        });
      }
    } catch (err) {
      logger.printErrorMessageInOutputAndShowAlert(err);
    }
  }
}
