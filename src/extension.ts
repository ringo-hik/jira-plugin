import * as vscode from 'vscode';
import { JiraService, IJiraIssue, IJiraProject } from './services/jira.service';

// 간단한 설정 관리
class SimpleConfig {
  private config: vscode.WorkspaceConfiguration;
  
  constructor() {
    this.config = vscode.workspace.getConfiguration('jira-plugin');
  }

  get baseUrl(): string {
    return this.config.get('baseUrl', '');
  }

  get username(): string {
    return this.config.get('username', '');
  }

  get workingProject(): string {
    return this.config.get('workingProject', '');
  }

  async setBaseUrl(value: string): Promise<void> {
    await this.config.update('baseUrl', value, vscode.ConfigurationTarget.Global);
  }

  async setUsername(value: string): Promise<void> {
    await this.config.update('username', value, vscode.ConfigurationTarget.Global);
  }

  async setWorkingProject(value: string): Promise<void> {
    await this.config.update('workingProject', value, vscode.ConfigurationTarget.Workspace);
  }

  async setPassword(password: string): Promise<void> {
    const key = `jira-plugin:${this.baseUrl}`;
    const credentials = {
      username: this.username,
      password: password
    };
    // 글로벌 상태에 저장 (실제로는 확장 컨텍스트가 필요)
    if (globalContext) {
      await globalContext.globalState.update(key, JSON.stringify(credentials));
    }
  }

  getCredentials(): { username: string; password: string } {
    if (!globalContext || !this.baseUrl) {
      return { username: '', password: '' };
    }
    
    const key = `jira-plugin:${this.baseUrl}`;
    const credentialsStr = globalContext.globalState.get(key, '');
    
    try {
      const credentials = JSON.parse(credentialsStr);
      return {
        username: credentials.username || '',
        password: credentials.password || ''
      };
    } catch (error) {
      return { username: '', password: '' };
    }
  }

  isValid(): boolean {
    const { password } = this.getCredentials();
    return !!(this.baseUrl && this.username && password);
  }
}

// 글로벌 변수들
let globalContext: vscode.ExtensionContext;
let config: SimpleConfig;
let jiraService: JiraService | null = null;
let outputChannel: vscode.OutputChannel;

// TreeView Provider
class JiraTreeProvider implements vscode.TreeDataProvider<any> {
  private _onDidChangeTreeData: vscode.EventEmitter<any | undefined | null | void> = new vscode.EventEmitter<any | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<any | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: any): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: any): Promise<any[]> {
    if (!config.isValid()) {
      const item = new vscode.TreeItem('Setup JIRA Connection', vscode.TreeItemCollapsibleState.None);
      item.command = {
        command: 'jira-plugin.setupCredentials',
        title: 'Setup Connection'
      };
      return [item];
    }

    if (!jiraService) {
      return [new vscode.TreeItem('Connecting...', vscode.TreeItemCollapsibleState.None)];
    }

    if (!config.workingProject) {
      try {
        const projects = await jiraService.getProjects();
        const items = [];
        
        // 헤더 추가
        const header = new vscode.TreeItem('📁 Select a Project:', vscode.TreeItemCollapsibleState.None);
        header.description = `${projects.length} projects available`;
        items.push(header);
        
        // 프로젝트 목록
        projects.forEach(project => {
          const item = new vscode.TreeItem(`${project.key} - ${project.name}`, vscode.TreeItemCollapsibleState.None);
          item.description = project.description ? project.description.substring(0, 50) + '...' : '';
          item.tooltip = `Click to select project: ${project.name}${project.description ? '\n' + project.description : ''}`;
          item.iconPath = vscode.ThemeIcon.Folder;
          item.command = {
            command: 'jira-plugin.selectProject',
            title: 'Select Project',
            arguments: [project.key]
          };
          items.push(item);
        });
        
        return items;
      } catch (error) {
        return [new vscode.TreeItem(`❌ Error: ${error.message}`, vscode.TreeItemCollapsibleState.None)];
      }
    }

    // 이슈 목록 표시
    try {
      const issues = await jiraService.getIssuesByProject(config.workingProject, 20);
      const items = [];
      
      // 프로젝트 헤더 (변경 가능)
      const projectHeader = new vscode.TreeItem(`📊 Project: ${config.workingProject}`, vscode.TreeItemCollapsibleState.None);
      projectHeader.description = `${issues.length} issues`;
      projectHeader.tooltip = 'Click to change project';
      projectHeader.command = {
        command: 'jira-plugin.setWorkingProject',
        title: 'Change Project'
      };
      items.push(projectHeader);
      
      // 이슈 목록
      issues.forEach(issue => {
        const item = new vscode.TreeItem(`${issue.key}: ${issue.summary}`, vscode.TreeItemCollapsibleState.None);
        item.tooltip = `Status: ${issue.status}\nAssignee: ${issue.assignee}\nClick to open in browser`;
        // 상태별 아이콘
        if (issue.status.toLowerCase().includes('progress') || issue.status.toLowerCase().includes('development')) {
          item.iconPath = vscode.ThemeIcon.File;
          item.description = '🔥 In Progress';
        } else if (issue.status.toLowerCase().includes('done') || issue.status.toLowerCase().includes('resolved')) {
          item.iconPath = vscode.ThemeIcon.File;
          item.description = '✅ Done';
        } else {
          item.iconPath = vscode.ThemeIcon.Folder;
          item.description = '⭕ ' + issue.status;
        }
        item.command = {
          command: 'jira-plugin.openIssue',
          title: 'Open Issue',
          arguments: [issue]
        };
        item.contextValue = 'jiraIssue';
        items.push(item);
      });
      
      return items;
    } catch (error) {
      return [new vscode.TreeItem(`❌ Error: ${error.message}`, vscode.TreeItemCollapsibleState.None)];
    }
  }
}

