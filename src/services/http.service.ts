import axios, { AxiosInstance } from 'axios';

export default class HttpService {
  private client: AxiosInstance;

  constructor(baseUrl: string, credentials: { username: string, password: string }) {
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
    const response = await this.client.get(path, { params });
    return response.data;
  }

  public async post(path: string, data?: any): Promise<any> {
    const response = await this.client.post(path, data);
    return response.data;
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