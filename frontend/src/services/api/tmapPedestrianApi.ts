import axios from 'axios';
import {getAccessToken} from '../../utils/storage';

const API_BASE_URL = 'http://10.0.2.2:8080/api';

interface WaypointCoord {
  lat: number;
  lng: number;
}

interface DirectionsRequest {
  start: string; // "경도,위도"
  goal: string; // "경도,위도"
  waypoints?: string[]; // ["경도,위도", ...]
}

interface DirectionsResponse {
  path: number[][]; // [[경도, 위도], ...]
  distance: number; // 미터
  duration: number; // 초
}

/**
 * TMAP API를 통한 보행자 경로 계산
 */
export const getTmapRoute = async (
  startLat: number,
  startLng: number,
  goalLat: number,
  goalLng: number,
  waypoints?: WaypointCoord[],
): Promise<DirectionsResponse> => {
  try {
    const token = await getAccessToken();

    if (!token) {
      throw new Error('인증 토큰이 없습니다.');
    }

    // 요청 데이터 구성
    const requestData: DirectionsRequest = {
      start: `${startLng},${startLat}`, // 경도,위도 순서
      goal: `${goalLng},${goalLat}`,
    };

    // 경유지가 있는 경우
    if (waypoints && waypoints.length > 0) {
      requestData.waypoints = waypoints.map(
        wp => `${wp.lng},${wp.lat}`, // 경도,위도 순서
      );
    }

    console.log('[TMAP] 보행자 경로 요청:', requestData);

    const response = await axios.post<DirectionsResponse>(
      `${API_BASE_URL}/directions/tmap`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log('[TMAP] 경로 계산 성공:', {
      distance: response.data.distance,
      duration: response.data.duration,
      pathPoints: response.data.path.length,
    });

    return response.data;
  } catch (error: any) {
    console.error('[TMAP] 경로 계산 실패:', error);

    if (error.response) {
      console.error('응답 에러:', error.response.data);
      console.error('상태 코드:', error.response.status);
    }

    throw error;
  }
};

/**
 * 경유지 배열을 기준으로 보행자 경로 계산
 */
export const getTmapRouteBetweenPoints = async (
  startLat: number,
  startLng: number,
  goalLat: number,
  goalLng: number,
  middlePoints?: WaypointCoord[],
): Promise<DirectionsResponse> => {
  return getTmapRoute(startLat, startLng, goalLat, goalLng, middlePoints);
};
