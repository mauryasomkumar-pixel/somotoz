import { auth } from './firebase';

export interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  data: any;
  userFriendlyMessage: string;

  constructor(status: number, message: string, userFriendlyMessage: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.userFriendlyMessage = userFriendlyMessage;
    this.data = data;
  }
}

/**
 * Returns a friendly, non-technical explanation for HTTP error statuses.
 * Raw exceptions or JSON syntax errors are never shown to the user.
 */
export function getFriendlyErrorMessage(status: number, fallback?: string): string {
  if (status === 401) {
    return 'Your session has expired. Please log in again to continue.';
  }
  if (status === 403) {
    return 'Access is restricted. You do not have permission for this action.';
  }
  if (status === 404) {
    return 'The requested feature is currently unavailable. Please try again later.';
  }
  if (status === 429) {
    return 'Too many requests. Please wait a minute before trying again.';
  }
  if (status >= 500) {
    return 'Our server is momentarily busy. Please try again in a few moments.';
  }
  return fallback || 'Something went wrong, please try again.';
}

/**
 * Centralized secure frontend API client.
 * - Injects Firebase Bearer ID Token automatically when signed in
 * - Handles non-JSON / HTML / 404 / 500 error responses gracefully
 * - Prevents raw JSON parsing exceptions from bubbling up to UI
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { requiresAuth = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Attach Firebase ID token if available
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.warn('[ApiClient] Auth token resolution notice:', err);
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...rest,
      headers,
    });
  } catch (netErr: any) {
    throw new ApiError(
      0,
      netErr?.message || 'Network error',
      'Unable to connect. Please check your internet connection and try again.'
    );
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const isJson = contentType.includes('application/json');

  let responseData: any = null;
  let rawText = '';
  if (isJson) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    // Non-JSON response (e.g. Vercel plain-text crash or HTML fallback)
    try {
      rawText = await response.text();
    } catch {}
    // Try parsing in case server omitted Content-Type header
    if (rawText && (rawText.trim().startsWith('{') || rawText.trim().startsWith('['))) {
      try {
        responseData = JSON.parse(rawText);
      } catch {
        responseData = null;
      }
    }
  }

  if (!response.ok) {
    const serverMessage = responseData?.error || responseData?.message;
    const userFriendly = getFriendlyErrorMessage(response.status, serverMessage);
    throw new ApiError(
      response.status,
      serverMessage || response.statusText || 'Request failed',
      userFriendly,
      responseData
    );
  }

  if (responseData === null) {
    throw new ApiError(
      502,
      'Invalid non-JSON server response',
      'Our server returned an unexpected response. Please try again in a few moments.'
    );
  }

  return responseData as T;
}
