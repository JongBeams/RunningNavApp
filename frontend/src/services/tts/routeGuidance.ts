import {LocationData} from '../location';
import NavigationVoice, {Direction} from './navigationVoice';

/**
 * 경유지 타입
 */
export interface Waypoint {
  latitude: number;
  longitude: number;
  order: number;
}

/**
 * 경로 안내 상태
 */
export interface GuidanceState {
  currentWaypointIndex: number; // 현재 목표 경유지 인덱스
  distanceToNextWaypoint: number; // 다음 경유지까지 거리 (미터)
  isOffRoute: boolean; // 경로 이탈 여부
  hasAnnounced100m: boolean; // 100m 안내 완료 여부
  hasAnnounced50m: boolean; // 50m 안내 완료 여부
  lastAnnouncedDistance: number; // 마지막 1km 안내 거리
}

/**
 * 경로 안내 옵션
 */
export interface RouteGuidanceOptions {
  offRouteThreshold?: number; // 경로 이탈 판정 거리 (미터, 기본값: 30m)
  waypointReachedThreshold?: number; // 경유지 도착 판정 거리 (미터, 기본값: 20m)
  distanceAnnouncementInterval?: number; // 거리 안내 간격 (미터, 기본값: 1000m = 1km)
  enableVoiceGuidance?: boolean; // 음성 안내 활성화 (기본값: true)
}

/**
 * 두 지점 간 거리 계산 (Haversine formula)
 */
function calculateDistance(
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
 * 점에서 경로(선분)까지의 최단 거리 계산
 */
function distanceToLineSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
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
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;

  return Math.sqrt(dx * dx + dy * dy) * 111320; // 도를 미터로 변환 (대략적)
}

/**
 * 경로 안내 서비스
 *
 * 실시간 위치를 기반으로 경로 안내 및 음성 안내 제공
 */
export class RouteGuidanceService {
  private waypoints: Waypoint[];
  private routePath: number[][]; // [[lng, lat], ...]
  private state: GuidanceState;
  private options: Required<RouteGuidanceOptions>;

  constructor(
    waypoints: Waypoint[],
    routePath: number[][],
    options?: RouteGuidanceOptions,
  ) {
    this.waypoints = waypoints;
    this.routePath = routePath;
    this.options = {
      offRouteThreshold: options?.offRouteThreshold ?? 30,
      waypointReachedThreshold: options?.waypointReachedThreshold ?? 20,
      distanceAnnouncementInterval: options?.distanceAnnouncementInterval ?? 1000,
      enableVoiceGuidance: options?.enableVoiceGuidance ?? true,
    };

    this.state = {
      currentWaypointIndex: 0,
      distanceToNextWaypoint: 0,
      isOffRoute: false,
      hasAnnounced100m: false,
      hasAnnounced50m: false,
      lastAnnouncedDistance: 0,
    };
  }

  /**
   * 위치 업데이트 처리
   *
   * 현재 위치를 기반으로 경로 안내 상태 업데이트 및 음성 안내
   */
  async updateLocation(
    location: LocationData,
    totalDistance: number,
    elapsedTime: number,
  ): Promise<void> {
    if (this.state.currentWaypointIndex >= this.waypoints.length) {
      // 모든 경유지 통과 완료
      return;
    }

    const currentWaypoint = this.waypoints[this.state.currentWaypointIndex];

    // 다음 경유지까지의 거리 계산
    const distanceToWaypoint = calculateDistance(
      location.latitude,
      location.longitude,
      currentWaypoint.latitude,
      currentWaypoint.longitude,
    );

    this.state.distanceToNextWaypoint = distanceToWaypoint;

    // 경유지 도착 체크
    if (distanceToWaypoint <= this.options.waypointReachedThreshold) {
      await this.handleWaypointReached();
      return;
    }

    // 경로 이탈 체크
    await this.checkOffRoute(location);

    // 거리별 음성 안내
    await this.announceDistanceGuidance(distanceToWaypoint);

    // 1km 단위 거리 안내
    await this.announceDistanceMilestone(totalDistance, elapsedTime);
  }

