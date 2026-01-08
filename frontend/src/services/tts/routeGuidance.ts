import {LocationData} from '../location';
import NavigationVoice, {type Direction} from './navigationVoice';
import {
  calculateDistance,
  calculateBearing,
  distanceAndNearestPointToSegment,
} from '../../utils/geoUtils';

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
  lastOffRouteWarningTime: number; // 마지막 경로 이탈 경고 시간 (타임스탬프)
  hasAnnounced100m: boolean; // 100m 안내 완료 여부
  hasAnnouncedTurn: boolean; // 회전 안내 완료 여부 (20m)
  lastAnnouncedDistance: number; // 마지막 1km 안내 거리
}

/**
 * 경로 안내 옵션
 */
export interface RouteGuidanceOptions {
  offRouteThreshold?: number; // 경로 이탈 판정 거리 (미터, 기본값: 5m)
  waypointReachedThreshold?: number; // 경유지 도착 판정 거리 (미터, 기본값: 2m)
  turnWarningDistance?: number; // 회전 안내 거리 (미터, 기본값: 20m)
  distanceAnnouncementInterval?: number; // 거리 안내 간격 (미터, 기본값: 1000m = 1km)
  enableVoiceGuidance?: boolean; // 음성 안내 활성화 (기본값: true)
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
      offRouteThreshold: options?.offRouteThreshold ?? 5, // ✅ FIX: 2.5m → 5m로 증가 (경로 이탈 오판정 방지)
      waypointReachedThreshold: options?.waypointReachedThreshold ?? 2,
      turnWarningDistance: options?.turnWarningDistance ?? 20,
      distanceAnnouncementInterval: options?.distanceAnnouncementInterval ?? 1000,
      enableVoiceGuidance: options?.enableVoiceGuidance ?? true,
    };

    this.state = {
      currentWaypointIndex: 0,
      distanceToNextWaypoint: 0,
      isOffRoute: false,
      lastOffRouteWarningTime: 0,
      hasAnnounced100m: false,
      hasAnnouncedTurn: false,
      lastAnnouncedDistance: 0,
    };
  }

  /**
   * 위치 업데이트 처리
   *
   * 현재 위치를 기반으로 경로 안내 상태 업데이트 및 음성 안내
   * @returns 완주 여부 (true: 모든 경유지 완료, false: 진행 중)
   */
  async updateLocation(
    location: LocationData,
    totalDistance: number,
    elapsedTime: number,
  ): Promise<boolean> {
    if (this.state.currentWaypointIndex >= this.waypoints.length) {
      // 모든 경유지 통과 완료
      return true;
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

      // 완주 체크: 마지막 경유지를 통과했는지 확인
      if (this.state.currentWaypointIndex >= this.waypoints.length) {
        return true; // ✅ 완주!
      }
      return false; // 다음 경유지로 진행
    }

    // 경로 이탈 체크
    await this.checkOffRoute(location);

    // 거리별 음성 안내
    await this.announceDistanceGuidance(distanceToWaypoint);

    // 1km 단위 거리 안내
    await this.announceDistanceMilestone(totalDistance, elapsedTime);

    return false; // 진행 중
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
    this.state.hasAnnouncedTurn = false;
  }

  /**
   * 회전 방향 계산
   * @returns 'left' | 'right' | 'straight' | null
   */
  private calculateTurnDirection(): Direction | null {
    // 다음 경유지가 없으면 null 반환
    if (this.state.currentWaypointIndex >= this.waypoints.length - 1) {
      return null;
    }

    const currentWaypoint = this.waypoints[this.state.currentWaypointIndex];
    const nextWaypoint = this.waypoints[this.state.currentWaypointIndex + 1];

    // 다음 다음 경유지가 없으면 직진으로 간주
    if (this.state.currentWaypointIndex >= this.waypoints.length - 2) {
      return 'straight';
    }

    const waypointAfterNext = this.waypoints[this.state.currentWaypointIndex + 2];

    // 현재 경유지 → 다음 경유지 방향
    const bearing1 = calculateBearing(
      currentWaypoint.latitude,
      currentWaypoint.longitude,
      nextWaypoint.latitude,
      nextWaypoint.longitude,
    );

    // 다음 경유지 → 다음다음 경유지 방향
    const bearing2 = calculateBearing(
      nextWaypoint.latitude,
      nextWaypoint.longitude,
      waypointAfterNext.latitude,
      waypointAfterNext.longitude,
    );

    // 각도 차이 계산 (-180 ~ 180)
    let angleDiff = bearing2 - bearing1;
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;

    // 회전 방향 판단
    // ✅ U-Turn 감지 추가: 150도 이상 회전 시 유턴 (일자 왕복 코스 반환점 처리)
    if (Math.abs(angleDiff) >= 150) {
      console.log('[RouteGuidance] U-Turn 감지:', angleDiff.toFixed(1), '도');
      return 'uturn'; // 유턴 (반환점)
    } else if (Math.abs(angleDiff) < 30) {
      return 'straight'; // 직진 (±30도 이내)
    } else if (angleDiff > 0) {
      return 'right'; // 우회전
    } else {
      return 'left'; // 좌회전
    }
  }

  /**
   * 경로 복귀 방향 계산
   * @returns 'forward' | 'backward' | 'left' | 'right' | null
   */
  private calculateReturnDirection(
    location: LocationData,
    nearestPoint: {lat: number; lng: number},
  ): 'forward' | 'backward' | 'left' | 'right' | null {
    // 현재 위치에서 가장 가까운 경로 지점까지의 방향(bearing) 계산
    const bearingToRoute = calculateBearing(
      location.latitude,
      location.longitude,
      nearestPoint.lat,
      nearestPoint.lng,
    );

    // 현재 이동 방향 (heading)이 없으면 null 반환
    if (
      location.heading === null ||
      location.heading === undefined ||
      isNaN(location.heading)
    ) {
      console.warn('[RouteGuidance] 현재 방향 정보 없음');
      return null;
    }

    // 현재 방향과 경로까지의 방향 차이 계산 (-180 ~ 180)
    let angleDiff = bearingToRoute - location.heading;
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;

    // 방향 판단 (4방향)
    if (angleDiff >= -45 && angleDiff < 45) {
      return 'forward'; // 앞쪽 (±45도)
    } else if (angleDiff >= 45 && angleDiff < 135) {
      return 'right'; // 우측 (45~135도)
    } else if (angleDiff >= -135 && angleDiff < -45) {
      return 'left'; // 좌측 (-135~-45도)
    } else {
      return 'backward'; // 뒤쪽 (135~180도 or -180~-135도)
    }
  }

  /**
   * 경로 이탈 체크 (최적화: 단일 순회로 거리와 최근접점 동시 계산)
   */
  private async checkOffRoute(location: LocationData): Promise<void> {
    // 현재 위치에서 경로까지의 최단 거리 및 가장 가까운 지점 찾기
    let minDistance = Infinity;
    let nearestPoint: {lat: number; lng: number} | null = null;

    // 최적화: 한 번의 순회로 거리와 최근접점 동시 계산
    for (let i = 0; i < this.routePath.length - 1; i++) {
      const [lng1, lat1] = this.routePath[i];
      const [lng2, lat2] = this.routePath[i + 1];

      const result = distanceAndNearestPointToSegment(
        location.longitude,
        location.latitude,
        lng1,
        lat1,
        lng2,
        lat2,
      );

      if (result.distance < minDistance) {
        minDistance = result.distance;
        nearestPoint = result.nearestPoint;
      }
    }

    const wasOffRoute = this.state.isOffRoute;
    this.state.isOffRoute = minDistance > this.options.offRouteThreshold;

    // 경로 이탈 상태 변경 시 음성 안내
    if (this.options.enableVoiceGuidance) {
      if (!wasOffRoute && this.state.isOffRoute) {
        console.log('[RouteGuidance] 경로 이탈:', minDistance.toFixed(2), 'm');
        await NavigationVoice.announceOffRoute();
        this.state.lastOffRouteWarningTime = Date.now();
      } else if (wasOffRoute && !this.state.isOffRoute) {
        console.log('[RouteGuidance] 경로 복귀');
        await NavigationVoice.announceBackOnRoute();
        this.state.lastOffRouteWarningTime = 0;
      } else if (this.state.isOffRoute && nearestPoint) {
        // 경로 이탈 중: 5초마다 복귀 방향 안내
        const now = Date.now();
        const timeSinceLastWarning = now - this.state.lastOffRouteWarningTime;

        if (timeSinceLastWarning >= 5000) {
          const returnDirection = this.calculateReturnDirection(
            location,
            nearestPoint,
          );
          if (returnDirection) {
            console.log(
              '[RouteGuidance] 복귀 방향 안내:',
              returnDirection,
              minDistance.toFixed(2),
              'm',
            );
            await NavigationVoice.announceReturnToRoute(
              returnDirection,
              minDistance,
            );
            this.state.lastOffRouteWarningTime = now;
          }
        }
      }
    }
  }

  /**
   * 거리별 음성 안내 (회전 안내 20m, 목적지 임박 100m)
   */
  private async announceDistanceGuidance(
    distanceToWaypoint: number,
  ): Promise<void> {
    if (!this.options.enableVoiceGuidance) {
      return;
    }

    // 회전 안내 (20m 전방)
    if (
      distanceToWaypoint <= this.options.turnWarningDistance &&
      distanceToWaypoint > this.options.waypointReachedThreshold &&
      !this.state.hasAnnouncedTurn &&
      this.state.currentWaypointIndex < this.waypoints.length - 1 // 마지막 경유지 제외
    ) {
      const turnDirection = this.calculateTurnDirection();
      if (turnDirection) {
        console.log('[RouteGuidance] 회전 안내:', turnDirection, distanceToWaypoint.toFixed(1), 'm');

        // ✅ U-Turn(반환점) 특화 안내
        if (turnDirection === 'uturn') {
          await NavigationVoice.announceUTurn(distanceToWaypoint);
        } else {
          await NavigationVoice.announceDirection(distanceToWaypoint, turnDirection);
        }

        this.state.hasAnnouncedTurn = true;
      }
    }

    // 마지막 경유지 (목적지) 임박 안내
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
      lastOffRouteWarningTime: 0,
      hasAnnounced100m: false,
      hasAnnouncedTurn: false,
      lastAnnouncedDistance: 0,
    };
  }
}

export default RouteGuidanceService;
