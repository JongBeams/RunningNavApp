import {useState, useEffect, useRef, useCallback} from 'react';
import {CourseResponse, geoJsonToWaypoints} from '../services/api/courseApi';
import useLocationTracking from './useLocationTracking';
import useTTS from './useTTS';
import RouteGuidanceService, {Waypoint} from '../services/tts/routeGuidance';
import NavigationVoice from '../services/tts/navigationVoice';

/**
 * 러닝 세션 상태
 */
export enum RunningSessionStatus {
  IDLE = 'IDLE', // 대기 중
  RUNNING = 'RUNNING', // 러닝 중
  PAUSED = 'PAUSED', // 일시정지
  COMPLETED = 'COMPLETED', // 완료
}

/**
 * 러닝 세션 통계
 */
export interface RunningSessionStats {
  elapsedTime: number; // 경과 시간 (초)
  distance: number; // 이동 거리 (미터)
  speed: number; // 현재 속도 (m/s)
  pace: number; // 페이스 (초/km)
  progress: number; // 진행률 (0-100)
  distanceToNext: number; // 다음 경유지까지 거리 (미터)
}

/**
 * 러닝 세션 Hook 반환 타입
 */
export interface UseRunningSessionReturn {
  // 상태
  status: RunningSessionStatus;
  stats: RunningSessionStats;
  isOffRoute: boolean;
  currentWaypointIndex: number;
  currentLat: number | undefined;
  currentLng: number | undefined;

  // 제어 메서드
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;

  // 설정
  toggleVoiceGuidance: () => void;
  isVoiceGuidanceEnabled: boolean;
}

/**
 * 러닝 세션 Hook
 *
 * 러닝 네비게이션의 전체 상태를 관리하는 통합 hook
 * - 위치 추적
 * - 경로 안내
 * - 음성 안내 (TTS)
 * - 러닝 통계
 *
 * @example
 * ```tsx
 * function RunningScreen({ course }) {
 *   const {
 *     status,
 *     stats,
 *     start,
 *     pause,
 *     stop,
 *   } = useRunningSession(course);
 *
 *   return (
 *     <View>
 *       <Text>시간: {stats.elapsedTime}</Text>
 *       <Text>거리: {stats.distance}m</Text>
 *       <Button onPress={start} title="시작" />
 *     </View>
 *   );
 * }
 * ```
 */
