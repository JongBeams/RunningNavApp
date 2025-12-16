import apiClient from './client';

export interface DirectionsRequest {
  start: string; // "경도,위도" 형식
  goal: string; // "경도,위도" 형식
  waypoints?: string[]; // ["경도,위도", "경도,위도"] 형식 (선택)
  option?: 'trafast' | 'tracomfort' | 'traoptimal'; // 경로 옵션
}

export interface DirectionsResponse {
  path: number[][]; // [경도, 위도] 배열
  distance: number; // 미터
  duration: number; // 초
}

/**
 * 두 지점 간 경로 계산 (백엔드 API 호출)
 */
export const getRouteBetweenPoints = async (
  startLat: number,
  startLng: number,
  goalLat: number,
  goalLng: number,
  waypoints?: Array<{lat: number; lng: number}>,
): Promise<{path: number[][]; distance: number; duration: number}> => {
  const start = `${startLng},${startLat}`;
  const goal = `${goalLng},${goalLat}`;

  let waypointsArray: string[] | undefined;
  if (waypoints && waypoints.length > 0) {
    waypointsArray = waypoints.map(wp => `${wp.lng},${wp.lat}`);
  }

  const requestData: DirectionsRequest = {
    start,
    goal,
    waypoints: waypointsArray,
    option: 'traoptimal', // 최적 경로 (거리와 시간 균형)
  };

  const response = await apiClient.post<DirectionsResponse>(
    '/api/directions',
    requestData,
  );

  return {
    path: response.data.path,
    distance: response.data.distance,
    duration: response.data.duration,
  };
};
