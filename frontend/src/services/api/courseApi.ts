import apiClient from './client';

/**
 * 경유지 타입
 */
export interface Waypoint {
  latitude: number;
  longitude: number;
  order: number;
}

/**
 * 코스 생성 요청 타입
 */
export interface CreateCourseRequest {
  name: string;
  routeGeoJson: string; // GeoJSON LineString
  waypointsGeoJson: string; // GeoJSON MultiPoint
  distance: number;
  duration: number;
}

/**
 * 코스 응답 타입
 */
export interface CourseResponse {
  id: string;
  name: string;
  routeGeoJson: string; // GeoJSON LineString
  waypointsGeoJson: string; // GeoJSON MultiPoint
  distance: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  shareCode?: string; // 공유용 코드 (영문+숫자)
}

/**
 * 경유지 배열을 GeoJSON MultiPoint로 변환
 */
export const waypointsToGeoJson = (waypoints: Waypoint[]): string => {
  const coordinates = waypoints.map(wp => [wp.longitude, wp.latitude]);
  return JSON.stringify({
    type: 'MultiPoint',
    coordinates,
  });
};

/**
 * 경유지 배열을 GeoJSON LineString으로 변환
 */
export const waypointsToLineString = (waypoints: Waypoint[]): string => {
  const coordinates = waypoints.map(wp => [wp.longitude, wp.latitude]);
  return JSON.stringify({
    type: 'LineString',
    coordinates,
  });
};

/**
 * GeoJSON MultiPoint를 경유지 배열로 변환
 */
export const geoJsonToWaypoints = (geoJson: string): Waypoint[] => {
  const parsed = JSON.parse(geoJson);
  return parsed.coordinates.map((coord: number[], index: number) => ({
    longitude: coord[0],
    latitude: coord[1],
    order: index,
  }));
};

/**
 * 코스 생성
 */
export const createCourse = async (
  data: CreateCourseRequest,
): Promise<CourseResponse> => {
  const response = await apiClient.post<CourseResponse>(
    '/api/courses',
    data,
  );
  return response.data;
};

/**
 * 내 코스 목록 조회
 */
export const getMyCourses = async (): Promise<CourseResponse[]> => {
  const response = await apiClient.get<CourseResponse[]>('/api/courses');
  return response.data;
};

/**
 * 코스 상세 조회
 */
export const getCourseById = async (
  courseId: string,
): Promise<CourseResponse> => {
  const response = await apiClient.get<CourseResponse>(
    `/api/courses/${courseId}`,
  );
  return response.data;
};

/**
 * 코스 삭제
 */
export const deleteCourse = async (courseId: string): Promise<void> => {
  await apiClient.delete(`/api/courses/${courseId}`);
};

/**
 * shareCode로 코스 조회 (공개 API)
 */
export const getCourseByShareCode = async (
  shareCode: string,
): Promise<CourseResponse> => {
  const response = await apiClient.get<CourseResponse>(
    `/api/courses/share/${shareCode}`,
  );
  return response.data;
};
