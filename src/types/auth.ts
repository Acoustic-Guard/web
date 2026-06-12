/**
 * Властивості компонента модального вікна авторизації.
 */
export interface LoginModalProps {
    onClose: () => void;
}

/**
 * Типи ролей користувачів у системі.
 */
export type UserRole = 'ADMIN' | 'GUEST' | string;
 
/**
 * Модель авторизованого користувача з токеном для реальних запитів до API.
 */
export interface AuthUser {
  role: UserRole;
  username: string;
  token: string;
}

 /**
 * Контекст авторизації для управління станом користувача та сесією.
 */
export interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
 