/**
 * 지리적 계산 유틸리티
 *
 * GPS 좌표 기반의 거리, 방향 등을 계산하는 공통 함수 모음
 */

/**
 * 두 지점 간 거리 계산 (Haversine formula)
 *
 * 지구 곡률을 고려한 정확한 거리 계산
 *
 * @param lat1 첫 번째 지점 위도
 * @param lon1 첫 번째 지점 경도
 * @param lat2 두 번째 지점 위도
 * @param lon2 두 번째 지점 경도
 * @returns 거리 (미터)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 두 지점 간 방향(bearing) 계산
 *
 * @param lat1 시작 지점 위도
 * @param lon1 시작 지점 경도
 * @param lat2 도착 지점 위도
 * @param lon2 도착 지점 경도
 * @returns 방향 (0-359도, 북쪽이 0도)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360; // 0-359도로 정규화

  return bearing;
}

/**
 * 점에서 선분까지의 최단 거리 및 가장 가까운 지점 계산
 *
 * 점 P에서 선분 AB까지의 최단 거리와 선분 위의 최근접점을 계산
 *
 * @param px 점의 경도
 * @param py 점의 위도
 * @param x1 선분 시작점 경도
 * @param y1 선분 시작점 위도
 * @param x2 선분 끝점 경도
 * @param y2 선분 끝점 위도
 * @returns {distance: 거리(미터), nearestPoint: 가장 가까운 지점}
 */
export function distanceAndNearestPointToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): {distance: number; nearestPoint: {lat: number; lng: number}} {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    // 선분 시작점이 가장 가까움
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    // 선분 끝점이 가장 가까움
    xx = x2;
    yy = y2;
  } else {
    // 선분 위의 점이 가장 가까움
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;

  const distance = Math.sqrt(dx * dx + dy * dy) * 111320; // 도를 미터로 변환 (대략적)
  const nearestPoint = {lat: yy, lng: xx};

  return {distance, nearestPoint};
}
