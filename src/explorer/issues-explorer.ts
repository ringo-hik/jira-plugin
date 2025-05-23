import * as vscode from 'vscode';
import { jira, store } from '../services';

export class IssueItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly issue?: any,
    public readonly project?: string,
    public readonly isProject?: boolean,
    public readonly isFilter?: boolean
  ) {
    super(label, collapsibleState);
    
    if (this.issue) {
      this.contextValue = 'issue';
      this.tooltip = `${this.issue.key}: ${this.issue.fields.summary}`;
      this.command = {
        command: 'jira-plugin.openIssue',
        title: 'Open Issue',
        arguments: [this]
      };
    } else if (this.isProject) {
      this.contextValue = 'project';
      this.iconPath = new vscode.ThemeIcon('folder');
    } else if (this.isFilter) {
      this.contextValue = 'filter';
      this.iconPath = new vscode.ThemeIcon('filter');
    }
  }
}

export class IssuesExplorer implements vscode.TreeDataProvider<IssueItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<IssueItem | undefined | null | void> = new vscode.EventEmitter<IssueItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<IssueItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private projects: string[] = [];
  private searchMode: boolean = false;
  private searchJql: string = '';
  private searchResults: any[] = [];

  constructor() {
    this.projects = store.get('projects', []);
  }

  refresh(): void {
    this.projects = store.get('projects', []);
    this.searchMode = false;
    this._onDidChangeTreeData.fire();
  }

  showSearchResults(jql: string): void {
    this.searchMode = true;
    this.searchJql = jql;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: IssueItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: IssueItem): Promise<IssueItem[]> {
    if (!jira.isInitialized()) {
      return [new IssueItem('Click here to setup JIRA credentials', vscode.TreeItemCollapsibleState.None)];
    }

    // Search mode
    if (this.searchMode && !element) {
      try {
        const response = await jira.search({ jql: this.searchJql, maxResults: 50 });
        
        if (!response || !response.issues || response.issues.length === 0) {
          return [new IssueItem('No search results found', vscode.TreeItemCollapsibleState.None)];
        }

        const items = [
          new IssueItem(`Search Results (${response.issues.length})`, vscode.TreeItemCollapsibleState.None),
          new IssueItem('──────────────────', vscode.TreeItemCollapsibleState.None)
        ];

        response.issues.forEach((issue: any) => {
          items.push(new IssueItem(
            `${issue.key}: ${issue.fields.summary}`,
            vscode.TreeItemCollapsibleState.None,
            issue
          ));
        });

        return items;
      } catch (error) {
        return [new IssueItem(`Search error: ${error.message}`, vscode.TreeItemCollapsibleState.None)];
      }
    }

    if (!element) {
      // Root level - show projects
      if (this.projects.length === 0) {
        return [new IssueItem('No projects added. Use "Add Project" button', vscode.TreeItemCollapsibleState.None)];
      }
      
      return this.projects.map(project => 
        new IssueItem(project, vscode.TreeItemCollapsibleState.Collapsed, undefined, project, true)
      );
    }

    if (element.isProject && element.project) {
      // Project level - show filters
      return [
        new IssueItem('Recent Issues (50)', vscode.TreeItemCollapsibleState.Collapsed, undefined, element.project, false, true),
        new IssueItem('My Issues', vscode.TreeItemCollapsibleState.Collapsed, undefined, element.project, false, true)
      ];
    }

    if (element.isFilter && element.project) {
      // Filter level - show issues
      try {
        let jql = '';
        if (element.label.includes('Recent')) {
          jql = `project = ${element.project} ORDER BY updated DESC`;
        } else if (element.label.includes('My')) {
          jql = `project = ${element.project} AND assignee = currentUser() ORDER BY updated DESC`;
        }

        const response = await jira.search({ jql, maxResults: 50 });
        
        if (!response || !response.issues || response.issues.length === 0) {
          return [new IssueItem('No issues found', vscode.TreeItemCollapsibleState.None)];
        }

        return response.issues.map((issue: any) => 
          new IssueItem(
            `${issue.key}: ${issue.fields.summary}`,
            vscode.TreeItemCollapsibleState.None,
            issue
          )
        );
      } catch (error) {
        return [new IssueItem(`Error: ${error.message}`, vscode.TreeItemCollapsibleState.None)];
      }
    }

    return [];
  }

  addProject(projectKey: string): void {
    if (!this.projects.includes(projectKey)) {
      this.projects.push(projectKey);
      store.set('projects', this.projects);
      this.refresh();
    }
  }

  removeProject(projectKey: string): void {
    this.projects = this.projects.filter(p => p !== projectKey);
    store.set('projects', this.projects);
    this.refresh();
  }
}