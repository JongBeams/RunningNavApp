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
import KakaoMapWebView from '../../components/map/KakaoMapWebView';
import {geoJsonToWaypoints} from '../../services/api/courseApi';
import useRunningSession, {RunningSessionStatus} from '../../hooks/useRunningSession';

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
    await start();
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
              await stop(false); // 기록 저장하지 않고 종료
              navigation.goBack();
            },
          },
          {
            text: '예',
            onPress: async () => {
              await stop(true); // 기록 저장하고 종료
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

  return (
    <View style={commonStyles.container}>
      {/* 지도 영역 */}
      <View style={styles.mapContainer}>
        <KakaoMapWebView
          centerLat={
            isIdle || !currentLat ? startCoords?.lat : currentLat
          }
          centerLng={
            isIdle || !currentLng ? startCoords?.lng : currentLng
          }
          routePath={routePath}
          startLat={startCoords?.lat}
          startLng={startCoords?.lng}
          endLat={endCoords?.lat}
          endLng={endCoords?.lng}
          showCurrentLocation={true}
          heading={currentHeading}
          initialZoom={3}
        />

        {/* 상단 정보 오버레이 */}
        <View style={styles.topOverlay}>
          <View style={styles.courseNameContainer}>
            <Text style={styles.courseName}>{course.name}</Text>
          </View>

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
