import type { IFetchClient, RequestInterceptor, ResponseInterceptor, FetchEvents, EventListener } from './types/';

class FetchClient implements IFetchClient, FetchEvents {
  private defaults: Partial<Omit<RequestInit, 'body' | 'method'>> = {};
  private abortController = new AbortController();
  private requestInterceptor: RequestInterceptor | undefined;
  private responseInterceptor: ResponseInterceptor | undefined;
  private events = new Map<string, EventListener[]>();

  on(event: string, listener: EventListener): void {
    const listeners = this.events.get(event) || [];
    listeners.push(listener);
    this.events.set(event, listeners);
  }

  off(event: string, listener?: EventListener): void {
    if (!listener) {
      this.events.delete(event);
      return;
    }
    const listeners = this.events.get(event) || [];
    this.events.set(
      event,
      listeners.filter((l) => l !== listener)
    );
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.events.get(event) || [];
    listeners.forEach((listener) => {
      try {
        listener(...args);
      } catch (e) {
        console.error(`Event handler error for ${event}:`, e);
      }
    });
  }

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

    this.emit('optionsAssembled', requestOptions);

    if (this.requestInterceptor) {
      requestOptions = this.requestInterceptor(url, options);
      this.emit('requestIntercepted', requestOptions);
    }

    try {
      let response = await fetch(url, requestOptions);
      this.emit('responseReceived', response);

      if (this.responseInterceptor) {
        const interceptedResponse = this.responseInterceptor(response);
        this.emit('responseIntercepted', interceptedResponse);
      }

      return response;
    } catch (error) {
      console.error('Request failed:', error);
      this.emit('requestFailed', error);
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
