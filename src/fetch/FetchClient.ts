import type {IFetchClient, IRequestInterceptor, IResponseInterceptor} from "./types/";

class FetchClient implements IFetchClient {
    private defaults: Partial<Omit<RequestInit, "body" | "method">> = {};
    private abortController = new AbortController()
    private requestInterceptor: IRequestInterceptor | undefined;
    private responseInterceptor: IResponseInterceptor | undefined;

    constructor(config?: Partial<Omit<RequestInit, "body" | "method">>) {
        this.defaults = config || {};
        this.defaults.signal = this.abortController.signal;
    }

    abort(msg?: string): boolean {
        try {
            this.abortController.abort(msg)
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    async request<R = Response>(url: string | URL, options?: RequestInit): Promise<R> {
        let requestOptions = {
            ...this.defaults,
            ...options
        }

        if (this.requestInterceptor) {
            requestOptions = this.requestInterceptor.intercept(url, options);
        }

        try {
            let response = await fetch(url, requestOptions);

            if (this.responseInterceptor) {
                return this.responseInterceptor.intercept<R>(response) as R;
            }

            // fixme: 相应类型是由fetch返回的固定类型，不应该断言成泛型R，这里必须有一个显示的转换
            return response as R;
        } catch (error) {
            console.error('Request failed:', error);
            throw error; // 或者根据需求返回一个默认值或错误响应
        }
    }

    delete<T = any, R = Response>(url: string | URL, data?: T, options?: Omit<RequestInit, "body" | "method">): Promise<R> {
        return this.request(url, {
            method: "DELETE",
            body: JSON.stringify(data),
            ...options
        })
    }

    get<R = Response>(url: string | URL, options?: Omit<RequestInit, "body" | "method">): Promise<R> {
        return this.request(url, {
            method: "GET",
            ...options
        })
    }

    patch<T = any, R = Response>(url: string | URL, data?: T, options?: Omit<RequestInit, "body" | "method">): Promise<R> {
        return this.request(url, {
            method: "PATCH",
            body: JSON.stringify(data),
            ...options
        })
    }

    post<T = any, R = Response>(url: string | URL, data?: T, options?: Omit<RequestInit, "body" | "method">): Promise<R> {
        return this.request(url, {
            body: JSON.stringify(data),
            method: 'POST',
            ...options
        })
    }

    put<T = any, R = Response>(url: string | URL, data?: T, options?: Omit<RequestInit, "body" | "method">): Promise<R> {
        return this.request(url, {
            method: "PUT",
            body: JSON.stringify(data),
            ...options
        })
    }

    setDefaults(defaults: Partial<Omit<RequestInit, "body" | "method">>): void {
        this.defaults = {...this.defaults, ...defaults};
    }

    setRequestInterceptor(interceptor: IRequestInterceptor): void {
        this.requestInterceptor = interceptor;
    }

    setResponseInterceptor(interceptor: IResponseInterceptor): void {
        this.responseInterceptor = interceptor;
    }

    stream(): Promise<string | undefined> {
        return Promise.resolve(undefined);
    }
}

export default FetchClient
