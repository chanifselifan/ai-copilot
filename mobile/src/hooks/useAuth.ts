import { useState, useEffect } from 'react';
import authService, { User, LoginRequest, RegisterRequest } from '../services/authService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const user = await authService.getCurrentUser();
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const response = await authService.login(credentials);
      setAuthState({
        user: response.user,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const response = await authService.register(userData);
      setAuthState({
        user: response.user,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await authService.logout();
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      const user = await authService.refreshProfile();
      setAuthState(prev => ({ ...prev, user }));
    } catch (error) {
      console.error('Refresh profile error:', error);
      throw error;
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    refreshProfile,
    checkAuthStatus,
  };
};