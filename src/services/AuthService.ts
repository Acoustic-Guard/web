
import { API_CONFIG } from '../config/api';
import { MOCK_CREDENTIALS } from '../config/auth';
import type { AuthUser } from '../types/auth';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV;

// Коли з'явиться бекенд:
// 1. Встанови VITE_USE_MOCK=false
// 2. Java повертає { token, username, role } — розпакуй тут і збережи токен
// 3. Додай токен в заголовки запитів (наприклад через axios interceptor або в api.ts)
export async function loginRequest(username: string, password: string): Promise<AuthUser> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 500));

    if (username === MOCK_CREDENTIALS.username && password === MOCK_CREDENTIALS.password) {
      return { role: 'admin', username };
    }
    throw new Error('Невірний логін або пароль');
  }

  const res = await fetch(`${API_CONFIG.BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error('Невірний логін або пароль');

  const data = await res.json();
  return { role: data.role, username: data.username };
}

export function logoutRequest(): void {
  // Тут буде POST /api/v1/auth/logout або видалення токена
}