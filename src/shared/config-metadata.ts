/**
 * 설정 메타데이터 정의 파일
 * 모든 설정의 메타데이터를 중앙에서 관리합니다.
 */
import { CONFIG, DEFAULT_WORKING_ISSUE_STATUS } from './constants';
import { ConfigGroup, ConfigScope, IConfigMetadata } from '../services/configuration.model';

/**
 * 설정 메타데이터 정의
 * 모든 플러그인 설정에 대한 메타데이터를 여기서 정의합니다.
 * 사용자가 설정할 필수 항목만 남기고 나머지는 하드코딩합니다.
 */
export const CONFIG_METADATA: IConfigMetadata[] = [
  // 연결 설정 그룹 - 필수 항목만 유지
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
    },
  },
  {
    key: CONFIG.USERNAME,
    group: ConfigGroup.CONNECTION,
    scope: ConfigScope.GLOBAL,
    defaultValue: '',
    required: true,
    displayName: 'Jira 사용자 이름',
    description: 'Jira 로그인에 사용하는 사용자 이름 또는 이메일',
    type: 'string',
  },
  
  // 프로젝트 설정 그룹 - 작업 프로젝트만 유지
  {
    key: CONFIG.WORKING_PROJECT,
    group: ConfigGroup.PROJECT,
    scope: ConfigScope.WORKSPACE,
    defaultValue: '',
    displayName: '작업 프로젝트',
    description: '기본 작업 프로젝트 키',
    type: 'string',
  }
];

/**
 * 설정 키로 메타데이터 검색
 * @param key 설정 키
 * @returns 설정 메타데이터
 */
export function getConfigMetadata(key: string): IConfigMetadata | undefined {
  return CONFIG_METADATA.find((meta) => meta.key === key);
}

/**
 * 설정 그룹으로 메타데이터 필터링
 * @param group 설정 그룹
 * @returns 설정 메타데이터 배열
 */
export function getConfigMetadataByGroup(group: ConfigGroup): IConfigMetadata[] {
  return CONFIG_METADATA.filter((meta) => meta.group === group);
}

// No additional imports needed - already imported at the top
