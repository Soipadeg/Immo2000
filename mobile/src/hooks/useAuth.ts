import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getApiClient } from '../api/client';

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

interface VerifyOtpRequest {
  email: string;
  code: string;
}

export const useAuth = () => {
  const { user, token, setUser, setTokens, setLoading, setError, logout, isAuthenticated } = useAuthStore();
  const api = getApiClient();

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, access_token, refresh_token } = response.data;

      setUser(user);
      setTokens(access_token, refresh_token);
      return user;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/signup', { email, password, name });
      const { user, access_token, refresh_token } = response.data;

      setUser(user);
      setTokens(access_token, refresh_token);
      return user;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Signup failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/verify-otp', { email, code });
      const { user, access_token, refresh_token } = response.data;

      setUser(user);
      setTokens(access_token, refresh_token);
      return user;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Verification failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
    }
  }, []);

  return {
    user,
    token,
    isAuthenticated: isAuthenticated(),
    login,
    signup,
    verifyOtp,
    logout: logoutUser,
  };
};
