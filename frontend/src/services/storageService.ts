import AsyncStorage from '@react-native-async-storage/async-storage';

// 스토리지 키 상수
export const STORAGE_KEYS = {
  COURSES: '@courses',
  USER_SETTINGS: '@user_settings',
  CURRENT_LOCATION: '@current_location',
  LAST_SELECTED_COURSE_ID: '@last_selected_course_id', // 최근 선택한 코스 ID
} as const;

/**
 * 데이터를 AsyncStorage에 저장
 * @param key 저장할 키
 * @param value 저장할 값 (객체는 자동으로 JSON으로 변환)
 */
export const saveData = async <T>(key: string, value: T): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Failed to save data for key: ${key}`, error);
    throw error;
  }
};

/**
 * AsyncStorage에서 데이터 조회
 * @param key 조회할 키
 * @returns 저장된 데이터 또는 null
 */
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Failed to get data for key: ${key}`, error);
    throw error;
  }
};

/**
 * AsyncStorage에서 데이터 삭제
 * @param key 삭제할 키
 */
export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove data for key: ${key}`, error);
    throw error;
  }
};

/**
 * AsyncStorage의 모든 데이터 삭제
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Failed to clear all data', error);
    throw error;
  }
};

/**
 * AsyncStorage에 저장된 모든 키 조회
 * @returns 저장된 모든 키의 배열
 */
export const getAllKeys = async (): Promise<readonly string[]> => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Failed to get all keys', error);
    throw error;
  }
};

/**
 * 여러 데이터를 한 번에 저장
 * @param entries 저장할 키-값 쌍의 배열
 */
export const saveMultipleData = async <T>(
  entries: Array<[string, T]>,
): Promise<void> => {
  try {
    const stringifiedEntries = entries.map(([key, value]) => [
      key,
      JSON.stringify(value),
    ]as const);
    await AsyncStorage.multiSet(stringifiedEntries);
  } catch (error) {
    console.error('Failed to save multiple data', error);
    throw error;
  }
};

/**
 * 여러 데이터를 한 번에 조회
 * @param keys 조회할 키의 배열
 * @returns 키-값 쌍의 배열
 */
export const getMultipleData = async (
  keys: string[],
): Promise<Array<[string, any | null]>> => {
  try {
    const results = await AsyncStorage.multiGet(keys);
    return results.map(([key, value]) => [
      key,
      value != null ? JSON.parse(value) : null,
    ]);
  } catch (error) {
    console.error('Failed to get multiple data', error);
    throw error;
  }
};

/**
 * 여러 데이터를 한 번에 삭제
 * @param keys 삭제할 키의 배열
 */
export const removeMultipleData = async (keys: string[]): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Failed to remove multiple data', error);
    throw error;
  }
};
