import axios, { AxiosInstance } from 'axios';

export default class HttpService {
  private client: AxiosInstance;

  constructor(baseUrl: string, credentials: { username: string, password: string }) {
    // Check if using Atlassian Cloud (PAT as Bearer token) or Server (Basic Auth)
    const isCloud = baseUrl.includes('atlassian.net');
    
    const headers: any = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    // For Atlassian Cloud, use email + PAT as Basic Auth
    // For Server/Data Center, use username + password/PAT as Basic Auth
    if (isCloud) {
      // Atlassian Cloud uses email + API token as Basic Auth
      const authString = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
      headers['Authorization'] = `Basic ${authString}`;
      
      this.client = axios.create({
        baseURL: baseUrl,
        headers,
        timeout: 30000
      });
    } else {
      // JIRA Server/Data Center uses standard Basic Auth
      this.client = axios.create({
        baseURL: baseUrl,
        auth: {
          username: credentials.username,
          password: credentials.password
        },
        headers,
        timeout: 30000
      });
    }
  }

  public async get(path: string, params?: any): Promise<any> {
    try {
      const response = await this.client.get(path, { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your username and PAT/password.');
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
        throw new Error('Authentication failed. Please check your username and PAT/password.');
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