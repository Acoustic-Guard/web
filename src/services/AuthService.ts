import { API_CONFIG, ENDPOINTS } from '../config/api';
import { MOCK_CREDENTIALS } from '../config/auth';
import type { AuthUser } from '../types/auth';

const IS_MOCK = false;

/**
 * Виконує автентифікацію користувача через API.
 * @param username - Логін користувача.
 * @param password - Пароль.
 * @returns Дані користувача включно з JWT токеном для подальших запитів.
 * @throws {Error} Якщо логін або пароль невірні.
 */
export async function loginRequest(username: string, password: string): Promise<AuthUser & { token?: string }> {
  if (IS_MOCK) {
    console.log('Використовується мокова авторизація...');
    await new Promise((r) => setTimeout(r, 500));

    if (username === MOCK_CREDENTIALS.username && password === MOCK_CREDENTIALS.password) {
      return { role: 'ADMIN', username, token: 'mock-jwt-token-123' }; 
    }
    throw new Error('Невірний логін або пароль');
  }

  const res = await fetch(`${API_CONFIG.BASE_URL}${ENDPOINTS.auth}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error('Невірний логін або пароль');

  return await res.json(); 
}

/**
 * Завершує сесію користувача.
 */
export function logoutRequest(): void {
}