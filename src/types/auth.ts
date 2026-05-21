export interface LoginModalProps {
    onClose: () => void;
}

export type UserRole = 'guest' | 'admin';
 
export interface AuthUser {
  role: UserRole;
  username: string;
}
 
export interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
 