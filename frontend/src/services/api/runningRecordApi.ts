import apiClient from './client';

/**
 * 러닝 기록 요청 타입
 */
export interface RunningRecordRequest {
  courseId?: string; // UUID
  startTime: string; // ISO 8601 format
  endTime: string;
  distance: number; // 미터
  duration: number; // 초
  avgPace: number; // 초/km
  avgSpeed: number; // m/s
  routeCoordinates: number[][]; // [[lng, lat], ...]
  memo?: string;
  weather?: string;
  calories?: number;
  avgHeartRate?: number;
}

/**
 * 러닝 기록 응답 타입
 */
export interface RunningRecordResponse {
  id: number;
  courseId?: string;
  courseName?: string;
  startTime: string;
  endTime: string;
  distance: number;
  duration: number;
  avgPace: number;
  avgSpeed: number;
  routeGeoJson: string; // GeoJSON LineString
  createdAt: string;
  memo?: string;
  weather?: string;
  calories?: number;
  avgHeartRate?: number;
}

/**
 * 러닝 통계 타입
 */
export interface RunningStatistics {
  totalDistance: number; // 총 거리 (미터)
  totalDuration: number; // 총 시간 (초)
  totalCount: number; // 총 러닝 횟수
}

/**
 * 러닝 기록 저장
 */
export const createRunningRecord = async (
  request: RunningRecordRequest,
): Promise<RunningRecordResponse> => {
  const response = await apiClient.post<RunningRecordResponse>(
    '/api/running-records',
    request,
  );

  return response.data;
};

/**
 * 내 러닝 기록 목록 조회
 */
export const getMyRunningRecords = async (): Promise<
  RunningRecordResponse[]
> => {
  const response = await apiClient.get<RunningRecordResponse[]>(
    '/api/running-records',
  );

  return response.data;
};

/**
 * 러닝 기록 상세 조회
 */
export const getRunningRecordById = async (
  id: number,
): Promise<RunningRecordResponse> => {
  const response = await apiClient.get<RunningRecordResponse>(
    `/api/running-records/${id}`,
  );

  return response.data;
};

/**
 * 러닝 기록 삭제
 */
export const deleteRunningRecord = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/running-records/${id}`);
};

/**
 * 러닝 통계 조회
 */
export const getRunningStatistics = async (): Promise<RunningStatistics> => {
  const response = await apiClient.get<RunningStatistics>(
    '/api/running-records/statistics',
  );

  return response.data;
};
