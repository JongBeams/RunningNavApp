import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../types/navigation';
import {
  colors,
  spacing,
  fontSize,
  borderRadius,
  commonStyles,
} from '../../styles';
import {
  getRunningRecordById,
  deleteRunningRecord,
  RunningRecordResponse,
} from '../../services/api/runningRecordApi';
import KakaoMapWebView from '../../components/map/KakaoMapWebView';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DetailRouteProp = RouteProp<RootStackParamList, 'RunningRecordDetail'>;

export default function RunningRecordDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DetailRouteProp>();
  const {recordId} = route.params;

  const [record, setRecord] = useState<RunningRecordResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 데이터 로드
  useEffect(() => {
    loadRecord();
  }, [recordId]);

  const loadRecord = async () => {
    setIsLoading(true);
    try {
      const data = await getRunningRecordById(recordId);
      setRecord(data);
    } catch (error) {
      console.error('[RunningRecordDetail] 데이터 로드 실패:', error);
      Alert.alert('오류', '러닝 기록을 불러오는데 실패했습니다.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  // 삭제 확인
  const handleDelete = () => {
    Alert.alert(
      '러닝 기록 삭제',
      '이 러닝 기록을 삭제하시겠습니까?\n삭제된 기록은 복구할 수 없습니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRunningRecord(recordId);
              Alert.alert('완료', '러닝 기록이 삭제되었습니다.');
              navigation.goBack();
            } catch (error) {
              console.error('[RunningRecordDetail] 삭제 실패:', error);
              Alert.alert('오류', '러닝 기록 삭제에 실패했습니다.');
            }
          },
        },
      ],
    );
  };

  // 거리 포맷팅
  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(2)} km`;
  };

  // 시간 포맷팅
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}시간 ${minutes}분 ${secs}초`;
    }
    return `${minutes}분 ${secs}초`;
  };

  // 페이스 포맷팅
  const formatPace = (secondsPerKm: number) => {
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);
    return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
  };

  // 속도 포맷팅
  const formatSpeed = (metersPerSecond: number) => {
    const kmPerHour = metersPerSecond * 3.6;
    return `${kmPerHour.toFixed(2)} km/h`;
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
  };

  // GeoJSON에서 좌표 추출 (routePath 형식: [[lng, lat], ...])
  const getRoutePath = (): number[][] => {
    if (!record?.routeGeoJson) return [];

    try {
      const geoJson = JSON.parse(record.routeGeoJson);
      if (geoJson.type === 'LineString' && geoJson.coordinates) {
        return geoJson.coordinates; // [[lng, lat], ...]
      }
    } catch (error) {
      console.error('[RunningRecordDetail] GeoJSON 파싱 실패:', error);
    }

    return [];
  };

  // 지도 중심 좌표 계산
  const getMapCenter = () => {
    const routePath = getRoutePath();
    if (routePath.length === 0) {
      return {lat: 37.5665, lng: 126.978}; // 기본값: 서울
    }

    const centerIndex = Math.floor(routePath.length / 2);
    return {
      lat: routePath[centerIndex][1],
      lng: routePath[centerIndex][0],
    };
  };

  if (isLoading) {
    return (
      <View style={[commonStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!record) {
    return null;
  }

  const routePath = getRoutePath();
  const center = getMapCenter();

  return (
    <View style={commonStyles.container}>
      <ScrollView style={styles.content}>
        {/* 제목 섹션 */}
        <View style={styles.headerSection}>
          <Text style={styles.courseName}>
            {record.courseName || '자유 러닝'}
          </Text>
          <Text style={styles.date}>{formatDate(record.startTime)}</Text>
        </View>

        {/* 지도 섹션 */}
        {routePath.length > 0 && (
          <View style={styles.mapSection}>
            <KakaoMapWebView
              centerLat={center.lat}
              centerLng={center.lng}
              initialZoom={5}
              routePath={routePath}
              startLat={routePath[0][1]}
              startLng={routePath[0][0]}
              endLat={routePath[routePath.length - 1][1]}
              endLng={routePath[routePath.length - 1][0]}
            />
          </View>
        )}

        {/* 통계 섹션 */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>러닝 통계</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>거리</Text>
              <Text style={styles.statValue}>{formatDistance(record.distance)}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>시간</Text>
              <Text style={styles.statValue}>{formatDuration(record.duration)}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>평균 페이스</Text>
              <Text style={styles.statValue}>{formatPace(record.avgPace)}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>평균 속도</Text>
              <Text style={styles.statValue}>{formatSpeed(record.avgSpeed)}</Text>
            </View>
          </View>
        </View>

        {/* 추가 정보 섹션 */}
        {(record.memo || record.weather || record.calories || record.avgHeartRate) && (
          <View style={styles.additionalSection}>
            <Text style={styles.sectionTitle}>추가 정보</Text>

            {record.memo && (
              <View style={styles.additionalItem}>
                <Text style={styles.additionalLabel}>메모</Text>
                <Text style={styles.additionalValue}>{record.memo}</Text>
              </View>
            )}

            {record.weather && (
              <View style={styles.additionalItem}>
                <Text style={styles.additionalLabel}>날씨</Text>
                <Text style={styles.additionalValue}>{record.weather}</Text>
              </View>
            )}

            {record.calories && (
              <View style={styles.additionalItem}>
                <Text style={styles.additionalLabel}>칼로리</Text>
                <Text style={styles.additionalValue}>{record.calories} kcal</Text>
              </View>
            )}

            {record.avgHeartRate && (
              <View style={styles.additionalItem}>
                <Text style={styles.additionalLabel}>평균 심박수</Text>
                <Text style={styles.additionalValue}>{record.avgHeartRate} bpm</Text>
              </View>
            )}
          </View>
        )}

        {/* 삭제 버튼 */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>러닝 기록 삭제</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  courseName: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  mapSection: {
    height: 300,
    backgroundColor: colors.background,
  },
  statsSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  statBox: {
    width: '50%',
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  additionalSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  additionalItem: {
    marginBottom: spacing.md,
  },
  additionalLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  additionalValue: {
    fontSize: fontSize.base,
    color: colors.text,
  },
  deleteButton: {
    backgroundColor: colors.error,
    margin: spacing.lg,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
});
