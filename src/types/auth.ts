export interface LoginModalProps {
    onClose: () => void;
}

export type UserRole = 'ADMIN' | 'GUEST' | string;
 
export interface AuthUser {
  role: UserRole;
  username: string;
  token: string;
}
 
export interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
 