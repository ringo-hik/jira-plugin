import * as JiraConnector from 'jira-connector';

export interface IJiraIssue {
  key: string;
  summary: string;
  status: string;
  assignee: string;
  reporter: string;
  priority: string;
  issueType: string;
  created: string;
  updated: string;
  description?: string;
  url?: string;
}

export interface IJiraProject {
  key: string;
  name: string;
  description?: string;
}

export class JiraService {
  private jira: any;
  private baseUrl: string;
  private credentials: { username: string; password: string };

  constructor(baseUrl: string, credentials: { username: string; password: string }) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.credentials = credentials;
    
    this.jira = new (JiraConnector as any)({
      host: this.extractHost(baseUrl),
      port: this.extractPort(baseUrl),
      protocol: this.extractProtocol(baseUrl),
      basic_auth: {
        username: credentials.username,
        password: credentials.password
      },
      strictSSL: false,
      timeout: 120000
    });
  }

  private extractHost(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      throw new Error(`Invalid URL format: ${url}`);
    }
  }

  private extractPort(url: string): number {
    try {
      const urlObj = new URL(url);
      return urlObj.port ? parseInt(urlObj.port) : (urlObj.protocol === 'https:' ? 443 : 80);
    } catch (error) {
      return 80;
    }
  }

  private extractProtocol(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol.replace(':', '');
    } catch (error) {
      return 'http';
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.jira.serverInfo.getServerInfo();
      return true;
    } catch (error) {
      console.error('JIRA connection test failed:', error);
      throw new Error(`Connection failed: ${error.message || 'Unknown error'}`);
    }
  }

  public async getProjects(): Promise<IJiraProject[]> {
    try {
      const projects = await this.jira.project.getAllProjects();
      return projects.map((project: any) => ({
        key: project.key,
        name: project.name,
        description: project.description
      }));
    } catch (error) {
      throw new Error(`Failed to get projects: ${error.message || 'Unknown error'}`);
    }
  }

  public async getIssuesByProject(projectKey: string, maxResults: number = 50): Promise<IJiraIssue[]> {
    try {
      const jql = `project = "${projectKey}" ORDER BY updated DESC`;
      return await this.searchIssues(jql, maxResults);
    } catch (error) {
      throw new Error(`Failed to get issues: ${error.message || 'Unknown error'}`);
    }
  }

  public async getMyIssues(projectKey?: string, maxResults: number = 50): Promise<IJiraIssue[]> {
    try {
      let jql = 'assignee = currentUser()';
      if (projectKey) {
        jql += ` AND project = "${projectKey}"`;
      }
      jql += ' ORDER BY updated DESC';
      
      return await this.searchIssues(jql, maxResults);
    } catch (error) {
      throw new Error(`Failed to get my issues: ${error.message || 'Unknown error'}`);
    }
  }

  public async getIssuesByStatus(status: string, projectKey?: string, maxResults: number = 50): Promise<IJiraIssue[]> {
    try {
      let jql = `status = "${status}"`;
      if (projectKey) {
        jql += ` AND project = "${projectKey}"`;
      }
      jql += ' ORDER BY updated DESC';
      
      return await this.searchIssues(jql, maxResults);
    } catch (error) {
      throw new Error(`Failed to get issues by status: ${error.message || 'Unknown error'}`);
    }
  }

  public async searchIssues(jql: string, maxResults: number = 50): Promise<IJiraIssue[]> {
    try {
      const searchResult = await this.jira.search.search({
        jql: jql,
        maxResults: maxResults,
        fields: [
          'summary',
          'status',
          'assignee',
          'reporter',
          'priority',
          'issuetype',
          'created',
          'updated',
          'description'
        ]
      });

      return searchResult.issues.map((issue: any) => this.parseIssue(issue));
    } catch (error) {
      throw new Error(`Search failed: ${error.message || 'Unknown error'}`);
    }
  }

  public async getIssue(issueKey: string): Promise<IJiraIssue> {
    try {
      const issue = await this.jira.issue.getIssue({
        issueKey: issueKey,
        fields: [
          'summary',
          'status',
          'assignee',
          'reporter',
          'priority',
          'issuetype',
          'created',
          'updated',
          'description'
        ]
      });

      return this.parseIssue(issue);
    } catch (error) {
      throw new Error(`Failed to get issue: ${error.message || 'Unknown error'}`);
    }
  }

  private parseIssue(rawIssue: any): IJiraIssue {
    const fields = rawIssue.fields;
    
    return {
      key: rawIssue.key,
      summary: fields.summary || 'No summary',
      status: fields.status?.name || 'Unknown',
      assignee: fields.assignee?.displayName || 'Unassigned',
      reporter: fields.reporter?.displayName || 'Unknown',
      priority: fields.priority?.name || 'Unknown',
      issueType: fields.issuetype?.name || 'Unknown',
      created: fields.created ? new Date(fields.created).toLocaleDateString() : '',
      updated: fields.updated ? new Date(fields.updated).toLocaleDateString() : '',
      description: fields.description || '',
      url: `${this.baseUrl}/browse/${rawIssue.key}`
    };
  }

  public getIssueUrl(issueKey: string): string {
    return `${this.baseUrl}/browse/${issueKey}`;
  }
}