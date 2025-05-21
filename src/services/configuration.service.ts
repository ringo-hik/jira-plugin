import * as vscode from 'vscode';
import { store } from '.';
import {
  CONFIG,
  CONFIG_COUNTER,
  CONFIG_NAME,
  CONFIG_WORKING_ISSUE,
  DEFAULT_WORKING_ISSUE_ASSIGNEE,
  DEFAULT_WORKING_ISSUE_STATUS,
} from '../shared/constants';
import { IConfiguration } from './configuration.model';
import { IStatus, IWorkingIssue } from './http.model';

export default class ConfigurationService {
  // 플러그인 설정 정보
  private settings: IConfiguration = { ...vscode.workspace.getConfiguration(CONFIG_NAME) };

  /**
   * 설정 유효성 검사
   * @returns 설정이 유효한지 여부
   */
  public isValid(): boolean {
    if (!this.settings) {
      return false;
    }
    const { baseUrl } = this.settings;
    const { username } = this.settings;
    const { password } = this.credentials;

    return !!(baseUrl && username && password);
  }

  /**
   * 자격 증명 정보 가져오기
   * @returns 사용자명과 PAT 토큰(비밀번호 필드 사용)
   */
  public get credentials(): { username: string; password: string } {
    const config = this.settings;
    const credentials: string = (config && this.globalState.get(`${CONFIG_NAME}:${config.baseUrl}`)) || '';
    
    let jsonCredentials = undefined;
    try {
      jsonCredentials = JSON.parse(credentials);
    } catch (e) {
      // JSON 파싱 실패
    }
    
    if (!!jsonCredentials) {
      return jsonCredentials;
    }
    
    return { username: '', password: '' };
  }

  /**
   * 설정값 가져오기
   * @param entry 설정 키
   * @param fallbackValue 기본값
   * @returns 설정값
   */
  public get(entry: string, fallbackValue = ''): any {
    if (!this.settings) {
      return fallbackValue;
    }

    // 하드코딩된 값들 처리
    const hardcodedSettings: {[key: string]: any} = {
      [CONFIG.STRICT_SSL]: 'false', // SSL 검증 항상 비활성화
      [CONFIG.REQUESTS_TIMEOUT]: 5, // 요청 제한 시간 (5분으로 증가)
      [CONFIG.PROJECTS_TO_SHOW]: '', // 빈 값
      [CONFIG.PROJECTS_TO_HIDE]: '', // 빈 값
      [CONFIG.ENABLE_WORKING_ISSUE]: true, // 작업 이슈 기능 활성화
      [CONFIG.WORKING_ISSUE_STATUSES]: DEFAULT_WORKING_ISSUE_STATUS, // 기본 작업 이슈 상태
      [CONFIG.DEFAULT_JQL_SEARCH]: "project = 'WORKING_PROJECT' ORDER BY status ASC, updated DESC",
      [CONFIG.NUMBER_ISSUES_IN_LIST]: 50,
      [CONFIG.TRACKING_TIME_MODE]: 'always',
      [CONFIG.WORKING_ISSUE_ASSIGNEES]: DEFAULT_WORKING_ISSUE_ASSIGNEE
    };

    // 하드코딩된 값이 있으면 그것을 반환
    if (hardcodedSettings.hasOwnProperty(entry)) {
      return hardcodedSettings[entry];
    }

    // 기본 설정에서 값 가져오기
    return this.settings.hasOwnProperty(entry) && this.settings[entry] !== undefined 
      ? this.settings[entry] 
      : fallbackValue;
  }

  /**
   * 설정값 저장
   * @param entry 설정 키
   * @param value 설정값
   * @returns 설정 저장 결과
   */
  public async set(entry: string, value: any): Promise<any> {
    // 하드코딩된 값들은 저장하지 않음
    const hardcodedSettings = [
      CONFIG.STRICT_SSL,
      CONFIG.REQUESTS_TIMEOUT,
      CONFIG.PROJECTS_TO_SHOW,
      CONFIG.PROJECTS_TO_HIDE,
      CONFIG.ENABLE_WORKING_ISSUE,
      CONFIG.WORKING_ISSUE_STATUSES,
      CONFIG.DEFAULT_JQL_SEARCH,
      CONFIG.NUMBER_ISSUES_IN_LIST,
      CONFIG.TRACKING_TIME_MODE,
      CONFIG.WORKING_ISSUE_ASSIGNEES
    ];

    // 하드코딩된 설정인 경우 메모리에만 업데이트하고 저장하지 않음
    if (hardcodedSettings.includes(entry)) {
      (<any>this.settings)[entry] = value;
      return Promise.resolve();
    }

    // 입력값 처리
    value = this.preprocessValue(entry, value);

    // 메모리에 설정 업데이트
    (<any>this.settings)[entry] = value;

    // 적절한 스코프 결정 (워크스페이스 vs 글로벌)
    const isGlobalSetting = this.shouldUseGlobalScope(entry);

    // VS Code 설정에 저장
    return this.settings && this.settings.update(entry, value, isGlobalSetting);
  }

  /**
   * 입력값 전처리
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

  /**
   * PAT 토큰 저장 (비밀번호 필드 사용)
   * @param password PAT 토큰
   * @returns 저장 결과
   */
  public async setPassword(password: string | undefined): Promise<void> {
    const config = this.settings;
    return (
      config &&
      this.globalState.update(
        `${CONFIG_NAME}:${config.baseUrl}`, 
        JSON.stringify({ 
          username: config.username, 
          password: password || '' 
        })
      )
    );
  }

  /**
   * VS Code 글로벌 상태 저장소
   */
  public get globalState(): vscode.Memento {
    return store.state.context.globalState;
  }

  /**
   * 현재 작업 이슈 정보 저장
   * @param workingIssue 작업 이슈 정보
   */
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

  /**
   * 현재 작업 이슈 정보 가져오기
   * @returns 작업 이슈 정보
   */
  public getGlobalWorkingIssue(): any {
    const config = this.settings;
    return config && this.globalState.get(`${CONFIG_NAME}:${config.baseUrl}:${CONFIG_WORKING_ISSUE}:${config.workingProject}`);
  }

  /**
   * 글로벌 카운터 설정
   * @param count 카운터 값
   */
  public setGlobalCounter(count: number): Thenable<void> {
    return this.globalState.update(`${CONFIG_NAME}:${CONFIG_COUNTER}`, count);
  }

  /**
   * 글로벌 카운터 가져오기
   * @returns 카운터 값
   */
  public getGlobalCounter(): any {
    return this.globalState.get(`${CONFIG_NAME}:${CONFIG_COUNTER}`);
  }

  /**
   * 작업 이슈 상태 목록 가져오기
   * @param statuses 상태 목록
   * @returns 상태 목록 문자열
   */
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

  /**
   * 필요한 경우 값에 따옴표 추가
   */
  private quoteValueIfNeeded(assignee: string): string {
    const isQuoteNeeded = assignee !== 'currentUser()' && assignee.indexOf('membersOf(') === -1;
    return isQuoteNeeded ? `'${assignee}'` : assignee;
  }

  /**
   * 작업 이슈 담당자 목록 가져오기
   * @returns 담당자 목록 문자열
   */
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