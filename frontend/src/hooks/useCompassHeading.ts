import {useState, useEffect} from 'react';
import CompassHeading from 'react-native-compass-heading';

/**
 * 나침반 방향 Hook
 *
 * 디바이스가 바라보는 방향을 실시간으로 추적합니다.
 * GPS heading과 달리 정지 상태에서도 작동합니다.
 */
export function useCompassHeading(enabled: boolean = false) {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    console.log('[CompassHeading] 나침반 시작');

    // 나침반 시작
    const degreeUpdateRate = 1; // 업데이트 빈도 (초)

    CompassHeading.start(degreeUpdateRate, (degree: {heading: number}) => {
      // 북쪽 기준 0-359도 범위로 정규화
      const normalizedHeading = ((degree.heading % 360) + 360) % 360;
      setHeading(normalizedHeading);
      console.log('[CompassHeading] 방향:', normalizedHeading.toFixed(1), '도');
    });

    // 클린업
    return () => {
      console.log('[CompassHeading] 나침반 중지');
      CompassHeading.stop();
    };
  }, [enabled]);

  return heading;
}

export default useCompassHeading;
