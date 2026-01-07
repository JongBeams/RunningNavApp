import {useState, useEffect, useRef, useCallback} from 'react';
import {Alert} from 'react-native';
import {CourseResponse, geoJsonToWaypoints} from '../services/api/courseApi';
import {createRunningRecord} from '../services/api/runningRecordApi';
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
  currentHeading: number | null | undefined;

  // 제어 메서드
  start: (initialLocation?: {latitude: number; longitude: number; heading?: number | null}) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: (saveRecord?: boolean, isCompleted?: boolean) => Promise<void>;

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
  const startTimeRef = useRef<string | null>(null);

  // TTS Hook
  const {speak: ttsSpeak, isInitialized: ttsInitialized} = useTTS({
    autoInitialize: true,
  });

  // 위치 추적 Hook
  const {
    totalDistance,
    currentSpeed,
    currentLocation,
    locationHistory,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    setInitialLocation,
  } = useLocationTracking({
    updateInterval: 1000, // 1초마다 위치 갱신
    minDistance: 5,
    enabled: false,
    onLocationUpdate: async location => {
      // 위치 업데이트 시 경로 안내 업데이트
      if (routeGuidanceRef.current && status === RunningSessionStatus.RUNNING) {
        const isCompleted = await routeGuidanceRef.current.updateLocation(
          location,
          totalDistance,
          elapsedTime,
        );

        // 경로 안내 상태 동기화
        const guidanceState = routeGuidanceRef.current.getState();
        setCurrentWaypointIndex(guidanceState.currentWaypointIndex);
        setDistanceToNext(guidanceState.distanceToNextWaypoint);
        setIsOffRoute(guidanceState.isOffRoute);

        // ✅ 완주 처리
        if (isCompleted) {
          console.log('[RunningSession] 코스 완주!');
          // 자동으로 stop 호출 (기록 저장, 완주 처리)
          await stop(true, true);
        }
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
          offRouteThreshold: 5, // ✅ FIX: 경로 이탈 판정 거리를 5m로 설정 (GPS 오차 및 도로 폭 고려)
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
      console.log('[RunningSession] 타이머 시작');
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          console.log('[RunningSession] 경과 시간:', newTime, '초');
          return newTime;
        });
      }, 1000);

      return () => {
        console.log('[RunningSession] 타이머 정리');
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    } else if (status === RunningSessionStatus.PAUSED) {
      // 일시정지 시 타이머만 멈춤 (elapsedTime은 유지)
      console.log('[RunningSession] 타이머 일시정지');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [status]);

  // 러닝 시작
  const start = useCallback(async (initialLocation?: {latitude: number; longitude: number; heading?: number | null}) => {
    if (hasStartedRef.current) {
      console.warn('[RunningSession] 이미 시작됨');
      return;
    }

    console.log('[RunningSession] 시작', initialLocation ? '(초기 위치 제공됨)' : '');
    setStatus(RunningSessionStatus.RUNNING);
    hasStartedRef.current = true;

    // 시작 시간 기록 (ISO 8601 format)
    startTimeRef.current = new Date().toISOString();

    // ✅ FIX: 초기 위치가 제공되면 즉시 설정 (GPS 초기화 지연 방지)
    if (initialLocation) {
      console.log('[RunningSession] 초기 위치 설정:', initialLocation);
      setInitialLocation({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        heading: initialLocation.heading ?? null,
        altitude: null,
        accuracy: 0, // 초기 위치는 정확도 정보 없음
        altitudeAccuracy: null,
        speed: null,
        timestamp: Date.now(),
      });
    }

    // 위치 추적 시작 (권한 요청 포함)
    console.log('[RunningSession] 위치 추적 시작 중...');
    await startTracking();
    console.log('[RunningSession] 위치 추적 시작 완료');

    // 음성 안내 (에러 방지)
    if (isVoiceGuidanceEnabled) {
      try {
        await NavigationVoice.announceStart(course.name);
      } catch (error) {
        console.error('[RunningSession] 음성 안내 실패:', error);
      }
    }
  }, [
    course.name,
    isVoiceGuidanceEnabled,
    startTracking,
    setInitialLocation,
  ]);

  // 일시정지
  const pause = useCallback(async () => {
    console.log('[RunningSession] 일시정지');
    setStatus(RunningSessionStatus.PAUSED);

    // 위치 추적 일시정지
    pauseTracking();

    // 음성 안내 (에러 방지)
    if (isVoiceGuidanceEnabled) {
      try {
        await NavigationVoice.announcePause();
      } catch (error) {
        console.error('[RunningSession] 음성 안내 실패:', error);
      }
    }
  }, [isVoiceGuidanceEnabled, pauseTracking]);

  // 재개
  const resume = useCallback(async () => {
    console.log('[RunningSession] 재개');
    setStatus(RunningSessionStatus.RUNNING);

    // 위치 추적 재개
    resumeTracking();

    // 음성 안내 (에러 방지)
    if (isVoiceGuidanceEnabled) {
      try {
        await NavigationVoice.announceResume();
      } catch (error) {
        console.error('[RunningSession] 음성 안내 실패:', error);
      }
    }
  }, [isVoiceGuidanceEnabled, resumeTracking]);

  // 중지
  const stop = useCallback(async (saveRecord: boolean = true, isCompleted: boolean = false) => {
    console.log('[RunningSession] 중지 (기록 저장:', saveRecord, ', 완주:', isCompleted, ')');

    // ✅ FIX: 완주한 경우만 COMPLETED 상태로 변경, 그 외에는 IDLE로 변경
    setStatus(isCompleted ? RunningSessionStatus.COMPLETED : RunningSessionStatus.IDLE);

    // 위치 추적 중지
    stopTracking();

    // 타이머 정리
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 음성 안내 (에러 방지)
    if (isVoiceGuidanceEnabled) {
      try {
        await NavigationVoice.announceFinish(totalDistance, elapsedTime);
      } catch (error) {
        console.error('[RunningSession] 음성 안내 실패:', error);
      }
    }

    // 러닝 기록 저장 (saveRecord가 true일 때만)
    if (saveRecord) {
      try {
        if (!startTimeRef.current) {
          console.warn('[RunningSession] 시작 시간 없음, 기록 저장 생략');
          return;
        }

        const endTime = new Date().toISOString();

        // 위치 기록을 좌표 배열로 변환 [[lng, lat], ...]
        const routeCoordinates = locationHistory.map(loc => [
          loc.longitude,
          loc.latitude,
        ]);

        // 평균 속도 계산 (m/s)
        const avgSpeed = elapsedTime > 0 ? totalDistance / elapsedTime : 0;

        // 페이스 계산 (초/km)
        const avgPace =
          totalDistance > 0 ? (elapsedTime / (totalDistance / 1000)) : 0;

        console.log('[RunningSession] 러닝 기록 저장 시작', {
          courseId: course.id,
          startTime: startTimeRef.current,
          endTime,
          distance: totalDistance,
          duration: elapsedTime,
          avgPace,
          avgSpeed,
          routePoints: routeCoordinates.length,
        });

        await createRunningRecord({
          courseId: course.id,
          startTime: startTimeRef.current,
          endTime,
          distance: totalDistance,
          duration: elapsedTime,
          avgPace,
          avgSpeed,
          routeCoordinates,
        });

        console.log('[RunningSession] 러닝 기록 저장 완료');
        Alert.alert('완료', '러닝 기록이 저장되었습니다.');
      } catch (error) {
        console.error('[RunningSession] 러닝 기록 저장 실패:', error);
        Alert.alert('오류', '러닝 기록 저장에 실패했습니다.');
      }
    } else {
      console.log('[RunningSession] 기록 저장 생략됨');
    }
  }, [
    isVoiceGuidanceEnabled,
    totalDistance,
    elapsedTime,
    locationHistory,
    course.id,
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

  // 디버그: currentLocation 변경 감지
  useEffect(() => {
    console.log('[RunningSession] currentLocation 변경:', {
      lat: currentLocation?.latitude,
      lng: currentLocation?.longitude,
      heading: currentLocation?.heading,
    });
  }, [currentLocation]);

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
    currentHeading: currentLocation?.heading,
    start,
    pause,
    resume,
    stop,
    toggleVoiceGuidance,
    isVoiceGuidanceEnabled,
  };
}

export default useRunningSession;
