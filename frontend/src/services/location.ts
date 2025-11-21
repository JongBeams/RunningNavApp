// 위치/권한 헬퍼 모듈: 권한 요청, 단발 위치 조회, 연속 추적, 설정 화면 이동을 제공합니다.
import Geolocation, {GeolocationOptions, GeolocationResponse} from '@react-native-community/geolocation';
import {Platform} from 'react-native';
import {check, request, RESULTS, PERMISSIONS, openSettings} from 'react-native-permissions';

type Coord = {latitude: number; longitude: number};

// 기본 위치 옵션(주로 Android에서 interval/fastestInterval 사용)
const defaultOptions: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 5000,
  distanceFilter: 10,
  interval: 5000,
  fastestInterval: 2000,
};

// 위치 권한을 확인 후 필요 시 요청; 하나라도 GRANTED면 true 반환
export async function ensureLocationPermission(): Promise<boolean> {
  const perm =
    Platform.OS === 'android'
      ? [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION, PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION]
      : [PERMISSIONS.IOS.LOCATION_WHEN_IN_USE];

  const results = await Promise.all(perm.map(p => check(p)));
  const has = results.some(r => r === RESULTS.GRANTED);
  if (has) return true;

  const requested = await Promise.all(perm.map(p => request(p)));
  return requested.some(r => r === RESULTS.GRANTED);
}

// 현재 위치를 한 번 가져와 좌표만 반환하는 Promise 래퍼
export function getCurrentLocation(options: GeolocationOptions = defaultOptions): Promise<Coord> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => resolve({latitude: pos.coords.latitude, longitude: pos.coords.longitude}),
      err => reject(err),
      options,
    );
  });
}

// 위치 변경을 구독; 콜백으로 좌표와 원본 응답을 넘기고 watch ID를 반환
export function startLocationWatch(
  onUpdate: (coord: Coord, raw: GeolocationResponse) => void,
  options: GeolocationOptions = defaultOptions,
): number {
  return Geolocation.watchPosition(
    pos => onUpdate({latitude: pos.coords.latitude, longitude: pos.coords.longitude}, pos),
    err => console.warn('watchPosition error', err),
    options,
  );
}

// watch ID로 구독 해제
export function stopLocationWatch(id: number) {
  Geolocation.clearWatch(id);
}

// 권한이 차단된 경우 설정 화면으로 이동하는 헬퍼
export function openLocationSettings() {
  return openSettings();
}
