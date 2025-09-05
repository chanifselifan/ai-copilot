import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, access_token } = response.data;
      
      // Store token and user data
      await AsyncStorage.setItem('@auth_token', access_token);
      await AsyncStorage.setItem('@user_data', JSON.stringify(user));
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', userData);
      const { user, access_token } = response.data;
      
      // Store token and user data
      await AsyncStorage.setItem('@auth_token', access_token);
      await AsyncStorage.setItem('@user_data', JSON.stringify(user));
      
      return response.data;
    } catch (error: any) {
      console.error('Register error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@auth_token');
      await AsyncStorage.removeItem('@user_data');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userDataString = await AsyncStorage.getItem('@user_data');
      if (userDataString) {
        return JSON.parse(userDataString);
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@auth_token');
    } catch (error) {
      console.error('Get auth token error:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      return !!token;
    } catch (error) {
      console.error('Check authentication error:', error);
      return false;
    }
  }

  async refreshProfile(): Promise<User> {
    try {
      const response = await api.get('/auth/me');
      const user = response.data;
      
      // Update stored user data
      await AsyncStorage.setItem('@user_data', JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      console.error('Refresh profile error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to refresh profile');
    }
  }
}

export default new AuthService();