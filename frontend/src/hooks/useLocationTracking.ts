import {useState, useEffect, useRef, useCallback} from 'react';
import {getCurrentLocation, LocationData} from '../services/location';

/**
 * 위치 추적 옵션
 */
export interface LocationTrackingOptions {
  updateInterval?: number; // 위치 업데이트 간격 (밀리초, 기본값: 3000ms = 3초)
  minDistance?: number; // 최소 이동 거리 (미터, 기본값: 5m)
  enabled?: boolean; // 추적 활성화 여부 (기본값: false)
  onLocationUpdate?: (location: LocationData) => void; // 위치 업데이트 콜백
  onError?: (error: any) => void; // 에러 콜백
}

/**
 * 위치 추적 결과 타입
 */
export interface LocationTrackingResult {
  // 현재 위치
  currentLocation: LocationData | null;

  // 위치 기록
  locationHistory: LocationData[];

  // 통계
  totalDistance: number; // 총 이동 거리 (미터)
  currentSpeed: number; // 현재 속도 (m/s)

  // 상태
  isTracking: boolean;
  isError: boolean;
  errorMessage: string | null;

  // 제어 메서드
  startTracking: () => void;
  stopTracking: () => void;
  pauseTracking: () => void;
  resumeTracking: () => void;
  resetTracking: () => void;
}

/**
 * 두 지점 간 거리 계산 (Haversine formula)
 * @param lat1 첫 번째 지점 위도
 * @param lon1 첫 번째 지점 경도
 * @param lat2 두 번째 지점 위도
 * @param lon2 두 번째 지점 경도
 * @returns 거리 (미터)
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
 * 두 지점 간 방향(bearing) 계산
 * @param lat1 시작 지점 위도
 * @param lon1 시작 지점 경도
 * @param lat2 도착 지점 위도
 * @param lon2 도착 지점 경도
 * @returns 방향 (0-359도, 북쪽이 0도)
 */
function calculateBearing(
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
 * 실시간 위치 추적 Hook
 *
 * GPS를 이용한 실시간 위치 추적 및 이동 거리 계산 기능 제공
 *
 * @example
 * ```tsx
 * function RunningScreen() {
 *   const {
 *     currentLocation,
 *     totalDistance,
 *     currentSpeed,
 *     startTracking,
 *     stopTracking,
 *   } = useLocationTracking({
 *     updateInterval: 3000,
 *     onLocationUpdate: (loc) => console.log('위치 업데이트:', loc),
 *   });
 *
 *   return (
 *     <View>
 *       <Text>거리: {totalDistance}m</Text>
 *       <Text>속도: {currentSpeed}m/s</Text>
 *       <Button onPress={startTracking} title="시작" />
 *     </View>
 *   );
 * }
 * ```
 */
export function useLocationTracking(
  options?: LocationTrackingOptions,
): LocationTrackingResult {
  const {
    updateInterval = 3000,
    minDistance = 5,
    enabled = false,
    onLocationUpdate,
    onError,
  } = options || {};

  // 상태
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null,
  );
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isTracking, setIsTracking] = useState(enabled);
  const [isPaused, setIsPaused] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const lastLocation = useRef<LocationData | null>(null);

  // 위치 업데이트 처리
  const handleLocationUpdate = useCallback(
    async (force: boolean = false) => {
      if (!isTracking || isPaused) {
        return;
      }

      try {
        let location = await getCurrentLocation();

        // 최소 이동 거리 체크
        if (lastLocation.current && !force) {
          const distance = calculateDistance(
            lastLocation.current.latitude,
            lastLocation.current.longitude,
            location.latitude,
            location.longitude,
          );

          if (distance < minDistance) {
            console.log(
              '[LocationTracking] 이동 거리 부족:',
              distance.toFixed(2),
              'm',
            );
            return;
          }

          // 거리 누적
          setTotalDistance(prev => prev + distance);

          // 속도 계산 (m/s)
          if (location.speed !== undefined && location.speed !== null) {
            setCurrentSpeed(location.speed);
          } else {
            // speed 정보가 없으면 시간 차이로 계산
            const timeDiff =
              (location.timestamp - lastLocation.current.timestamp) / 1000; // 초
            if (timeDiff > 0) {
              const speed = distance / timeDiff;
              setCurrentSpeed(speed);
            }
          }

          // heading이 null이면 이동 방향 계산
          if (location.heading === null || location.heading === undefined) {
            const calculatedBearing = calculateBearing(
              lastLocation.current.latitude,
              lastLocation.current.longitude,
              location.latitude,
              location.longitude,
            );
            location = {...location, heading: calculatedBearing};
            console.log('[LocationTracking] 방향 계산:', calculatedBearing.toFixed(1), '도');
          }

          console.log('[LocationTracking] 이동:', distance.toFixed(2), 'm');
        }

        // 위치 업데이트
        setCurrentLocation(location);
        setLocationHistory(prev => [...prev, location]);
        lastLocation.current = location;
        setIsError(false);
        setErrorMessage(null);

        // 콜백 호출
        onLocationUpdate?.(location);

        console.log('[LocationTracking] 위치 업데이트:', {
          lat: location.latitude,
          lng: location.longitude,
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading,
        });
      } catch (error: any) {
        console.error('[LocationTracking] 위치 업데이트 실패:', error);
        setIsError(true);
        setErrorMessage(error.message || '위치를 가져올 수 없습니다');
        onError?.(error);
      }
    },
    [isTracking, isPaused, minDistance, onLocationUpdate, onError],
  );

  // 추적 시작
  const startTracking = useCallback(() => {
    console.log('[LocationTracking] 추적 시작');
    setIsTracking(true);
    setIsPaused(false);

    // 즉시 첫 위치 가져오기
    handleLocationUpdate(true);
  }, [handleLocationUpdate]);

  // 추적 중지
  const stopTracking = useCallback(() => {
    console.log('[LocationTracking] 추적 중지');
    setIsTracking(false);
    setIsPaused(false);

    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
      trackingInterval.current = null;
    }
  }, []);

  // 추적 일시정지
  const pauseTracking = useCallback(() => {
    console.log('[LocationTracking] 추적 일시정지');
    setIsPaused(true);
  }, []);

  // 추적 재개
  const resumeTracking = useCallback(() => {
    console.log('[LocationTracking] 추적 재개');
    setIsPaused(false);

    // 재개 시 즉시 위치 업데이트
    handleLocationUpdate(true);
  }, [handleLocationUpdate]);

  // 추적 리셋
  const resetTracking = useCallback(() => {
    console.log('[LocationTracking] 추적 리셋');
    setCurrentLocation(null);
    setLocationHistory([]);
    setTotalDistance(0);
    setCurrentSpeed(0);
    setIsError(false);
    setErrorMessage(null);
    lastLocation.current = null;
  }, []);

  // 주기적인 위치 업데이트
  useEffect(() => {
    if (isTracking && !isPaused) {
      trackingInterval.current = setInterval(() => {
        handleLocationUpdate();
      }, updateInterval);

      return () => {
        if (trackingInterval.current) {
          clearInterval(trackingInterval.current);
        }
      };
    }
  }, [isTracking, isPaused, updateInterval, handleLocationUpdate]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
    };
  }, []);

  return {
    currentLocation,
    locationHistory,
    totalDistance,
    currentSpeed,
    isTracking,
    isError,
    errorMessage,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    resetTracking,
  };
}

export default useLocationTracking;
