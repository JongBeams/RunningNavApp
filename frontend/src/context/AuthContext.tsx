import React, {createContext, useState, useContext, useEffect} from 'react';
import {
  login as apiLogin,
  signup as apiSignup,
  SignupRequest,
  LoginRequest,
  AuthResponse,
  refreshAccessToken,
} from '../services/api/authApi';
import {
  setAuthData,
  clearAuthData,
  getAccessToken,
  getRefreshToken,
  getUserProfile,
} from '../utils/storage';

/**
 * 사용자 프로필 타입
 */
interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

/**
 * AuthContext 타입
 */
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider: 인증 상태 관리
 */
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  /**
   * 앱 시작 시 저장된 토큰 확인 및 자동 로그인
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * 인증 상태 확인
   */
  const checkAuth = async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();
      const storedProfile = await getUserProfile();

      if (!accessToken || !refreshToken) {
        console.log('[Auth] 저장된 토큰 없음');
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return false;
      }

      // Refresh Token으로 Access Token 갱신 시도
      try {
        const response = await refreshAccessToken(refreshToken);

        // 새로운 토큰 저장
        await setAuthData(
          response.accessToken,
          response.refreshToken,
          response.profile,
        );

        setUser(response.profile);
        setIsAuthenticated(true);
        console.log('[Auth] 자동 로그인 성공:', response.profile.email);
        setIsLoading(false);
        return true;
      } catch (error) {
        console.error('[Auth] Refresh Token 갱신 실패:', error);

        // 저장된 프로필이 있으면 사용 (토큰 갱신 실패해도 임시로 사용)
        if (storedProfile) {
          setUser(storedProfile);
          setIsAuthenticated(true);
          setIsLoading(false);
          return true;
        }

        // 토큰 갱신 실패 시 로그아웃 처리
        await clearAuthData();
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('[Auth] 인증 확인 실패:', error);
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  /**
   * 로그인
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const loginData: LoginRequest = {email, password};
      const response: AuthResponse = await apiLogin(loginData);

      // 토큰 및 프로필 저장
      await setAuthData(
        response.accessToken,
        response.refreshToken,
        response.profile,
      );

      setUser(response.profile);
      setIsAuthenticated(true);

      console.log('[Auth] 로그인 성공:', response.profile.email);
    } catch (error: any) {
      console.error('[Auth] 로그인 실패:', error.response?.data || error);
      throw error;
    }
  };

  /**
   * 회원가입
   */
  const signup = async (data: SignupRequest): Promise<void> => {
    try {
      const response: AuthResponse = await apiSignup(data);

      // 토큰 및 프로필 저장
      await setAuthData(
        response.accessToken,
        response.refreshToken,
        response.profile,
      );

      setUser(response.profile);
      setIsAuthenticated(true);

      console.log('[Auth] 회원가입 성공:', response.profile.email);
    } catch (error: any) {
      console.error('[Auth] 회원가입 실패:', error.response?.data || error);
      throw error;
    }
  };

  /**
   * 로그아웃
   */
  const logout = async (): Promise<void> => {
    try {
      await clearAuthData();
      setUser(null);
      setIsAuthenticated(false);

      console.log('[Auth] 로그아웃 완료');
    } catch (error) {
      console.error('[Auth] 로그아웃 실패:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    signup,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook: AuthContext 사용
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
