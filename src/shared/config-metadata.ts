/**
 * 설정 메타데이터 정의 파일
 * 모든 설정의 메타데이터를 중앙에서 관리합니다.
 */
import { CONFIG } from './constants';
import { ConfigGroup, ConfigScope, IConfigMetadata } from '../services/configuration.model';

/**
 * 설정 메타데이터 정의
 * 모든 플러그인 설정에 대한 메타데이터를 여기서 정의합니다.
 */
export const CONFIG_METADATA: IConfigMetadata[] = [
  // 연결 설정 그룹
  {
    key: CONFIG.BASE_URL,
    group: ConfigGroup.CONNECTION,
    scope: ConfigScope.GLOBAL,
    defaultValue: '',
    required: true,
    displayName: 'Jira 서버 URL',
    description: 'Jira 서버의 기본 URL',
    placeholder: 'https://your-company.atlassian.net',
    type: 'string',
    validator: (value: string) => {
      // URL 유효성 검사 (간단한 형태)
      return !!value && (value.startsWith('http://') || value.startsWith('https://'));
    }
  },
  {
    key: CONFIG.USERNAME,
    group: ConfigGroup.CONNECTION,
    scope: ConfigScope.GLOBAL,
    defaultValue: '',
    required: true,
    displayName: 'Jira 사용자 이름',
    description: 'Jira 로그인에 사용하는 사용자 이름 또는 이메일',
    type: 'string'
  },
  {
    key: CONFIG.STRICT_SSL,
    group: ConfigGroup.CONNECTION,
    scope: ConfigScope.GLOBAL,
    defaultValue: 'false',
    displayName: 'SSL 인증 검증',
    description: '인증서 문제가 있는 경우 false로 설정',
    type: 'enum',
    options: [
      { label: 'true', description: 'SSL 인증서 유효성 검사 활성화' },
      { label: 'false', description: 'SSL 인증서 유효성 검사 비활성화' }
    ]
  },
  {
    key: CONFIG.REQUESTS_TIMEOUT,
    group: ConfigGroup.CONNECTION,
    scope: ConfigScope.GLOBAL,
    defaultValue: 1,
    displayName: '요청 제한 시간',
    description: 'Jira 요청 제한 시간 (분)',
    type: 'number'
  },
  
  // 프로젝트 설정 그룹
  {
    key: CONFIG.WORKING_PROJECT,
    group: ConfigGroup.PROJECT,
    scope: ConfigScope.WORKSPACE,
    defaultValue: '',
    displayName: '작업 프로젝트',
    description: '기본 작업 프로젝트 키',
    type: 'string'
  },
  {
    key: CONFIG.PROJECTS_TO_SHOW,
    group: ConfigGroup.PROJECT,
    scope: ConfigScope.GLOBAL,
    defaultValue: '',
    displayName: '표시할 프로젝트',
    description: '표시할 프로젝트 키 (쉼표로 구분)',
    type: 'string'
  },
  {
    key: CONFIG.PROJECTS_TO_HIDE,
    group: ConfigGroup.PROJECT,
    scope: ConfigScope.GLOBAL,
    defaultValue: '',
    displayName: '숨길 프로젝트',
    description: '숨길 프로젝트 키 (쉼표로 구분)',
    type: 'string'
  },
  
  // 작업 이슈 설정 그룹
  {
    key: CONFIG.ENABLE_WORKING_ISSUE,
    group: ConfigGroup.ISSUE,
    scope: ConfigScope.GLOBAL,
    defaultValue: true,
    displayName: '작업 이슈 활성화',
    description: '작업 이슈 기능 활성화',
    type: 'boolean'
  },
  {
    key: CONFIG.WORKING_ISSUE_STATUSES,
    group: ConfigGroup.ISSUE,
    scope: ConfigScope.GLOBAL,
    defaultValue: DEFAULT_WORKING_ISSUE_STATUS,
    displayName: '작업 이슈 상태',
    description: '작업 이슈 목록에 표시할 상태 (쉼표로 구분)',
    type: 'string'
  }
];

/**
 * 설정 키로 메타데이터 검색
 * @param key 설정 키
 * @returns 설정 메타데이터
 */
export function getConfigMetadata(key: string): IConfigMetadata | undefined {
  return CONFIG_METADATA.find(meta => meta.key === key);
}

/**
 * 설정 그룹으로 메타데이터 필터링
 * @param group 설정 그룹
 * @returns 설정 메타데이터 배열
 */
export function getConfigMetadataByGroup(group: ConfigGroup): IConfigMetadata[] {
  return CONFIG_METADATA.filter(meta => meta.group === group);
}

// 상수 import
import { DEFAULT_WORKING_ISSUE_STATUS } from './constants';