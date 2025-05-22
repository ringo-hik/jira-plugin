export const CONFIG_NAME = 'jira-plugin';
export const CONFIG_WORKING_ISSUE = 'working-issue';
export const CONFIG_COUNTER = 'counter';

// 단순화된 필수 설정만 유지
export const CONFIG = {
  BASE_URL: 'baseUrl',
  USERNAME: 'username',
  WORKING_PROJECT: 'workingProject',
  // 기본 기능 설정 (하드코딩)
  ENABLE_WORKING_ISSUE: 'enableWorkingIssue',
  NUMBER_ISSUES_IN_LIST: 'numberOfIssuesInList',
  DEFAULT_JQL_SEARCH: 'defaultJqlSearch',
  WORKING_ISSUE_STATUSES: 'workingIssueStatues',
  WORKING_ISSUE_ASSIGNEES: 'workingIssueAssignees',
  TRACKING_TIME_MODE: 'trackingTimeMode',
  REQUESTS_TIMEOUT: 'requestsTimeout',
  STRICT_SSL: 'strictSSL',
};

export const DEFAULT_WORKING_ISSUE_STATUS = 'In Progress';
export const DEFAULT_WORKING_ISSUE_ASSIGNEE = 'currentUser()';

// 기본 JQL 검색 쿼리
export const DEFAULT_JQL = "project = 'WORKING_PROJECT' ORDER BY status ASC, updated DESC";

// 트래킹 시간 모드
export const TRACKING_TIME_MODE = {
  ALWAYS: 'always',
  NEVER: 'never',
};

// 모달 응답
export const ACTIONS = {
  YES: 'Yes',
  NO: 'No',
  CLOSE: 'Close',
  OPEN_ISSUE: 'Open issue',
};

// 검색 모드 (단순화)
export const SEARCH_MODE = {
  DEFAULT: 'DEFAULT',
  ALL: 'ALL',
  ID: 'ID',
  STATUS: 'STATUS',
  REFRESH: 'REFRESH',
};

// 상태 아이콘
export const STATUS_ICONS = {
  OPEN: { text: 'OPEN', icon: '$(beaker)', file: 'beaker.png' },
  PROGRESS: { text: 'PROGRESS', icon: '$(flame)', file: 'flame.png' },
  RESOLVE: { text: 'RESOLVE', icon: '$(check)', file: 'check.png' },
  CLOSE: { text: 'CLOSE', icon: '$(x)', file: 'x.png' },
  DEFAULT: { text: 'DEFAULT', icon: '$(info)', file: 'info.png' },
};

export const LOADING = { text: 'LOADING', file: 'cloud.png' };
export const UNASSIGNED = 'Unassigned';
export const NO_WORKING_ISSUE = { text: 'No working issue', key: 'NO_WORKING_ISSUE' };
export const ERROR_WRONG_CONFIGURATION = 'Wrong configuration';

// 최대 결과 수 제한
export const SEARCH_MAX_RESULTS = 100;
export const ASSIGNEES_MAX_RESULTS = 100;

// 그룹핑 필드 (단순화)
export const GROUP_BY_FIELDS = {
  STATUS: { label: 'Status', value: 'status' },
  ASSIGNEE: { label: 'Assignee', value: 'assignee' },
  TYPE: { label: 'Type', value: 'issuetype' },
};