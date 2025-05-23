import { IssuesExplorer } from '../explorer/issues-explorer';
import ConfigurationService from './configuration.service';
import JiraService from './jira.service';
import LoggerService from './logger.service';
import SelectValuesService from './select-values.service';
import StoreService from './store.service';

// 서비스 인스턴스 생성
export const store = new StoreService();
export const configuration = new ConfigurationService();
export const logger = new LoggerService();
export const jira = new JiraService();
export const issuesExplorer = new IssuesExplorer();
export const selectValues = new SelectValuesService();