const treeProvider = new JiraTreeProvider();

// 로그 함수
function log(message: string) {
  const timestamp = new Date().toISOString();
  outputChannel.appendLine(`[${timestamp}] ${message}`);
  console.log(message);
}

// JIRA 연결 설정
async function setupCredentials(): Promise<void> {
  try {
    // JIRA URL 입력
    const baseUrl = await vscode.window.showInputBox({
      placeHolder: 'JIRA Server URL (e.g., https://your-company.atlassian.net)',
      prompt: 'Enter your JIRA server URL',
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value || !value.startsWith('http')) {
          return 'Please enter a valid URL starting with http:// or https://';
        }
        return null;
      }
    });

    if (!baseUrl) return;

    // 사용자 ID 입력
    const username = await vscode.window.showInputBox({
      placeHolder: 'JIRA Username',
      prompt: 'Enter your JIRA username',
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value) return 'Username is required';
        return null;
      }
    });

    if (!username) return;

    // PAT 토큰 입력
    const password = await vscode.window.showInputBox({
      placeHolder: 'Personal Access Token',
      prompt: 'Enter your JIRA Personal Access Token',
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value) return 'PAT is required';
        return null;
      }
    });

    if (!password) return;

    // 설정 저장
    await config.setBaseUrl(baseUrl.trim().replace(/\/$/, ''));
    await config.setUsername(username.trim());
    await config.setPassword(password.trim());

    log('Settings saved, testing connection...');

    // 연결 테스트
    await connectToJira();
    
    vscode.window.showInformationMessage('JIRA connection setup successful!');
    treeProvider.refresh();

  } catch (error) {
    const message = `Setup failed: ${error.message}`;
    log(message);
    vscode.window.showErrorMessage(message);
  }
}

// JIRA 연결
async function connectToJira(): Promise<void> {
  try {
    if (!config.isValid()) {
      throw new Error('Invalid configuration');
    }

    const credentials = config.getCredentials();
    jiraService = new JiraService(config.baseUrl, credentials);
    
    await jiraService.testConnection();
    log('JIRA connection successful');
    
  } catch (error) {
    jiraService = null;
    log(`JIRA connection failed: ${error.message}`);
    throw error;
  }
}

// 프로젝트 선택
async function selectProject(projectKey: string): Promise<void> {
  await config.setWorkingProject(projectKey);
  vscode.window.showInformationMessage(`Working project set to: ${projectKey}`);
  treeProvider.refresh();
}

// 이슈 열기
function openIssue(issue: IJiraIssue): void {
  if (issue.url) {
    vscode.env.openExternal(vscode.Uri.parse(issue.url));
  }
}

// 확장 활성화
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  globalContext = context;
  config = new SimpleConfig();
  
  outputChannel = vscode.window.createOutputChannel('JIRA-PLUGIN');
  context.subscriptions.push(outputChannel);
  
  log('JIRA Plugin activating...');

  // TreeView 등록
  const treeView = vscode.window.createTreeView('issuesExplorer', {
    treeDataProvider: treeProvider,
    showCollapseAll: true
  });
  context.subscriptions.push(treeView);

  // 명령어 등록
  const commands = [
    vscode.commands.registerCommand('jira-plugin.setupCredentials', setupCredentials),
    vscode.commands.registerCommand('jira-plugin.refresh', () => treeProvider.refresh()),
    vscode.commands.registerCommand('jira-plugin.selectProject', selectProject),
    vscode.commands.registerCommand('jira-plugin.openIssue', openIssue),
    vscode.commands.registerCommand('jira-plugin.setWorkingProject', async () => {
      if (!jiraService) {
        vscode.window.showWarningMessage('Please setup JIRA connection first');
        return;
      }
      const projects = await jiraService.getProjects();
      const selected = await vscode.window.showQuickPick(
        projects.map(p => ({ label: p.key, description: p.name })),
        { placeHolder: 'Select a project' }
      );
      if (selected) {
        await selectProject(selected.label);
      }
    })
  ];

  context.subscriptions.push(...commands);

  // 자동 연결 시도
  if (config.isValid()) {
    try {
      await connectToJira();
      treeProvider.refresh();
    } catch (error) {
      log(`Auto-connection failed: ${error.message}`);
    }
  } else {
    vscode.window.showInformationMessage('Setup JIRA connection to get started', 'Setup Now').then(selection => {
      if (selection === 'Setup Now') {
        vscode.commands.executeCommand('jira-plugin.setupCredentials');
      }
    });
  }

  log('JIRA Plugin activated successfully');
}

export function deactivate(): void {
  log('JIRA Plugin deactivated');
}