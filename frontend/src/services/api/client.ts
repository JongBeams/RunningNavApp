import axios, {AxiosInstance, InternalAxiosRequestConfig} from 'axios';
import {getAccessToken, getRefreshToken, setAccessToken} from '../../utils/storage';
import {Platform} from 'react-native';

// API Base URL
// 개발: Android 에뮬레이터 = 10.0.2.2, iOS 시뮬레이터 = localhost
// 프로덕션: AWS Lightsail 서버 IP
// 임시: 개발 모드에서도 AWS 서버 사용 (실제 기기 테스트용)
const API_BASE_URL = 'http://3.34.96.22:8080'; // 항상 AWS 서버 사용

/* 원래 코드 (나중에 복원)
const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:8080'  // Android 에뮬레이터
    : 'http://localhost:8080' // iOS 시뮬레이터
  : 'http://3.34.96.22:8080'; // 프로덕션 서버 (AWS Lightsail)
*/

// Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 갱신 중 플래그 (중복 요청 방지)
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Request Interceptor: 모든 요청에 Access Token 추가
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // /api/auth 경로는 토큰 불필요 (로그인, 회원가입)
    if (config.url?.includes('/api/auth')) {
      return config;
    }

    const accessToken = await getAccessToken();

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

/**
 * Response Interceptor: 401 에러 시 Refresh Token으로 자동 갱신
 */
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // 401 에러이고, 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 토큰 갱신 중이면 대기열에 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({resolve, reject});
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          throw new Error('Refresh Token이 없습니다.');
        }

        // Refresh Token으로 새로운 Access Token 발급
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const {accessToken} = response.data;

        // 새로운 Access Token 저장
        await setAccessToken(accessToken);

        // 대기 중인 요청들 처리
        processQueue(null, accessToken);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh Token도 만료되었으면 로그아웃 처리
        console.error('[API] Refresh Token 갱신 실패:', refreshError);

        // 로그인 화면으로 이동 (AuthContext에서 처리)
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
