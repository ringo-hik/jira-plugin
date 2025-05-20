import { WorkspaceConfiguration } from 'vscode';

/**
 * 설정 접근 방식 
 * - WORKSPACE: 워크스페이스 설정 (프로젝트별)
 * - GLOBAL: 전역 설정 (사용자 수준)
 * - SECURE: 보안이 필요한 데이터 (암호화 저장)
 */
export enum ConfigScope {
  WORKSPACE = 'workspace',
  GLOBAL = 'global',
  SECURE = 'secure'
}

/**
 * 기본 설정 유형 (추상화)
 */
export interface IConfigurationEntry {
  key: string;         // 설정 키
  defaultValue: any;   // 기본값
  scope: ConfigScope;  // 설정 범위
  required?: boolean;  // 필수 여부
  validator?: (value: any) => boolean;  // 유효성 검사기
}

/**
 * 확장 설정 인터페이스
 */
export interface IConfiguration extends WorkspaceConfiguration {
  baseUrl?: string;
  username?: string;
  workingProject?: string;
  enableWorkingIssue?: boolean;
  trackingTimeMode?: string;
  trackingTimeModeHybridTimeout?: number;
  worklogMinimumTrackingTim?: number;
}

/**
 * 설정 그룹 (카테고리) 정의
 */
export enum ConfigGroup {
  CONNECTION = 'connection',
  PROJECT = 'project',
  ISSUE = 'issue',
  DISPLAY = 'display'
}

/**
 * 설정 메타데이터
 */
export interface IConfigMetadata {
  key: string;             // 설정 키
  group: ConfigGroup;      // 설정 그룹
  scope: ConfigScope;      // 저장 범위
  defaultValue: any;       // 기본값
  required?: boolean;      // 필수 여부
  displayName?: string;    // 표시 이름
  description?: string;    // 설명
  placeholder?: string;    // 입력 필드 플레이스홀더
  type?: string;           // 설정 타입 (string, boolean, number 등)
  options?: any[];         // 선택 옵션 (enum 타입)
  validator?: (value: any) => boolean;  // 유효성 검사기
}

export interface IPickValue {
  pickValue: any;
  label: any;
  description: any;
}
