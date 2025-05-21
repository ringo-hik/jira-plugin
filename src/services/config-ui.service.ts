/**
 * 설정 UI 서비스
 * 설정 UI를 추상화하여 제공하는 서비스
 */

import * as vscode from 'vscode';
import { configuration } from '.';
import { ConfigGroup, IConfigMetadata } from './configuration.model';
import { getConfigMetadataByGroup } from '../shared/config-metadata';

// 기본 설정 관련 상수
const BASIC_SETTINGS_ONLY = true; // 기본 설정만 사용

/**
 * 설정 UI 서비스
 */
export class ConfigUIService {
  /**
   * 설정 그룹에 대한 UI 표시
   * @param group 설정 그룹
   * @returns 설정 완료 여부
   */
  public async showGroupSettings(group: ConfigGroup): Promise<boolean> {
    // 기본 설정 그룹만 표시
    if (BASIC_SETTINGS_ONLY && group !== ConfigGroup.CONNECTION && group !== ConfigGroup.PROJECT) {
      // 기본 연결/프로젝트 그룹이 아닌 경우 이미 설정됨으로 처리
      return true;
    }
    
    const configItems = getConfigMetadataByGroup(group);
    if (configItems.length === 0) {
      // 그룹에 설정 항목이 없으면 이미 설정됨으로 처리
      return true;
    }
    
    const results = await this.collectSettingsFromUser(configItems);

    if (results === null) {
      return false; // 사용자가 취소함
    }

    // 수집된 설정값 저장
    await this.saveSettings(results);
    return true;
  }

  /**
   * 단일 설정 항목에 대한 UI 표시
   * @param configItem 설정 메타데이터
   * @returns 설정값 또는 undefined(사용자 취소)
   */
  public async showSingleSetting(configItem: IConfigMetadata): Promise<any | undefined> {
    const currentValue = configuration.get(configItem.key, configItem.defaultValue);

    // 설정 유형에 따른 UI 분기
    switch (configItem.type) {
      case 'boolean':
        return this.showBooleanSetting(configItem, !!currentValue);

      case 'enum':
        return this.showEnumSetting(configItem, currentValue);

      case 'number':
        return this.showNumberSetting(configItem, currentValue);

      case 'password':
        return this.showPasswordSetting(configItem);

      case 'string':
      default:
        return this.showStringSetting(configItem, currentValue);
    }
  }

  /**
   * 여러 설정 항목에 대한 값 수집
   * @param configItems 설정 메타데이터 배열
   * @returns 설정 키-값 쌍 객체 또는 null(사용자 취소)
   */
  private async collectSettingsFromUser(configItems: IConfigMetadata[]): Promise<Record<string, any> | null> {
    const results: Record<string, any> = {};

    for (const item of configItems) {
      const value = await this.showSingleSetting(item);

      // 사용자가 취소한 경우
      if (value === undefined) {
        if (item.required) {
          return null; // 필수 항목이면 전체 취소
        }
        continue; // 선택 항목이면 다음으로
      }

      results[item.key] = value;
    }

    return results;
  }

  /**
   * 수집된 설정값 저장
   * @param settings 설정 키-값 쌍 객체
   */
  private async saveSettings(settings: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await configuration.set(key, value);
    }
  }

  /**
   * 문자열 설정 UI 표시
   */
  private async showStringSetting(configItem: IConfigMetadata, currentValue: string): Promise<string | undefined> {
    return vscode.window.showInputBox({
      prompt: configItem.description || configItem.displayName,
      placeHolder: configItem.placeholder || '',
      value: currentValue,
      validateInput: configItem.validator ? (value) => (configItem.validator!(value) ? null : '유효하지 않은 값입니다.') : undefined,
    });
  }

  /**
   * 숫자 설정 UI 표시
   */
  private async showNumberSetting(configItem: IConfigMetadata, currentValue: number): Promise<number | undefined> {
    const result = await vscode.window.showInputBox({
      prompt: configItem.description || configItem.displayName,
      placeHolder: configItem.placeholder || '',
      value: currentValue.toString(),
      validateInput: (value) => {
        const num = Number(value);
        if (isNaN(num)) {
          return '숫자를 입력해주세요.';
        }
        return null;
      },
    });

    return result !== undefined ? Number(result) : undefined;
  }

  /**
   * 비밀번호 설정 UI 표시
   */
  private async showPasswordSetting(configItem: IConfigMetadata): Promise<string | undefined> {
    return vscode.window.showInputBox({
      prompt: configItem.description || configItem.displayName,
      placeHolder: configItem.placeholder || '',
      password: true,
    });
  }

  /**
   * 불리언 설정 UI 표시
   */
  private async showBooleanSetting(configItem: IConfigMetadata, currentValue: boolean): Promise<boolean | undefined> {
    const result = await vscode.window.showQuickPick(
      [
        { label: '활성화', description: '기능 활성화', picked: currentValue },
        { label: '비활성화', description: '기능 비활성화', picked: !currentValue },
      ],
      { placeHolder: configItem.description || configItem.displayName }
    );

    return result ? result.label === '활성화' : undefined;
  }

  /**
   * 열거형 설정 UI 표시
   */
  private async showEnumSetting(configItem: IConfigMetadata, currentValue: string): Promise<string | undefined> {
    if (!configItem.options || configItem.options.length === 0) {
      return this.showStringSetting(configItem, currentValue);
    }

    const options = configItem.options.map((opt) => ({
      label: opt.label,
      description: opt.description,
      picked: opt.label === currentValue,
    }));

    const result = await vscode.window.showQuickPick(options, { placeHolder: configItem.description || configItem.displayName });

    return result ? result.label : undefined;
  }
}

// 서비스 인스턴스 생성
export const configUI = new ConfigUIService();
