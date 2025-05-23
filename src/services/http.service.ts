import axios, { AxiosInstance } from 'axios';

export default class HttpService {
  private client: AxiosInstance;

  constructor(baseUrl: string, credentials: { username: string, password: string }) {
    // JIRA Server/Data Center uses Basic Auth
    this.client = axios.create({
      baseURL: baseUrl,
      auth: {
        username: credentials.username,
        password: credentials.password
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  public async get(path: string, params?: any): Promise<any> {
    try {
      const response = await this.client.get(path, { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error('401 Error Details:', {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          auth: error.config?.auth ? 'Present' : 'Missing'
        });
        throw new Error(`Authentication failed (401). Please check:
1. Username is correct
2. Password/PAT is valid
3. Your account has API access permissions
4. No IP restrictions are blocking access`);
      }
      throw error;
    }
  }

  public async post(path: string, data?: any): Promise<any> {
    try {
      const response = await this.client.post(path, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error('401 Error Details:', {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          auth: error.config?.auth ? 'Present' : 'Missing'
        });
        throw new Error(`Authentication failed (401). Please check:
1. Username is correct
2. Password/PAT is valid
3. Your account has API access permissions
4. No IP restrictions are blocking access`);
      }
      throw error;
    }
  }

  public async put(path: string, data?: any): Promise<any> {
    const response = await this.client.put(path, data);
    return response.data;
  }

  public async delete(path: string): Promise<any> {
    const response = await this.client.delete(path);
    return response.data;
  }
}