type RequestInterceptor = (url: string | URL, options?: RequestInit) => RequestInit;
type ResponseInterceptor<R = any> = (response: Response) => R;

interface IFetchClient {
  post<T = any>(url: string | URL, data?: T, options?: Omit<RequestInit, 'body' | 'method'>): Promise<any>;

  get<R = Response>(url: string | URL, options?: Omit<RequestInit, 'body' | 'method'>): Promise<R>;

  delete(url: string | URL, options?: Omit<RequestInit, 'body' | 'method'>): Promise<any>;

  put<T = any>(url: string | URL, data?: T, options?: Omit<RequestInit, 'body' | 'method'>): Promise<any>;

  patch<T = any>(url: string | URL, data?: T, options?: Omit<RequestInit, 'body' | 'method'>): Promise<any>;

  setDefaults(defaults: Partial<Omit<RequestInit, 'body' | 'method'>>): void;

  setRequestInterceptor(interceptor: RequestInterceptor): void;

  setResponseInterceptor(interceptor: ResponseInterceptor): void;

  abort(msg?: string): boolean;
}

export { IFetchClient, RequestInterceptor, ResponseInterceptor };