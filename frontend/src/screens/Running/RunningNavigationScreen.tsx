import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../types/navigation';
import {
  colors,
  spacing,
  fontSize,
  commonStyles,
} from '../../styles';
import {AppConfig} from '../../config/appConfig';
import KakaoMapWebView from '../../components/map/KakaoMapWebView';
import {geoJsonToWaypoints} from '../../services/api/courseApi';
import useRunningSession, {RunningSessionStatus} from '../../hooks/useRunningSession';
import useLocationTracking from '../../hooks/useLocationTracking';
import {calculateDistance} from '../../utils/geoUtils';

type RunningNavigationScreenNav = NativeStackNavigationProp<
  RootStackParamList,
  'RunningNavigation'
>;

type RunningNavigationScreenRoute = RouteProp<
  RootStackParamList,
  'RunningNavigation'
>;

/**
 * 러닝 네비게이션 화면
 *
 * 선택된 코스를 따라 실시간으로 러닝 안내를 제공합니다.
 * - 실시간 위치 추적
 * - 음성 안내
 * - 경로 이탈 감지
 * - 러닝 기록 (거리, 시간, 페이스)
 */
export default function RunningNavigationScreen() {
  const navigation = useNavigation<RunningNavigationScreenNav>();
  const route = useRoute<RunningNavigationScreenRoute>();

  const {course} = route.params;

  // 미리보기용 위치 추적 (IDLE 상태에서도 작동)
  const previewTracking = useLocationTracking({
    updateInterval: 1000,
    minDistance: 0, // 미리보기는 거리 제한 없이 모든 위치 표시
    enabled: false,
  });

  // 러닝 세션 Hook
  const {
    status,
    stats,
    isOffRoute,
    currentLat,
    currentLng,
    currentHeading,
    start,
    pause,
    resume,
    stop,
    toggleVoiceGuidance,
    isVoiceGuidanceEnabled,
  } = useRunningSession(course);

  // 화면 진입 시 미리보기 추적 시작
  useEffect(() => {
    console.log('[RunningNav] 미리보기 위치 추적 시작');
    previewTracking.startTracking();

    return () => {
      console.log('[RunningNav] 미리보기 위치 추적 중지');
      previewTracking.stopTracking();
    };
  }, []);

  // 디버그: 위치 변경 감지
  useEffect(() => {
    console.log('[RunningNav] 위치 업데이트:', {
      currentLat,
      currentLng,
      currentHeading,
    });
  }, [currentLat, currentLng, currentHeading]);

  // ✅ 완주 감지 및 축하 UI
  useEffect(() => {
    if (status === RunningSessionStatus.COMPLETED) {
      console.log('[RunningNav] 코스 완주 - 축하 팝업 표시');

      Alert.alert(
        '🎉 완주 축하합니다!',
        `총 거리: ${(stats.distance / 1000).toFixed(2)}km\n` +
          `소요 시간: ${formatTime(stats.elapsedTime)}\n` +
          `평균 페이스: ${formatPace(stats.pace)}`,
        [
          {
            text: '확인',
            onPress: () => {
              console.log('[RunningNav] 완주 확인 - 러닝 홈으로 이동');
              // ✅ FIX: goBack() 대신 명시적으로 MainTabs의 Running 화면으로 이동
              navigation.navigate('MainTabs', {screen: 'Running'});
            },
          },
        ],
        {cancelable: false},
      );
    }
  }, [status, stats, navigation]);

  // 코스 정보 파싱
  const startCoords = getStartCoordinates();
  const endCoords = getEndCoordinates();
  const routePath = getRoutePath();

  // 뒤로가기 버튼 처리
  useEffect(() => {
    const onBackPress = () => {
      handleStop();
      return true;
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [status]);

  // 코스 시작 지점 좌표
  function getStartCoordinates() {
    try {
      const wps = geoJsonToWaypoints(course.waypointsGeoJson);
      if (wps.length > 0) {
        return {
          lat: wps[0].latitude,
          lng: wps[0].longitude,
        };
      }
    } catch (error) {
      console.error('[RunningNav] 시작 좌표 파싱 실패:', error);
    }
    return null;
  }

  // 코스 종료 지점 좌표
  function getEndCoordinates() {
    try {
      const wps = geoJsonToWaypoints(course.waypointsGeoJson);
      if (wps.length > 0) {
        return {
          lat: wps[wps.length - 1].latitude,
          lng: wps[wps.length - 1].longitude,
        };
      }
    } catch (error) {
      console.error('[RunningNav] 종료 좌표 파싱 실패:', error);
    }
    return null;
  }

  // 코스 경로 좌표
  function getRoutePath() {
    try {
      const routeData = JSON.parse(course.routeGeoJson);
      if (routeData.type === 'LineString' && routeData.coordinates) {
        return routeData.coordinates;
      }
    } catch (error) {
      console.error('[RunningNav] 경로 좌표 파싱 실패:', error);
    }
    return undefined;
  }

  // 러닝 시작
  const handleStart = async () => {
    // 1. 현재 위치 확인
    const currentLat = previewTracking.currentLocation?.latitude;
    const currentLng = previewTracking.currentLocation?.longitude;

    if (!currentLat || !currentLng) {
      Alert.alert('알림', '현재 위치를 가져올 수 없습니다.\n잠시 후 다시 시도해주세요.');
      return;
    }

    // 2. 출발지점 좌표
    const startCoords = getStartCoordinates();
    if (!startCoords) {
      Alert.alert('오류', '출발지 정보를 찾을 수 없습니다.');
      return;
    }

    // 3. 거리 계산
    const distanceToStart = calculateDistance(
      currentLat,
      currentLng,
      startCoords.lat,
      startCoords.lng,
    );

    console.log('[RunningNav] 출발지까지 거리:', distanceToStart.toFixed(1), 'm');

    // 4. 5m 이상이면 차단
    if (distanceToStart > 5) {
      Alert.alert(
        '출발 불가',
        `출발 지점에 위치하고 있지 않습니다.\n\n현재 거리: ${distanceToStart.toFixed(1)}m\n출발지로 이동해주세요.`,
      );
      return;
    }

    // 5. 러닝 시작 (현재 위치 전달)
    await start({
      latitude: currentLat,
      longitude: currentLng,
      heading: previewTracking.currentLocation?.heading,
    });
  };

  // 일시정지
  const handlePause = async () => {
    await pause();
  };

  // 재개
  const handleResume = async () => {
    await resume();
  };

  // 중지 및 저장
  const handleStop = () => {
    if (status !== RunningSessionStatus.IDLE) {
      Alert.alert(
        '러닝 종료',
        '러닝이 종료됩니다.\n기록을 저장하시겠습니까?',
        [
          {text: '취소', style: 'cancel'},
          {
            text: '아니오',
            style: 'destructive',
            onPress: async () => {
              await stop(false, false); // 기록 저장하지 않고 종료 (완주 아님)
              navigation.goBack();
            },
          },
          {
            text: '예',
            onPress: async () => {
              await stop(true, false); // 기록 저장하고 종료 (완주 아님)
              navigation.goBack();
            },
          },
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  // 시간 포맷팅 (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // 거리 포맷팅
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  // 페이스 포맷팅 (분/km)
  const formatPace = (secondsPerKm: number) => {
    if (secondsPerKm === 0 || !isFinite(secondsPerKm)) return '--:--';

    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isIdle = status === RunningSessionStatus.IDLE;
  const isPaused = status === RunningSessionStatus.PAUSED;

  // 표시할 위치 결정: IDLE이면 미리보기, 아니면 세션 위치
  // ✅ FIX: RUNNING 상태에서 session 위치가 null이면 preview 위치 사용 (초기화 지연 방지)
  const displayLat = isIdle
    ? previewTracking.currentLocation?.latitude
    : (currentLat ?? previewTracking.currentLocation?.latitude);
  const displayLng = isIdle
    ? previewTracking.currentLocation?.longitude
    : (currentLng ?? previewTracking.currentLocation?.longitude);
  const displayHeading = isIdle
    ? previewTracking.currentLocation?.heading
    : (currentHeading ?? previewTracking.currentLocation?.heading);

  return (
    <View style={commonStyles.container}>
      {/* 지도 영역 */}
      <View style={styles.mapContainer}>
        <KakaoMapWebView
          centerLat={displayLat || startCoords?.lat}
          centerLng={displayLng || startCoords?.lng}
          routePath={routePath}
          startLat={startCoords?.lat}
          startLng={startCoords?.lng}
          endLat={endCoords?.lat}
          endLng={endCoords?.lng}
          showCurrentLocation={true}
          heading={displayHeading}
          initialZoom={3}
        />

        {/* 상단 정보 오버레이 */}
        <View style={styles.topOverlay}>
          <View style={styles.courseNameContainer}>
            <Text style={styles.courseName}>{course.name}</Text>
          </View>

          {/* 디버그: 현재 좌표 표시 (AppConfig.SHOW_DEBUG_UI로 제어) */}
          {AppConfig.SHOW_DEBUG_UI && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>
                상태: {status}
              </Text>
              <Text style={styles.debugText}>
                위도: {displayLat?.toFixed(6) || 'null'}
              </Text>
              <Text style={styles.debugText}>
                경도: {displayLng?.toFixed(6) || 'null'}
              </Text>
              <Text style={styles.debugText}>
                방향: {displayHeading?.toFixed(1) || 'null'}°
              </Text>
              <Text style={styles.debugText}>
                소스: {isIdle ? '미리보기' : '러닝 세션'}
              </Text>
            </View>
          )}

          {/* 경로 이탈 경고 */}
          {isOffRoute && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>⚠️ 경로 이탈</Text>
            </View>
          )}
        </View>
      </View>

      {/* 러닝 통계 패널 */}
      <View style={styles.statsPanel}>
        <View style={styles.statsRow}>
          {/* 시간 */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>시간</Text>
            <Text style={styles.statValue}>
              {formatTime(stats.elapsedTime)}
            </Text>
          </View>

          {/* 거리 */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>거리</Text>
            <Text style={styles.statValue}>
              {formatDistance(stats.distance)}
            </Text>
          </View>

          {/* 페이스 */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>페이스</Text>
            <Text style={styles.statValue}>{formatPace(stats.pace)}</Text>
            <Text style={styles.statUnit}>분/km</Text>
          </View>
        </View>

        {/* 진행률 */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {width: `${Math.min(stats.progress, 100)}%`},
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {stats.progress.toFixed(0)}% 완료
          </Text>
        </View>
      </View>

      {/* 컨트롤 버튼 */}
      <View style={styles.controlPanel}>
        {isIdle ? (
          // 시작 버튼
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>시작</Text>
          </TouchableOpacity>
        ) : (
          // 일시정지/재개 + 종료 버튼
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={isPaused ? handleResume : handlePause}>
              <Text style={styles.pauseButtonText}>
                {isPaused ? '재개' : '일시정지'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
              <Text style={styles.stopButtonText}>종료</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 음성 안내 토글 */}
        <TouchableOpacity
          style={styles.voiceToggle}
          onPress={toggleVoiceGuidance}>
          <Text style={styles.voiceToggleText}>
            🔊 음성 안내: {isVoiceGuidanceEnabled ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  courseNameContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  courseName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
  },
  debugContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  debugText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white,
    fontFamily: 'monospace',
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  warningText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
  statsPanel: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  statUnit: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.backgroundDark,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  controlPanel: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  startButtonText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.white,
  },
  controlRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  pauseButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  stopButton: {
    flex: 1,
    backgroundColor: colors.error || '#FF3B30',
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  stopButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.white,
  },
  voiceToggle: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  voiceToggleText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
