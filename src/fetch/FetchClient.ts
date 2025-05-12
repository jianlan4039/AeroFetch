import type { IFetchClient, RequestInterceptor, ResponseInterceptor } from './types/';

class FetchClient implements IFetchClient {
  private defaults: Partial<Omit<RequestInit, 'body' | 'method'>> = {};
  private abortController = new AbortController();
  private requestInterceptor: RequestInterceptor | undefined;
  private responseInterceptor: ResponseInterceptor | undefined;

  constructor(config?: Partial<Omit<RequestInit, 'body' | 'method'>>) {
    this.defaults = {
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      ...config,
    };
    this.defaults.signal = this.abortController.signal;
  }

  abort(msg?: string): boolean {
    try {
      this.abortController.abort(msg);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async request(url: string | URL, options?: RequestInit): Promise<any> {
    let requestOptions = {
      ...this.defaults,
      ...options,
    };

    if (this.requestInterceptor) {
      requestOptions = this.requestInterceptor(url, options);
    }

    try {
      let response = await fetch(url, requestOptions);

      if (this.responseInterceptor) {
        return this.responseInterceptor(response);
      }

      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error; // 或者根据需求返回一个默认值或错误响应
    }
  }

  delete(url: string | URL, options?: Omit<RequestInit, 'body' | 'method'>): Promise<any> {
    return this.request(url, {
      method: 'DELETE',
      ...options,
    });
  }

  get(url: string | URL, options?: Omit<RequestInit, 'body' | 'method'>): Promise<any> {
    return this.request(url, {
      method: 'GET',
      ...options,
    });
  }

  patch<T = any>(url: string | URL, data?: T, options?: Omit<RequestInit, 'body' | 'method'>): Promise<any> {
    return this.request(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  }

  post<T = any>(url: string | URL, data?: T, options?: Omit<RequestInit, 'body' | 'method'>): Promise<any> {
    return this.request(url, {
      body: JSON.stringify(data),
      method: 'POST',
      ...options,
    });
  }

  put<T = any>(url: string | URL, data?: T, options?: Omit<RequestInit, 'body' | 'method'>): Promise<any> {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  setDefaults(defaults: Partial<Omit<RequestInit, 'body' | 'method'>>): void {
    this.defaults = { ...this.defaults, ...defaults };
  }

  setRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptor = interceptor;
  }

  setResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptor = interceptor;
  }
}

export default FetchClient;
