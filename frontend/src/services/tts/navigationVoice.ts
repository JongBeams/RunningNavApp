import ttsService from './ttsService';

/**
 * 방향 타입
 */
export type Direction = 'left' | 'right' | 'straight' | 'uturn';

/**
 * 러닝 네비게이션 음성 안내 서비스
 */
export class NavigationVoice {
  /**
   * 러닝 시작 안내
   */
  static async announceStart(courseName?: string): Promise<void> {
    const message = courseName
      ? `${courseName} 코스 러닝을 시작합니다.`
      : '러닝을 시작합니다.';
    await ttsService.speak(message);
  }

  /**
   * 러닝 종료 안내
   */
  static async announceFinish(
    distance: number,
    duration: number,
  ): Promise<void> {
    const distanceKm = (distance / 1000).toFixed(2);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    const message =
      seconds > 0
        ? `러닝을 완료했습니다. 총 거리 ${distanceKm}킬로미터, 시간 ${minutes}분 ${seconds}초입니다.`
        : `러닝을 완료했습니다. 총 거리 ${distanceKm}킬로미터, 시간 ${minutes}분입니다.`;

    await ttsService.speak(message);
  }

  /**
   * 방향 전환 안내
   */
  static async announceDirection(
    distance: number,
    direction: Direction,
  ): Promise<void> {
    const distanceText = this.formatDistance(distance);
    const directionText = this.getDirectionText(direction);

    const message = `${distanceText} 후 ${directionText}`;
    await ttsService.speak(message);
  }

  /**
   * U-Turn (반환점) 특화 안내
   */
  static async announceUTurn(distance: number): Promise<void> {
    const distanceText = this.formatDistance(distance);
    const message = `${distanceText} 후 반환점입니다. 뒤로 돌아가세요.`;
    await ttsService.speak(message);
  }

  /**
   * 목적지 도착 임박 안내
   */
  static async announceApproachingDestination(distance: number): Promise<void> {
    const distanceText = this.formatDistance(distance);
    const message = `${distanceText} 후 목적지입니다.`;
    await ttsService.speak(message);
  }

  /**
   * 목적지 도착 안내
   */
  static async announceArrival(): Promise<void> {
    const message = '목적지에 도착했습니다.';
    await ttsService.speak(message);
  }

  /**
   * 경로 이탈 안내
   */
  static async announceOffRoute(): Promise<void> {
    const message = '현재 잘못된 경로로 이동 중입니다.';
    await ttsService.speak(message);
  }

  /**
   * 경로 복귀 안내
   */
  static async announceBackOnRoute(): Promise<void> {
    const message = '경로로 돌아왔습니다.';
    await ttsService.speak(message);
  }

  /**
   * 경로 복귀 방향 안내
   */
  static async announceReturnToRoute(
    direction: 'forward' | 'backward' | 'left' | 'right',
    distance: number,
  ): Promise<void> {
    const directionText = {
      forward: '앞쪽',
      backward: '뒤쪽',
      left: '좌측',
      right: '우측',
    }[direction];

    const distanceText = Math.round(distance);

    const message = `${directionText}으로 ${distanceText}미터 이동하세요.`;
    await ttsService.speak(message);
  }

  /**
   * 일시정지 안내
   */
  static async announcePause(): Promise<void> {
    const message = '러닝을 일시정지합니다.';
    await ttsService.speak(message);
  }

  /**
   * 재개 안내
   */
  static async announceResume(): Promise<void> {
    const message = '러닝을 재개합니다.';
    await ttsService.speak(message);
  }

  /**
   * 구간 기록 안내 (1km마다)
   */
  static async announceDistance(
    distance: number,
    elapsedTime: number,
  ): Promise<void> {
    const distanceKm = Math.floor(distance / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;

    const timeText =
      seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`;

    const message = `${distanceKm}킬로미터 통과, 경과 시간 ${timeText}입니다.`;
    await ttsService.speak(message);
  }

  /**
   * 페이스 안내 (km당 시간)
   */
  static async announcePace(secondsPerKm: number): Promise<void> {
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = secondsPerKm % 60;

    const paceText =
      seconds > 0
        ? `${minutes}분 ${seconds}초`
        : `${minutes}분`;

    const message = `현재 페이스는 킬로미터당 ${paceText}입니다.`;
    await ttsService.speak(message);
  }

  /**
   * 경유지 도착 안내
   */
  static async announceWaypointReached(
    waypointNumber: number,
    totalWaypoints: number,
  ): Promise<void> {
    const message = `${waypointNumber}번째 경유지에 도착했습니다. ${totalWaypoints - waypointNumber}개의 경유지가 남았습니다.`;
    await ttsService.speak(message);
  }

  /**
   * GPS 신호 약함 경고
   */
  static async announceWeakGPS(): Promise<void> {
    const message = 'GPS 신호가 약합니다.';
    await ttsService.speak(message);
  }

  /**
   * 거리를 자연스러운 한국어로 변환
   */
  private static formatDistance(meters: number): string {
    if (meters < 50) {
      return '곧';
    } else if (meters < 100) {
      return `약 ${Math.round(meters / 10) * 10}미터`;
    } else if (meters < 1000) {
      return `${Math.round(meters / 50) * 50}미터`;
    } else {
      const km = (meters / 1000).toFixed(1);
      return `${km}킬로미터`;
    }
  }

  /**
   * 방향을 한국어로 변환
   */
  private static getDirectionText(direction: Direction): string {
    switch (direction) {
      case 'left':
        return '좌회전입니다';
      case 'right':
        return '우회전입니다';
      case 'straight':
        return '직진입니다';
      case 'uturn':
        return '유턴입니다';
      default:
        return '계속 진행하세요';
    }
  }

  /**
   * 사용자 정의 메시지 안내
   */
  static async announceCustom(message: string): Promise<void> {
    await ttsService.speak(message);
  }

  /**
   * 음성 안내 중지
   */
  static async stop(): Promise<void> {
    await ttsService.stop();
  }
}

export default NavigationVoice;
