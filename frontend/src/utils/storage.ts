import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: '@runrun_access_token',
  REFRESH_TOKEN: '@runrun_refresh_token',
  USER_PROFILE: '@runrun_user_profile',
};

/**
 * Access Token 저장
 */
export const setAccessToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  } catch (error) {
    console.error('[Storage] Access Token 저장 실패:', error);
    throw error;
  }
};

/**
 * Access Token 조회
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('[Storage] Access Token 조회 실패:', error);
    return null;
  }
};

/**
 * Refresh Token 저장
 */
export const setRefreshToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  } catch (error) {
    console.error('[Storage] Refresh Token 저장 실패:', error);
    throw error;
  }
};

/**
 * Refresh Token 조회
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('[Storage] Refresh Token 조회 실패:', error);
    return null;
  }
};

/**
 * 사용자 프로필 저장
 */
export const setUserProfile = async (profile: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_PROFILE,
      JSON.stringify(profile),
    );
  } catch (error) {
    console.error('[Storage] 사용자 프로필 저장 실패:', error);
    throw error;
  }
};

/**
 * 사용자 프로필 조회
 */
export const getUserProfile = async (): Promise<any | null> => {
  try {
    const profile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error('[Storage] 사용자 프로필 조회 실패:', error);
    return null;
  }
};

/**
 * 모든 인증 정보 저장
 */
export const setAuthData = async (
  accessToken: string,
  refreshToken: string,
  profile: any,
): Promise<void> => {
  try {
    await Promise.all([
      setAccessToken(accessToken),
      setRefreshToken(refreshToken),
      setUserProfile(profile),
    ]);
  } catch (error) {
    console.error('[Storage] 인증 정보 저장 실패:', error);
    throw error;
  }
};

/**
 * 모든 인증 정보 삭제 (로그아웃)
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_PROFILE,
    ]);
    console.log('[Storage] 인증 정보 삭제 완료');
  } catch (error) {
    console.error('[Storage] 인증 정보 삭제 실패:', error);
    throw error;
  }
};

/**
 * 인증 상태 확인
 */
export const hasAuthTokens = async (): Promise<boolean> => {
  try {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();
    return !!(accessToken && refreshToken);
  } catch (error) {
    console.error('[Storage] 인증 상태 확인 실패:', error);
    return false;
  }
};
