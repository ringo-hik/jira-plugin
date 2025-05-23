import { configuration, logger } from '.';
import HttpService from './http.service';
import { CONFIG } from '../shared/constants';

export default class JiraService {
  private httpService: HttpService | null = null;
  private baseUrl: string = '';
  private username: string = '';

  public isInitialized(): boolean {
    return this.httpService !== null;
  }

  public async initialize(): Promise<void> {
    try {
      this.baseUrl = configuration.get(CONFIG.BASE_URL);
      this.username = configuration.get(CONFIG.USERNAME);
      const password = configuration.getPassword();

      if (!this.baseUrl || !this.username || !password) {
        throw new Error('Missing JIRA configuration');
      }

      this.httpService = new HttpService(this.baseUrl, {
        username: this.username,
        password: password
      });

      // Test connection
      await this.httpService.get('/rest/api/2/myself');
      logger.printInfoMessageInOutput('JIRA connection established');
    } catch (error) {
      this.httpService = null;
      throw error;
    }
  }

  public async search(params: { jql: string, maxResults?: number }): Promise<any> {
    if (!this.httpService) {
      throw new Error('JIRA service not initialized');
    }

    const searchParams = {
      jql: params.jql,
      maxResults: params.maxResults || 50,
      fields: ['key', 'summary', 'status', 'assignee', 'priority', 'issuetype', 'created', 'updated']
    };

    return await this.httpService.post('/rest/api/2/search', searchParams);
  }
}