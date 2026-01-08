import {useState, useEffect, useRef, useCallback} from 'react';
import {Platform, PermissionsAndroid} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {LocationData} from '../services/location';
import {useCompassHeading} from './useCompassHeading';

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
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  pauseTracking: () => void;
  resumeTracking: () => void;
  resetTracking: () => void;
  setInitialLocation: (location: LocationData) => void;
}

/**
 * 위치 권한 요청
 */
async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: '위치 권한 요청',
        message: '러닝 기록을 위해 위치 정보가 필요합니다.',
        buttonNeutral: '나중에',
        buttonNegative: '거부',
        buttonPositive: '허용',
      },
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('[LocationTracking] 위치 권한 허용됨');
      return true;
    } else {
      console.log('[LocationTracking] 위치 권한 거부됨');
      return false;
    }
  } catch (err) {
    console.error('[LocationTracking] 위치 권한 요청 실패:', err);
    return false;
  }
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
  const watchId = useRef<number | null>(null); // watchPosition ID
  const lastLocation = useRef<LocationData | null>(null);
  const compassHeadingRef = useRef<number | null>(null);
  const processLocationRef = useRef<((location: LocationData) => void) | null>(null);

  // 나침반 센서 (러닝 중일 때만 활성화)
  const compassHeading = useCompassHeading(isTracking && !isPaused);

  // 나침반 값을 ref에 저장하고, 정지 상태일 때 UI 즉시 업데이트
  useEffect(() => {
    compassHeadingRef.current = compassHeading;

    // 정지 상태에서 방향만 변경 시 즉시 UI 업데이트
    if (isTracking && !isPaused && compassHeading !== null) {
      setCurrentLocation(prev => {
        if (!prev) return prev;

        const currentSpeed = prev.speed || 0;
        const isMovingFast = currentSpeed > 0.5;

        // 느리게 이동하거나 정지 상태일 때만
        if (!isMovingFast) {
          const prevHeading = prev.heading || 0;
          const headingDiff = Math.abs(prevHeading - compassHeading);

          // 5도 이상 차이나면 업데이트 (무한 루프 방지 + 노이즈 필터링)
          if (headingDiff > 5 && headingDiff < 355) {
            console.log('[LocationTracking] 나침반으로 방향만 업데이트:', compassHeading.toFixed(1), '도');
            return {...prev, heading: compassHeading};
          }
        }

        return prev;
      });
    }
  }, [compassHeading, isTracking, isPaused]);

  // 위치 데이터 처리 (watchPosition 콜백에서 사용)
  const processLocation = useCallback(
    (location: LocationData) => {
      console.log('[LocationTracking] 위치 처리:', {
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy,
        heading: location.heading,
        speed: location.speed,
      });

      // ✅ GPS 정확도 필터링: accuracy가 20m 이상이면 무시 (저품질 데이터 제거)
      if (location.accuracy > 20) {
        console.warn('[LocationTracking] GPS 정확도 낮음, 무시:', location.accuracy.toFixed(1), 'm');
        return;
      }

      // 첫 위치인 경우 나침반 방향 사용
      if (!lastLocation.current && compassHeadingRef.current !== null) {
        location = {...location, heading: compassHeadingRef.current};
        console.log('[LocationTracking] 첫 위치 - 나침반 방향 사용:', compassHeadingRef.current.toFixed(1), '도');
      }

      // 최소 이동 거리 체크
      if (lastLocation.current) {
        const distance = calculateDistance(
          lastLocation.current.latitude,
          lastLocation.current.longitude,
          location.latitude,
          location.longitude,
        );

        // heading 결정 우선순위
        const currentSpeed = location.speed || 0;
        const isMovingFast = currentSpeed > 0.5;

        if (isMovingFast && location.heading !== null && location.heading !== undefined) {
          console.log('[LocationTracking] GPS 방향:', location.heading.toFixed(1), '도 (속도:', currentSpeed.toFixed(2), 'm/s)');
        } else if (compassHeadingRef.current !== null) {
          location = {...location, heading: compassHeadingRef.current};
          console.log('[LocationTracking] 나침반 방향:', compassHeadingRef.current.toFixed(1), '도 (속도:', currentSpeed.toFixed(2), 'm/s)');
        } else if (lastLocation.current) {
          const calculatedBearing = calculateBearing(
            lastLocation.current.latitude,
            lastLocation.current.longitude,
            location.latitude,
            location.longitude,
          );
          location = {...location, heading: calculatedBearing};
          console.log('[LocationTracking] 방향 계산:', calculatedBearing.toFixed(1), '도');
        } else {
          console.log('[LocationTracking] 방향 정보 없음');
        }

        if (distance < minDistance) {
          console.log('[LocationTracking] 이동 거리 부족, 방향만 업데이트:', distance.toFixed(2), 'm');

          // 방향 정보는 업데이트 (거리는 누적하지 않음)
          const updatedLocation = {
            ...lastLocation.current,
            heading: location.heading,
            timestamp: location.timestamp,
            speed: location.speed,
            accuracy: location.accuracy,
          };
          setCurrentLocation(updatedLocation);

          // ✅ FIX: minDistance 미만이어도 콜백 호출 (경로 안내 위해 필수)
          onLocationUpdate?.(updatedLocation);
          return;
        }

        // 거리 누적
        setTotalDistance(prev => prev + distance);

        // 속도 계산 (m/s)
        if (location.speed !== undefined && location.speed !== null) {
          setCurrentSpeed(location.speed);
        } else {
          const timeDiff = (location.timestamp - lastLocation.current.timestamp) / 1000;
          if (timeDiff > 0) {
            const speed = distance / timeDiff;
            setCurrentSpeed(speed);
          }
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
    },
    [minDistance, onLocationUpdate],
  );

  // processLocation을 ref에 저장 (useEffect 의존성 최적화)
  useEffect(() => {
    processLocationRef.current = processLocation;
  }, [processLocation]);

  // 추적 시작
  const startTracking = useCallback(async () => {
    console.log('[LocationTracking] 추적 시작');

    // GPS 권한 요청
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.error('[LocationTracking] 위치 권한 없음');
      setIsError(true);
      setErrorMessage('위치 권한이 필요합니다');
      return;
    }

    setIsTracking(true);
    setIsPaused(false);

    // watchPosition이 자동으로 첫 위치를 가져오므로 수동 호출 불필요
  }, []);

  // 추적 중지
  const stopTracking = useCallback(() => {
    console.log('[LocationTracking] 추적 중지');
    setIsTracking(false);
    setIsPaused(false);

    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
      console.log('[LocationTracking] watchPosition 중지');
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

    // watchPosition이 계속 실행 중이므로 수동 호출 불필요
  }, []);

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

  // 초기 위치 설정 (GPS 초기화 지연 방지용)
  const setInitialLocation = useCallback((location: LocationData) => {
    console.log('[LocationTracking] 초기 위치 설정:', {
      lat: location.latitude,
      lng: location.longitude,
      heading: location.heading,
    });
    setCurrentLocation(location);
    lastLocation.current = location;
  }, []);

  // watchPosition으로 실시간 위치 추적
  useEffect(() => {
    console.log('[LocationTracking] watchPosition useEffect 실행:', {
      isTracking,
      isPaused,
      updateInterval,
    });

    if (isTracking && !isPaused) {
      console.log('[LocationTracking] watchPosition 시작');

      watchId.current = Geolocation.watchPosition(
        (position) => {
          console.log('[LocationTracking] watchPosition 콜백 실행:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          });

          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };

          // 위치 처리 (ref 사용)
          processLocationRef.current?.(location);
        },
        (error) => {
          console.error('[LocationTracking] watchPosition 에러:', error);
          setIsError(true);
          setErrorMessage(error.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 3, // ✅ GPS 정확도 개선: 5m → 3m로 감소 (더 정밀한 위치 업데이트)
          timeout: 30000,
          maximumAge: 500, // ✅ GPS 정확도 개선: 1000ms → 500ms (오래된 데이터 방지)
          // Android 전용 옵션
          ...(Platform.OS === 'android' ? {
            interval: updateInterval,
            fastestInterval: 500,
          } : {}),
        },
      );

      console.log('[LocationTracking] watchPosition ID:', watchId.current);

      return () => {
        console.log('[LocationTracking] watchPosition 정리');
        if (watchId.current !== null) {
          Geolocation.clearWatch(watchId.current);
          watchId.current = null;
        }
      };
    } else {
      console.log('[LocationTracking] watchPosition 시작 조건 미충족');
      // 추적 중지 시 watch 정리
      if (watchId.current !== null) {
        console.log('[LocationTracking] 기존 watchPosition 정리');
        Geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    }
  }, [isTracking, isPaused, updateInterval]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
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
    setInitialLocation,
  };
}

export default useLocationTracking;
