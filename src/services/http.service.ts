import { configuration, logger } from '.';
import { ASSIGNEES_MAX_RESULTS, CONFIG, ERROR_WRONG_CONFIGURATION } from '../shared/constants';
import { patchJiraInstance } from '../shared/jira-instance-patch';
import {
  IAddComment,
  IAddCommentResponse,
  IAddWorkLog,
  IAssignee,
  IAvailableLinkIssuesType,
  ICreateIssue,
  ICreateIssueEpic,
  ICreateMetadata,
  IFavouriteFilter,
  IIssue,
  IIssueType,
  IJira,
  ILabel,
  IMarkNotificationAsReadUnread,
  INotifications,
  IPriority,
  IProject,
  ISearch,
  IServerInfo,
  ISetTransition,
  ISprint,
  IStatus,
  ITransitions,
} from './http.model';

const jiraClient = require('jira-connector');

export class Jira implements IJira {
  jiraInstance: any;
  baseUrl: string;

  constructor() {
    if (!configuration.isValid()) {
      if (!!configuration.get(CONFIG.BASE_URL) && !!configuration.credentials.username && !!configuration.credentials.password) {
        logger.printErrorMessageInOutputAndShowAlert('Check Jira Plugin settings in VSCode.');
      }
      this.baseUrl = '';
      throw new Error(ERROR_WRONG_CONFIGURATION);
    }

    this.baseUrl = configuration.get(CONFIG.BASE_URL);

    // prepare config for jira-connector
    let host = this.baseUrl;
    const protocol = host.indexOf('https://') >= 0 ? 'https' : 'http';
    host = host.replace('https://', '').replace('http://', '');
    const portPosition = host.indexOf(':');
    const port = portPosition !== -1 ? host.substring(portPosition + 1) : undefined;

    if (portPosition !== -1) {
      host = host.substring(0, portPosition);
    }

    // Disable all SSL validation for internal networks
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    this.jiraInstance = new jiraClient({
      host,
      port,
      protocol,
      basic_auth: configuration.credentials,
      timeout: configuration.get(CONFIG.REQUESTS_TIMEOUT) * 1000 * 60,
      strictSSL: false, // Always disable SSL validation to support all Jira servers
      rejectUnauthorized: false
    });

    patchJiraInstance(this.jiraInstance);
  }

  async getCloudSession(): Promise<{ name: string; value: string }> {
    if (!this.jiraInstance.cloudSession) {
      const response = await this.customRequest(
        'POST',
        this.baseUrl + '/rest/auth/1/session',
        { Origin: this.baseUrl },
        configuration.credentials
      );
      this.jiraInstance.cloudSession = response.session;
    }
    return this.jiraInstance.cloudSession;
  }

  async search(params: { jql: string; maxResults: number }): Promise<ISearch> {
    // from jira-connector docs
    // The maximum number of issues to return (defaults to 50). The maximum allowable
    // value is dictated by the Jira property 'jira.search.views.default.max'. If you specify a value that is
    // higher than this number, your search results will be truncated.
    return await this.jiraInstance.search.search(params);
  }

  async getStatuses(): Promise<IStatus[]> {
    return await this.jiraInstance.status.getAllStatuses();
  }

  async getProjects(): Promise<IProject[]> {
    let projects = [];
    try {
      projects = await this.jiraInstance.project.getAllProjects({ apiVersion: '3' });
    } catch {
      //
    }
    if (!projects.length) {
      projects = await this.jiraInstance.project.getAllProjects();
    }
    return projects;
  }

  async getIssueByKey(issueKey: string): Promise<IIssue> {
    return await this.jiraInstance.issue.getIssue({ issueKey });
  }

  async getAssignees(project: string): Promise<IAssignee[]> {
    // from jira-connector docs
    // The maximum number of users to return (defaults to 50). The maximum allowed
    // value is 1000. If you specify a value that is higher than this number, your search results will be
    // truncated.
    const maxResults = ASSIGNEES_MAX_RESULTS;
    const assignees = [];
    let startAt = 0;
    let goOn = true;
    while (goOn) {
      const response: IAssignee[] = await this.jiraInstance.user.searchAssignable({ project, maxResults, startAt });
      assignees.push(...response);
      if ((response || []).length < maxResults) {
        goOn = false;
      } else {
        startAt += maxResults;
      }
    }
    return assignees;
  }

  async getTransitions(issueKey: string): Promise<ITransitions> {
    return await this.jiraInstance.issue.getTransitions({ issueKey });
  }

  async setTransition(params: { issueKey: string; transition: ISetTransition }): Promise<void> {
    return await this.jiraInstance.issue.transitionIssue(params);
  }

  async setAssignIssue(params: { issueKey: string; assignee: string }): Promise<void> {
    return await this.jiraInstance.issue.assignIssue(params);
  }

