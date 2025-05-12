interface IRequestInterceptor {
    intercept(url: string | URL, options?: RequestInit): RequestInit
}

interface IResponseInterceptor {
    intercept<R = any>(response: Response): R
}

interface IFetchClient {
    post<T = any, R = Response>(url: string | URL, data?: T, options?: Omit<RequestInit, 'body' | 'method'>): Promise<R>

    get<R = Response>(url: string | URL, options?: Omit<RequestInit, 'body' | 'method'>): Promise<R>

    delete<T = any, R = Response>(url: string | URL, data?: T, options?: Omit<RequestInit, 'body' | 'method'>): Promise<R>

    put<T = any, R = Response>(url: string | URL, data?: T, options?: Omit<RequestInit, 'body' | 'method'>): Promise<R>

    patch<T = any, R = Response>(url: string | URL, data?: T, options?: Omit<RequestInit, 'body' | 'method'>): Promise<R>

    setDefaults(defaults: Partial<Omit<RequestInit, 'body' | 'method'>>): void

    setRequestInterceptor(interceptor: IRequestInterceptor): void

    setResponseInterceptor(interceptor: IResponseInterceptor): void

    stream(): Promise<string | undefined>

    abort(msg?: string): boolean
}

export {
    IFetchClient,
    IRequestInterceptor,
    IResponseInterceptor,
}