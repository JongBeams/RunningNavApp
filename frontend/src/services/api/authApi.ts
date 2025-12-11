import apiClient from './client';

/**
 * 회원가입 요청 타입
 */
export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

/**
 * 로그인 요청 타입
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 인증 응답 타입
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  profile: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
  };
}

/**
 * 회원가입
 */
export const signup = async (data: SignupRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/auth/signup', data);
  return response.data;
};

/**
 * 로그인
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
  return response.data;
};

/**
 * Access Token 갱신
 */
export const refreshAccessToken = async (
  refreshToken: string,
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/auth/refresh', {
    refreshToken,
  });
  return response.data;
};