export function useRunningSession(
  course: CourseResponse,
): UseRunningSessionReturn {
  // 상태
  const [status, setStatus] = useState<RunningSessionStatus>(
    RunningSessionStatus.IDLE,
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isVoiceGuidanceEnabled, setIsVoiceGuidanceEnabled] = useState(true);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [distanceToNext, setDistanceToNext] = useState(0);
  const [isOffRoute, setIsOffRoute] = useState(false);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const routeGuidanceRef = useRef<RouteGuidanceService | null>(null);
  const hasStartedRef = useRef(false);

  // TTS Hook
  const {speak: ttsSpeak, isInitialized: ttsInitialized} = useTTS({
    autoInitialize: true,
  });

  // 위치 추적 Hook
  const {
    totalDistance,
    currentSpeed,
    currentLocation,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    resetTracking,
  } = useLocationTracking({
    updateInterval: 3000,
    minDistance: 5,
    enabled: false,
    onLocationUpdate: async location => {
      // 위치 업데이트 시 경로 안내 업데이트
      if (routeGuidanceRef.current && status === RunningSessionStatus.RUNNING) {
        await routeGuidanceRef.current.updateLocation(
          location,
          totalDistance,
          elapsedTime,
        );

        // 경로 안내 상태 동기화
        const guidanceState = routeGuidanceRef.current.getState();
        setCurrentWaypointIndex(guidanceState.currentWaypointIndex);
        setDistanceToNext(guidanceState.distanceToNextWaypoint);
        setIsOffRoute(guidanceState.isOffRoute);
      }
    },
  });

  // 경로 안내 서비스 초기화
  useEffect(() => {
    try {
      const waypoints = geoJsonToWaypoints(course.waypointsGeoJson);
      const routeData = JSON.parse(course.routeGeoJson);
      const routePath = routeData.coordinates;

      routeGuidanceRef.current = new RouteGuidanceService(
        waypoints,
        routePath,
        {
          enableVoiceGuidance: isVoiceGuidanceEnabled,
        },
      );

      console.log('[RunningSession] 경로 안내 서비스 초기화 완료');
    } catch (error) {
      console.error('[RunningSession] 경로 안내 서비스 초기화 실패:', error);
    }
  }, [course, isVoiceGuidanceEnabled]);

  // 타이머
  useEffect(() => {
    if (status === RunningSessionStatus.RUNNING) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [status]);

  // 러닝 시작
  const start = useCallback(async () => {
    if (hasStartedRef.current) {
      console.warn('[RunningSession] 이미 시작됨');
      return;
    }

    console.log('[RunningSession] 시작');
    setStatus(RunningSessionStatus.RUNNING);
    hasStartedRef.current = true;

    // 위치 추적 시작
    startTracking();

    // 음성 안내
    if (isVoiceGuidanceEnabled) {
      await NavigationVoice.announceStart(course.name);
    }
  }, [
    course.name,
    isVoiceGuidanceEnabled,
    startTracking,
  ]);

  // 일시정지
  const pause = useCallback(async () => {
    console.log('[RunningSession] 일시정지');
    setStatus(RunningSessionStatus.PAUSED);

    // 위치 추적 일시정지
    pauseTracking();

    // 음성 안내
    if (isVoiceGuidanceEnabled) {
      await NavigationVoice.announcePause();
    }
  }, [isVoiceGuidanceEnabled, pauseTracking]);

  // 재개
  const resume = useCallback(async () => {
    console.log('[RunningSession] 재개');
    setStatus(RunningSessionStatus.RUNNING);

    // 위치 추적 재개
    resumeTracking();

    // 음성 안내
    if (isVoiceGuidanceEnabled) {
      await NavigationVoice.announceResume();
    }
  }, [isVoiceGuidanceEnabled, resumeTracking]);

  // 중지
  const stop = useCallback(async () => {
    console.log('[RunningSession] 중지');
    setStatus(RunningSessionStatus.COMPLETED);

    // 위치 추적 중지
    stopTracking();

    // 타이머 정리
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 음성 안내
    if (isVoiceGuidanceEnabled) {
      await NavigationVoice.announceFinish(totalDistance, elapsedTime);
    }

    // TODO: 러닝 기록 저장 API 호출
  }, [
    isVoiceGuidanceEnabled,
    totalDistance,
    elapsedTime,
    stopTracking,
  ]);

  // 음성 안내 토글
  const toggleVoiceGuidance = useCallback(() => {
    const newValue = !isVoiceGuidanceEnabled;
    setIsVoiceGuidanceEnabled(newValue);

    if (routeGuidanceRef.current) {
      routeGuidanceRef.current.setVoiceGuidanceEnabled(newValue);
    }

    console.log('[RunningSession] 음성 안내:', newValue ? '활성화' : '비활성화');
  }, [isVoiceGuidanceEnabled]);

  // 페이스 계산 (초/km)
  const calculatePace = useCallback((): number => {
    if (totalDistance === 0 || elapsedTime === 0) return 0;
    const km = totalDistance / 1000;
    return elapsedTime / km; // 초/km
  }, [totalDistance, elapsedTime]);

  // 진행률 계산
  const calculateProgress = useCallback((): number => {
    if (course.distance === 0) return 0;
    return Math.min((totalDistance / course.distance) * 100, 100);
  }, [totalDistance, course.distance]);

  // 통계
  const stats: RunningSessionStats = {
    elapsedTime,
    distance: totalDistance,
    speed: currentSpeed,
    pace: calculatePace(),
    progress: calculateProgress(),
    distanceToNext,
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopTracking();
    };
  }, [stopTracking]);

  return {
    status,
    stats,
    isOffRoute,
    currentWaypointIndex,
    currentLat: currentLocation?.latitude,
    currentLng: currentLocation?.longitude,
    start,
    pause,
    resume,
    stop,
    toggleVoiceGuidance,
    isVoiceGuidanceEnabled,
  };
}

export default useRunningSession;