  /**
   * 경유지 도착 처리
   */
  private async handleWaypointReached(): Promise<void> {
    console.log(
      '[RouteGuidance] 경유지',
      this.state.currentWaypointIndex + 1,
      '도착',
    );

    // 음성 안내
    if (this.options.enableVoiceGuidance) {
      if (this.state.currentWaypointIndex === this.waypoints.length - 1) {
        // 마지막 경유지 (목적지)
        await NavigationVoice.announceArrival();
      } else {
        // 중간 경유지
        await NavigationVoice.announceWaypointReached(
          this.state.currentWaypointIndex + 1,
          this.waypoints.length,
        );
      }
    }

    // 다음 경유지로 이동
    this.state.currentWaypointIndex++;
    this.state.hasAnnounced100m = false;
    this.state.hasAnnounced50m = false;
  }

  /**
   * 경로 이탈 체크
   */
  private async checkOffRoute(location: LocationData): Promise<void> {
    // 현재 위치에서 경로까지의 최단 거리 계산
    let minDistance = Infinity;

    for (let i = 0; i < this.routePath.length - 1; i++) {
      const [lng1, lat1] = this.routePath[i];
      const [lng2, lat2] = this.routePath[i + 1];

      const distance = distanceToLineSegment(
        location.longitude,
        location.latitude,
        lng1,
        lat1,
        lng2,
        lat2,
      );

      minDistance = Math.min(minDistance, distance);
    }

    const wasOffRoute = this.state.isOffRoute;
    this.state.isOffRoute = minDistance > this.options.offRouteThreshold;

    // 경로 이탈 상태 변경 시 음성 안내
    if (this.options.enableVoiceGuidance) {
      if (!wasOffRoute && this.state.isOffRoute) {
        console.log('[RouteGuidance] 경로 이탈:', minDistance.toFixed(2), 'm');
        await NavigationVoice.announceOffRoute();
      } else if (wasOffRoute && !this.state.isOffRoute) {
        console.log('[RouteGuidance] 경로 복귀');
        await NavigationVoice.announceBackOnRoute();
      }
    }
  }

  /**
   * 거리별 음성 안내 (100m, 50m)
   */
  private async announceDistanceGuidance(
    distanceToWaypoint: number,
  ): Promise<void> {
    if (!this.options.enableVoiceGuidance) {
      return;
    }

    // 마지막 경유지 (목적지) 안내
    if (this.state.currentWaypointIndex === this.waypoints.length - 1) {
      if (distanceToWaypoint <= 100 && !this.state.hasAnnounced100m) {
        await NavigationVoice.announceApproachingDestination(
          distanceToWaypoint,
        );
        this.state.hasAnnounced100m = true;
      }
    }
  }

  /**
   * 1km 단위 거리 안내
   */
  private async announceDistanceMilestone(
    totalDistance: number,
    elapsedTime: number,
  ): Promise<void> {
    if (!this.options.enableVoiceGuidance) {
      return;
    }

    const currentKm = Math.floor(totalDistance / 1000);
    const lastKm = Math.floor(this.state.lastAnnouncedDistance / 1000);

    if (currentKm > lastKm && currentKm > 0) {
      await NavigationVoice.announceDistance(totalDistance, elapsedTime);
      this.state.lastAnnouncedDistance = totalDistance;
    }
  }

  /**
   * 음성 안내 활성화/비활성화
   */
  setVoiceGuidanceEnabled(enabled: boolean): void {
    this.options.enableVoiceGuidance = enabled;
  }

  /**
   * 현재 상태 가져오기
   */
  getState(): GuidanceState {
    return {...this.state};
  }

  /**
   * 상태 리셋
   */
  reset(): void {
    this.state = {
      currentWaypointIndex: 0,
      distanceToNextWaypoint: 0,
      isOffRoute: false,
      hasAnnounced100m: false,
      hasAnnounced50m: false,
      lastAnnouncedDistance: 0,
    };
  }
}

export default RouteGuidanceService;
