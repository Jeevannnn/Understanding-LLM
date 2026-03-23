import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  login: (token: string) => {
    set({ accessToken: token, isAuthenticated: true });
  },
  logout: () => {
    set({ accessToken: null, isAuthenticated: false });
  },
}));
