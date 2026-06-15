import { API_CONFIG, ENDPOINTS } from '../config/api';
import { MOCK_CREDENTIALS } from '../config/auth';
import type { AuthUser } from '../types/auth';

const IS_MOCK = false;

/**
 * Performs user authentication via API.
 * @param username - User login.
 * @param password - User password.
 * @returns User data including JWT token for subsequent requests.
 * @throws {Error} If login or password is invalid, or server is unavailable.
 */
export async function loginRequest(username: string, password: string): Promise<AuthUser & { token?: string }> {
  if (IS_MOCK) {
    console.log('Using mock authentication...');
    await new Promise((r) => setTimeout(r, 500));

    if (username === MOCK_CREDENTIALS.username && password === MOCK_CREDENTIALS.password) {
      return { role: 'ADMIN', username, token: 'mock-jwt-token-123' }; 
    }
    throw new Error('Invalid username or password');
  }

  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.auth}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error('Invalid username or password');
    }

    if (!res.ok) {
      throw new Error('Server error');
    }

    return await res.json();
  } catch (error) {
    // Check for network-level errors (TypeError from fetch)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Server is currently unavailable. Please try again later.');
    }
    
    // Re-throw specific auth errors
    throw error;
  }
}

/**
 * Terminates user session.
 */
export function logoutRequest(): void {
}