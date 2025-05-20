import * as vscode from 'vscode';
import { store } from '.';
import {
  CONFIG,
  CONFIG_COUNTER,
  CONFIG_NAME,
  CONFIG_WORKING_ISSUE,
  CREDENTIALS_SEPARATOR,
  DEFAULT_WORKING_ISSUE_ASSIGNEE,
  DEFAULT_WORKING_ISSUE_STATUS,
} from '../shared/constants';
import { IConfiguration } from './configuration.model';
import { IStatus, IWorkingIssue } from './http.model';

export default class ConfigurationService {
  // all the plugin settings
  private settings: IConfiguration = { ...vscode.workspace.getConfiguration(CONFIG_NAME) };

  public isValid(): boolean {
    if (!this.settings) {
      return false;
    }
    const { baseUrl } = this.settings;
    const { username } = this.settings;
    const { password } = this.credentials;

    return !!(baseUrl && username && password);
  }

  public get credentials(): { username: string; password: string } {
    const config = this.settings;
    const credentials: string = (config && this.globalState.get(`${CONFIG_NAME}:${config.baseUrl}`)) || '';
    let jsonCredentials = undefined;
    try {
      jsonCredentials = JSON.parse(credentials);
    } catch (e) {
      //
    }
    if (!!jsonCredentials) {
      return jsonCredentials;
    }
    return this.OLD_credentials;
  }

  // DEPRECATED
  public get OLD_credentials(): { username: string; password: string } {
    const config = this.settings;
    const credentials: string = (config && this.globalState.get(`${CONFIG_NAME}:${config.baseUrl}`)) || '';
    const [username = '', password = ''] = credentials.split(CREDENTIALS_SEPARATOR);
    return { username, password };
  }

  /**
   * 설정값 가져오기 (추상화된 메서드)
   * @param entry 설정 키 또는 메타데이터
   * @param fallbackValue 기본값
   * @returns 설정값
   */
  public get(entry: string, fallbackValue = ''): any {
    if (!this.settings) {
      return fallbackValue;
    }
    
    // 특수 설정 처리 (하드코딩된 값이 필요한 경우)
    if (entry === CONFIG.STRICT_SSL) {
      return "false"; // SSL 인증 항상 비활성화
    }
    
    // 일반 설정 가져오기
    return this.settings.hasOwnProperty(entry) && this.settings[entry] !== undefined 
      ? this.settings[entry] 
      : fallbackValue;
  }

  /**
   * 설정값 저장 (추상화된 메서드)
   * @param entry 설정 키 또는 메타데이터
   * @param value 설정값
   * @returns 설정 저장 결과
   */
  public async set(entry: string, value: any): Promise<any> {
    // 입력값 전처리
    value = this.preprocessValue(entry, value);
    
    // 메모리에 설정 업데이트
    (<any>this.settings)[entry] = value;
    
    // 적절한 스코프 결정 (워크스페이스 vs 글로벌)
    const isGlobalSetting = this.shouldUseGlobalScope(entry);
    
    // VS Code 설정에 저장
    return this.settings && this.settings.update(entry, value, isGlobalSetting);
  }
  
  /**
   * 입력값 전처리 (값 정규화/정리)
   * @param entry 설정 키
   * @param value 원본 값
   * @returns 처리된 값
   */
  private preprocessValue(entry: string, value: any): any {
    // URL 입력값 정리 (끝의 슬래시 제거)
    if (entry === CONFIG.BASE_URL && typeof value === 'string') {
      return value.replace(/\/$/, '');
    }
    
    return value;
  }
  
  /**
   * 글로벌 스코프 사용 여부 결정
   * @param entry 설정 키
   * @returns 글로벌 스코프 사용 여부
   */
  private shouldUseGlobalScope(entry: string): boolean {
    // 워크스페이스 레벨의 설정인지 확인
    const isWorkspaceLevel = entry === CONFIG.WORKING_PROJECT;
    // 워크스페이스가 열려있는지 확인
    const hasWorkspace = !!vscode.workspace.workspaceFolders;
    
    // 워크스페이스 레벨 설정이고 워크스페이스가 열려있는 경우에만 워크스페이스 스코프 사용
    return !isWorkspaceLevel || !hasWorkspace;
  }

  // set inside VS Code local storage the settings
  public async setPassword(password: string | undefined): Promise<void> {
    const config = this.settings;
    return (
      config &&
      this.globalState.update(`${CONFIG_NAME}:${config.baseUrl}`, JSON.stringify({ username: config.username, password: password || '' }))
    );
  }

  // get inside VS Code local storage the settings
  public get globalState(): vscode.Memento {
    return store.state.context.globalState;
  }

  // set inside VS Code local storage the last working issue
  // used for remember last working issue if the user close VS Code without stop the tracking
  public async setGlobalWorkingIssue(workingIssue: IWorkingIssue | undefined): Promise<void> {
    const config = this.settings;
    return (
      config &&
      this.globalState.update(
        `${CONFIG_NAME}:${config.baseUrl}:${CONFIG_WORKING_ISSUE}:${config.workingProject}`,
        !!workingIssue ? JSON.stringify(workingIssue) : undefined
      )
    );
  }

  // get inside VS Code local storage the last working issue
  public getGlobalWorkingIssue(): any {
    const config = this.settings;
    return config && this.globalState.get(`${CONFIG_NAME}:${config.baseUrl}:${CONFIG_WORKING_ISSUE}:${config.workingProject}`);
  }

  public setGlobalCounter(count: number): Thenable<void> {
    return this.globalState.update(`${CONFIG_NAME}:${CONFIG_COUNTER}`, count);
  }

  public getGlobalCounter(): any {
    return this.globalState.get(`${CONFIG_NAME}:${CONFIG_COUNTER}`);
  }

  public workingIssueStatuses(statuses?: IStatus[]): string {
    let statusList = (this.get(CONFIG.WORKING_ISSUE_STATUSES) || DEFAULT_WORKING_ISSUE_STATUS)
      .split(',')
      .map((status: string) => status.trim())
      .filter((status: string) =>
        (statuses || store.state.statuses).some((stateStatus) => stateStatus.name.toLowerCase() === status.toLowerCase())
      );
    return statusList && statusList.length > 0
      ? statusList.reduce((a: string, b: string) => (a === '' ? a + `'${b}'` : `${a},'${b}'`), '')
      : `'${DEFAULT_WORKING_ISSUE_STATUS}'`;
  }

  private quoteValueIfNeeded(assignee: string): string {
    const isQuoteNeeded = assignee !== 'currentUser()' && assignee.indexOf('membersOf(') === -1;
    return isQuoteNeeded ? `'${assignee}'` : assignee;
  }

  public workingIssueAssignees(): string {
    let assignees = (this.get(CONFIG.WORKING_ISSUE_ASSIGNEES).toString() || DEFAULT_WORKING_ISSUE_ASSIGNEE)
      .split(',')
      .map((status: string) => status.replace(/CURRENT_USER/g, 'currentUser()').trim());

    return assignees && assignees.length > 0
      ? assignees.reduce((a: string, b: string, index: number) => {
          const quotedB = this.quoteValueIfNeeded(b);
          return index === 0 ? `${quotedB}` : `${a},${quotedB}`;
        }, '')
      : DEFAULT_WORKING_ISSUE_ASSIGNEE;
  }
}
