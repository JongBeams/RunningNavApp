import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  colors,
  spacing,
  fontSize,
  commonStyles,
  RUNNIGN_START_ICON_PATH,
  HOME_ICON_PATH,
  LIST_COURSE_ICON_PATH,
} from '../../styles';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {MainTabParamList, RootStackParamList} from '../../types/navigation';
import {SVGIcon} from '../../components/common';
import KakaoMapWebView from '../../components/map/KakaoMapWebView';
import {
  getMyCourses,
  CourseResponse,
  geoJsonToWaypoints,
} from '../../services/api/courseApi';

type RunningScreenNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function RunningHomeScreen() {
  const navigation = useNavigation<RunningScreenNav>();
  const [selectedCourse, setSelectedCourse] = useState<CourseResponse | null>(
    null,
  );
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCourseList, setShowCourseList] = useState(false);

  const handleHomePress = () => {
    navigation.navigate('Home');
  };

  // 러닝 시작 핸들러
  const handleStartRunning = () => {
    if (!selectedCourse) {
      Alert.alert('알림', '코스를 먼저 선택해주세요.');
      return;
    }

    // 러닝 네비게이션 화면으로 이동
    navigation.navigate('RunningNavigation', {
      course: selectedCourse,
    });
  };

  // 코스 목록 불러오기
  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const data = await getMyCourses();
      setCourses(data);
      console.log('[RunningHome] 코스 목록 로드 성공:', data.length, '개');
    } catch (error) {
      console.error('[RunningHome] 코스 목록 로드 실패:', error);
      Alert.alert('오류', '코스 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 화면이 포커스될 때마다 코스 목록 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadCourses();

      const onBackPress = () => {
        navigation.navigate('Home');
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  // 코스 선택 핸들러
  const handleSelectCourse = (course: CourseResponse) => {
    setSelectedCourse(course);
    setShowCourseList(false);
    console.log('[RunningHome] 코스 선택:', course.name);
  };

  // 코스 시작 지점 좌표 가져오기
  const getStartCoordinates = () => {
    if (!selectedCourse) return null;

    try {
      const waypoints = geoJsonToWaypoints(selectedCourse.waypointsGeoJson);
      if (waypoints.length > 0) {
        return {
          lat: waypoints[0].latitude,
          lng: waypoints[0].longitude,
        };
      }
    } catch (error) {
      console.error('[RunningHome] 시작 좌표 파싱 실패:', error);
    }

    return null;
  };

  // 코스 종료 지점 좌표 가져오기
  const getEndCoordinates = () => {
    if (!selectedCourse) return null;

    try {
      const waypoints = geoJsonToWaypoints(selectedCourse.waypointsGeoJson);
      if (waypoints.length > 0) {
        return {
          lat: waypoints[waypoints.length - 1].latitude,
          lng: waypoints[waypoints.length - 1].longitude,
        };
      }
    } catch (error) {
      console.error('[RunningHome] 종료 좌표 파싱 실패:', error);
    }

    return null;
  };

  // 코스 경로 좌표 가져오기
  const getRoutePath = () => {
    if (!selectedCourse) return undefined;

    try {
      const routeData = JSON.parse(selectedCourse.routeGeoJson);
      // GeoJSON LineString: { type: "LineString", coordinates: [[lng, lat], ...] }
      if (routeData.type === 'LineString' && routeData.coordinates) {
        console.log('[RunningHome] 경로 좌표 로드:', routeData.coordinates.length, '개');
        return routeData.coordinates;
      }
    } catch (error) {
      console.error('[RunningHome] 경로 좌표 파싱 실패:', error);
    }

    return undefined;
  };

  const startCoords = getStartCoordinates();
  const endCoords = getEndCoordinates();
  const routePath = getRoutePath();

  // 거리 포맷팅
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  // 시간 포맷팅
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}분`;
  };

  return (
    <View style={commonStyles.container}>
      {/* 상단 헤더 - 선택된 코스명 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowCourseList(true)}>
          <Text style={styles.headerTitle}>
            {selectedCourse ? selectedCourse.name : '코스를 선택해주세요'}
          </Text>
          <Text style={styles.headerSubtitle}>탭하여 코스 선택</Text>
        </TouchableOpacity>
      </View>

      {/* 지도 영역 */}
      <View style={styles.mapPlaceholder}>
        <KakaoMapWebView
          centerLat={startCoords?.lat}
          centerLng={startCoords?.lng}
          routePath={routePath}
          startLat={startCoords?.lat}
          startLng={startCoords?.lng}
          endLat={endCoords?.lat}
          endLng={endCoords?.lng}
          showCurrentLocation={true}
          initialZoom={3}
        />
      </View>

      {/* 하단 탭바 모양 버튼 UI */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tab} onPress={handleStartRunning}>
          <SVGIcon iconPath={RUNNIGN_START_ICON_PATH} color={colors.primary} />
          <Text style={styles.tabText}>러닝 시작</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={handleHomePress}>
          <SVGIcon iconPath={HOME_ICON_PATH} color={colors.primary} />
          <Text style={styles.tabText}>홈</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => navigation.navigate('ListCourse')}>
          <SVGIcon iconPath={LIST_COURSE_ICON_PATH} color={colors.primary} />
          <Text style={styles.tabText}>코스 목록</Text>
        </TouchableOpacity>
      </View>

      {/* 코스 선택 모달 */}
      <Modal
        visible={showCourseList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCourseList(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>코스 선택</Text>
              <TouchableOpacity onPress={() => setShowCourseList(false)}>
                <Text style={styles.closeButton}>닫기</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>코스 불러오는 중...</Text>
              </View>
            ) : courses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>저장된 코스가 없습니다.</Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => {
                    setShowCourseList(false);
                    navigation.navigate('CreateCourse');
                  }}>
                  <Text style={styles.createButtonText}>코스 만들기</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={courses}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={[
                      styles.courseItem,
                      selectedCourse?.id === item.id &&
                        styles.courseItemSelected,
                    ]}
                    onPress={() => handleSelectCourse(item)}>
                    <View style={styles.courseItemHeader}>
                      <Text style={styles.courseItemName}>{item.name}</Text>
                      {selectedCourse?.id === item.id && (
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedBadgeText}>선택됨</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.courseItemInfo}>
                      <Text style={styles.courseItemInfoText}>
                        {formatDistance(item.distance)} · {formatDuration(item.duration)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    height: 70,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 4,
    paddingTop: 8,
    height: 56,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    fontSize: fontSize.base,
    color: colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  createButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  courseItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  courseItemSelected: {
    backgroundColor: colors.primaryLight + '10',
  },
  courseItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  courseItemName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  selectedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  selectedBadgeText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '600',
  },
  courseItemInfo: {
    flexDirection: 'row',
  },
  courseItemInfoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
