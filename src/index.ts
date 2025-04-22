// Base interface for HTTP request configuration
export interface HttpRequestConfig {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
    headers?: Record<string, string>;
    params?: Record<string, string | number>;
    data?: any; // For POST, PUT, etc.
    timeout?: number; // Optional timeout in milliseconds
}

// Interface for interceptors
export interface RequestInterceptor {
    request?(config: HttpRequestConfig): HttpRequestConfig | Promise<HttpRequestConfig>;
}

export interface ResponseInterceptor {
    response?(response: any): any | Promise<any>;
}

export interface ResponseErrorInterceptor {
    responseError?(error: any): any | Promise<any>;
}

export type HttpInterceptor = RequestInterceptor & ResponseInterceptor & ResponseErrorInterceptor;

// Interface for HTTP client
export interface HttpClient {
    get(url: string, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<any>;
    post(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<any>;
    put(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<any>;
    delete(url: string, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<any>;
    patch(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<any>;
    setRequestInterceptor(interceptor: RequestInterceptor): void;
    setResponseInterceptor(interceptor: ResponseInterceptor): void;
    setResponseErrorInterceptor(interceptor: ResponseErrorInterceptor): void;
    setDefaults(defaults: Partial<Omit<HttpRequestConfig, 'url' | 'method'>>): void;
}

// Implementation of the HTTP client using Fetch API
export class AeroFetch implements HttpClient {
    private defaults: Partial<Omit<HttpRequestConfig, 'url' | 'method'>> = {};
    private interceptor: HttpInterceptor = {};

    setRequestInterceptor(interceptor: RequestInterceptor): void {
        throw new Error("Method not implemented.");
    }
    setResponseInterceptor(interceptor: ResponseInterceptor): void {
        throw new Error("Method not implemented.");
    }
    setResponseErrorInterceptor(interceptor: ResponseErrorInterceptor): void {
        throw new Error("Method not implemented.");
    }

    setDefaults(defaults: Partial<Omit<HttpRequestConfig, 'url' | 'method'>>): void {
        this.defaults = { ...this.defaults, ...defaults };
    }

    private async request(config: HttpRequestConfig): Promise<any> {
        let finalConfig = { ...this.defaults, ...config }; 

        // Apply request interceptor
        if (this.interceptor?.request) {
            finalConfig = await this.interceptor.request(finalConfig);
        }

        // Build URL with params
        let url = finalConfig.url;
        if (finalConfig.params) {
            const params = new URLSearchParams(finalConfig.params as Record<string, string>).toString();
            url += (url.includes('?') ? '&' : '?') + params;
        }

        // Prepare fetch options
        const fetchOptions: RequestInit = {
            method: finalConfig.method,
            headers: finalConfig.headers,
            body: ['POST', 'PUT', 'PATCH'].includes(finalConfig.method) && finalConfig.data !== undefined
                ? JSON.stringify(finalConfig.data)
                : undefined,
        };

        // Handle timeout
        let response: Response;
        if (finalConfig.timeout) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);
            try {
                response = await fetch(url, { ...fetchOptions, signal: controller.signal });
            } finally {
                clearTimeout(timeoutId);
            }
        } else {
            response = await fetch(url, fetchOptions);
        }

        let data: any;
        const contentType = response.headers.get('Content-Type') || '';

        if (contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (error) {
                if (error instanceof Error) {
                    throw new Error('Failed to parse JSON response: ' + error.message);
                } else {
                    throw new Error('Failed to parse JSON response: Unknown error');
                }
            }
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            if (this.interceptor?.responseError) {
                return await this.interceptor.responseError(data);
            }
        }

        // Apply response interceptor
        if (this.interceptor?.response) {
            try {
                return await this.interceptor.response(data);
            } catch (error) {
                if (this.interceptor.responseError) {
                    return await this.interceptor.responseError(error);
                }
                throw error;
            }
        }

        return data;
    }

    get(url: string, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<any> {
        return this.request({ ...config, url, method: 'GET' });
    }

    post(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<any> {
        return this.request({ ...config, url, data, method: 'POST' });
    }

    put(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<any> {
        return this.request({ ...config, url, data, method: 'PUT' });
    }

    delete(url: string, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<any> {
        return this.request({ ...config, url, method: 'DELETE' });
    }

    patch(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<any> {
        return this.request({ ...config, url, data, method: 'PATCH' });
    }
}

export default AeroFetch;