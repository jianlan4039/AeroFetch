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
export interface HttpInterceptor {
    request?(config: HttpRequestConfig): HttpRequestConfig | Promise<HttpRequestConfig>;
    response?(response: any): any | Promise<any>;
    responseError?(error: any): any | Promise<any>;
}

// Interface for HTTP client
export interface HttpClient {
    get<T = any>(url: string, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<T>;
    post<T = any>(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<T>;
    put<T = any>(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<T>;
    delete<T = any>(url: string, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<T>;
    patch<T = any>(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<T>;
    setInterceptor(interceptor: HttpInterceptor): void;
    setDefaults(defaults: Partial<Omit<HttpRequestConfig, 'url' | 'method'>>): void; // Add this line
}


export class DefaultHttpClient implements HttpClient {
    private defaults: Partial<Omit<HttpRequestConfig, 'url' | 'method'>> = {};
    private interceptor?: HttpInterceptor;

    setInterceptor(interceptor: HttpInterceptor): void {
        this.interceptor = interceptor;
    }

    setDefaults(defaults: Partial<Omit<HttpRequestConfig, 'url' | 'method'>>): void {
        this.defaults = { ...this.defaults, ...defaults };
    }

    private async request<T>(config: HttpRequestConfig): Promise<T> {
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
                throw new Error('Failed to parse JSON response: ' + error.message);
            }
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            if (this.interceptor?.responseError) {
                return await this.interceptor.responseError(data);
            }
            throw data;
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

    get<T = any>(url: string, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<T> {
        return this.request<T>({ ...config, url, method: 'GET' });
    }

    post<T = any>(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<T> {
        return this.request<T>({ ...config, url, data, method: 'POST' });
    }

    put<T = any>(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<T> {
        return this.request<T>({ ...config, url, data, method: 'PUT' });
    }

    delete<T = any>(url: string, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<T> {
        return this.request<T>({ ...config, url, method: 'DELETE' });
    }

    patch<T = any>(url: string, data?: any, config?: Omit<HttpRequestConfig, 'method' | 'url'>): Promise<T> {
        return this.request<T>({ ...config, url, data, method: 'PATCH' });
    }
}

export default DefaultHttpClient;
