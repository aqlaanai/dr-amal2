/**
 * API Client
 * Centralized HTTP client for making API requests with authentication
 */

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClientClass {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  /**
   * Get access token from localStorage
   */
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  /**
   * Build headers with authentication
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;

    // Build URL with query params
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    try {
      const builtHeaders = this.buildHeaders();
      const customHeaders = (fetchOptions.headers as Record<string, string>) || {};
      const headers = {
        ...builtHeaders,
        ...customHeaders,
      };
      
      console.log(`[API] ${fetchOptions.method || 'GET'} ${endpoint}`, {
        hasAuth: !!headers['Authorization'],
        authToken: headers['Authorization'] ? headers['Authorization'].substring(0, 20) + '...' : null,
        baseUrl: this.baseUrl,
      });

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      console.log(`[API] Response status: ${response.status}`);

      // Handle 401 - Token expired, try to refresh
      if (response.status === 401) {
        console.log('[API] 401 Unauthorized - attempting token refresh');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry request with new token
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers: {
              ...this.buildHeaders(),
              ...fetchOptions.headers,
            },
          });

          if (!retryResponse.ok) {
            const error = await retryResponse.json();
            throw new Error(error.error || 'Request failed');
          }

          return retryResponse.json();
        } else {
          // Refresh failed, silently redirect to login (don't throw error)
          console.log('[API] Token refresh failed - clearing session and redirecting to signin');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/auth/signin';
          }
          // Don't throw - just let the redirect happen
          return {} as T;
        }
      }

      if (response.status === 403) {
        console.log('[API] 403 Forbidden - clearing tokens and redirecting');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/auth/signin';
        }
        // Don't throw - just let the redirect happen
        return {} as T;
      }

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          console.error('[API] Failed to parse error response as JSON');
          throw new Error(`Request failed with status ${response.status}`);
        }

        const errorMessage = errorData.error || `Request failed with status ${response.status}`;
        console.log('[API] Error response:', { status: response.status, message: errorMessage });
        
        // Handle "No authorization token" error - redirect to signin silently
        if (response.status === 400 && errorMessage.includes('No authorization token')) {
          console.log('[API] No authorization token - redirecting to signin');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/auth/signin';
          }
          // Don't throw - just redirect
          return {} as T;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log(`[API] Success: received ${typeof result === 'object' && result.data ? result.data.length : '1'} item(s)`);
      return result;
    } catch (error: any) {
      const errorInfo = {
        message: error?.message || String(error),
        name: error?.name,
        type: error?.constructor?.name,
        url: url,
        method: fetchOptions.method || 'GET',
      };
      console.error('[API] Fetch or processing error:', errorInfo);
      
      // If it's a network/fetch error, provide a clearer message
      if (error?.name === 'TypeError' && error?.message.includes('fetch')) {
        throw new Error(`Network error: ${error.message} (URL: ${url})`);
      }
      
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  private async refreshToken(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      // Store both new tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      console.log('[API] Token refresh successful, stored new tokens');
      return true;
    } catch (error) {
      console.error('[API] Token refresh failed:', error);
      return false;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const ApiClient = new ApiClientClass();