  async addNewComment(params: { issueKey: string; comment: IAddComment }): Promise<IAddCommentResponse> {
    return await this.jiraInstance.issue.addComment({ ...params, body: params.comment.body, properties: params.comment.properties });
  }

  async addWorkLog(params: IAddWorkLog): Promise<void> {
    return await this.jiraInstance.issue.addWorkLog(params);
  }

  async getAllIssueTypes(): Promise<IIssueType[]> {
    return await this.jiraInstance.issueType.getAllIssueTypes();
  }

  async createIssue(params: ICreateIssue): Promise<any> {
    return await this.jiraInstance.issue.createIssue(params);
  }

  async getAllPriorities(): Promise<IPriority[]> {
    return await this.jiraInstance.priority.getAllPriorities();
  }

  async getAllIssueTypesWithFields(project: string): Promise<IIssueType[]> {
    const response = await this.jiraInstance.issue.getCreateMetadata({
      projectKeys: project,
      expand: 'projects.issuetypes.fields',
    } as ICreateMetadata);
    if (!!response.projects && response.projects.length > 0) {
      return response.projects[0].issuetypes;
    }
    return [];
  }

  async customRequest(method: 'GET' | 'POST', uri: string, headers?: {}, body?: {}): Promise<any> {
    return await this.jiraInstance.project.customRequest(method, uri, headers, body);
  }

  async getFavoriteFilters(): Promise<IFavouriteFilter[]> {
    return await this.jiraInstance.filter.getFavoriteFilters();
  }

  async getCreateIssueEpics(projectKey: string, maxResults: number): Promise<ICreateIssueEpic> {
    return await this.customRequest(
      'GET',
      `${this.baseUrl}/rest/greenhopper/1.0/epics?searchQuery=&projectKey=${projectKey}&maxResults=${maxResults || 25}&hideDone=false`
    );
  }

  async getCreateIssueLabels(): Promise<{ suggestions: ILabel[] }> {
    return await this.customRequest('GET', this.baseUrl + '/rest/api/1.0/labels/suggest?query=');
  }

  async getAvailableLinkIssuesType(): Promise<{ issueLinkTypes: IAvailableLinkIssuesType[] }> {
    // TODO - need to manage also opposed types. e.g blocks <-> is blocked by
    return await this.jiraInstance.issueLinkType.getAvailableTypes();
  }

  async getNotifications(lastId: string): Promise<INotifications> {
    const cloudSession = await this.getCloudSession();
    return this.customRequest(
      'GET',
      this.baseUrl +
        `/gateway/api/notification-log/api/2/notifications?direct=true&includeContent=false${!!lastId ? '&after=' + lastId : ''}`,
      {
        cookie: `${cloudSession.name}=${cloudSession.value}`,
        deleteAuth: 'TRUE',
      },
      {}
    );
  }

  async markNotificationsAsReadUnread(payload: IMarkNotificationAsReadUnread): Promise<any> {
    const cloudSession = await this.getCloudSession();
    return this.customRequest(
      'POST',
      this.baseUrl + `/gateway/api/notification-log/api/2/notifications/mark/bulk`,
      {
        cookie: `${cloudSession.name}=${cloudSession.value}`,
        deleteAuth: 'TRUE',
        Origin: this.baseUrl,
      },
      payload
    );
  }

  async getSprints(): Promise<{ allMatches: any[]; suggestions: ISprint[] }> {
    return await this.customRequest('GET', this.baseUrl + '/rest/greenhopper/1.0/sprint/picker');
  }

  /**
   * 서버 정보 조회 - 서버 버전 확인을 위해 추가
   * @returns 서버 정보
   */
  async getServerInfo(): Promise<IServerInfo> {
    try {
      const response = await this.customRequest('GET', this.baseUrl + '/rest/api/2/serverInfo');
      return {
        version: response.version,
        versionNumbers: this.parseVersionNumbers(response.version)
      };
    } catch (error) {
      throw new Error(`서버 정보 조회 실패: ${error.message || error}`);
    }
  }

  /**
   * 서버 버전 호환성 확인
   * 명시적으로 Jira Server 8.x 버전에서만 작동하도록 설정
   * @param version 서버 버전
   * @returns 호환성 여부
   */
  isCompatibleServerVersion(version: string): boolean {
    const versionNumbers = this.parseVersionNumbers(version);
    
    // 메이저 버전이 정확히 8인 경우에만 호환
    if (versionNumbers.length > 0 && versionNumbers[0] === 8) {
      return true;
    }
    return false;
  }

  /**
   * 버전 문자열을 숫자 배열로 파싱
   * @param version 버전 문자열 (예: "8.13.5")
   * @returns 버전 숫자 배열 (예: [8, 13, 5])
   */
  private parseVersionNumbers(version: string): number[] {
    if (!version) {
      return [];
    }
    
    try {
      return version.split('.')
        .map(part => parseInt(part.replace(/[^0-9]/g, ''), 10))
        .filter(num => !isNaN(num));
    } catch (e) {
      return [];
    }
  }
}
