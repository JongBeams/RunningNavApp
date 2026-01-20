import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../types/navigation';
import {
  colors,
  spacing,
  fontSize,
  borderRadius,
  commonStyles,
} from '../../styles';
import {useAuth} from '../../context/AuthContext';
import {
  getMyRunningRecords,
  getRunningStatistics,
  RunningRecordResponse,
  RunningStatistics,
} from '../../services/api/runningRecordApi';

type MyPageNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MyPageScreen() {
  const {user, logout} = useAuth();
  const navigation = useNavigation<MyPageNavigationProp>();

  const [statistics, setStatistics] = useState<RunningStatistics | null>(null);
  const [records, setRecords] = useState<RunningRecordResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, []),
  );

  // 데이터 로드
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stats, recordsData] = await Promise.all([
        getRunningStatistics(),
        getMyRunningRecords(),
      ]);

      setStatistics(stats);
      setRecords(recordsData);
    } catch (error) {
      console.error('[MyPageScreen] 데이터 로드 실패:', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  /**
   * 로그아웃 처리
   */
  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('[MyPageScreen] 로그아웃 실패:', error);
            Alert.alert('오류', '로그아웃에 실패했습니다.');
          }
        },
      },
    ]);
  };

  // 사용자 이름의 첫 글자 (아바타 표시용)
  const getInitial = () => {
    if (!user?.fullName) return '?';
    return user.fullName.charAt(0);
  };

  // 거리 포맷팅
  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(2)}km`;
  };

  // 시간 포맷팅
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

  // 페이스 포맷팅
  const formatPace = (secondsPerKm: number) => {
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);
    return `${minutes}'${seconds}"`;
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${month}/${day} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // 러닝 기록 아이템 렌더링
  const renderRecordItem = ({item}: {item: RunningRecordResponse}) => (
    <TouchableOpacity
      style={styles.recordItem}
      onPress={() =>
        navigation.navigate('RunningRecordDetail', {recordId: item.id})
      }>
      <View style={styles.recordHeader}>
        <Text style={styles.recordCourseName}>
          {item.courseName || '자유 러닝'}
        </Text>
        <Text style={styles.recordDate}>{formatDate(item.startTime)}</Text>
      </View>

      <View style={styles.recordStats}>
        <View style={styles.recordStatItem}>
          <Text style={styles.recordStatLabel}>거리</Text>
          <Text style={styles.recordStatValue}>
            {formatDistance(item.distance)}
          </Text>
        </View>

        <View style={styles.recordStatItem}>
          <Text style={styles.recordStatLabel}>시간</Text>
          <Text style={styles.recordStatValue}>
            {formatDuration(item.duration)}
          </Text>
        </View>

        <View style={styles.recordStatItem}>
          <Text style={styles.recordStatLabel}>페이스</Text>
          <Text style={styles.recordStatValue}>
            {formatPace(item.avgPace)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial()}</Text>
          </View>
          <Text style={styles.userName}>{user?.fullName || '사용자'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        {/* 러닝 통계 섹션 */}
        {statistics && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>러닝 통계</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{statistics.totalCount}</Text>
                <Text style={styles.statLabel}>총 러닝</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {(statistics.totalDistance / 1000).toFixed(1)}
                </Text>
                <Text style={styles.statLabel}>총 거리 (km)</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {Math.floor(statistics.totalDuration / 60)}
                </Text>
                <Text style={styles.statLabel}>총 시간 (분)</Text>
              </View>
            </View>
          </View>
        )}

        {/* 러닝 기록 섹션 */}
        <View style={styles.recordsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최근 러닝 기록</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('RunningRecordList')}>
              <Text style={styles.viewAllButton}>전체보기</Text>
            </TouchableOpacity>
          </View>

          {records.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={commonStyles.emptyText}>아직 러닝 기록이 없습니다</Text>
              <Text style={styles.emptySubText}>
                첫 러닝을 시작해보세요!
              </Text>
            </View>
          ) : (
            <FlatList
              data={records.slice(0, 5)} // 최근 5개만 표시
              renderItem={renderRecordItem}
              keyExtractor={item => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* 메뉴 섹션 */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Setting')}>
            <Text style={styles.menuText}>설정</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={[styles.menuText, styles.logoutText]}>로그아웃</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statsSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  recordsSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllButton: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  recordItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recordCourseName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  recordDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  recordStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  recordStatItem: {
    alignItems: 'center',
  },
  recordStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  recordStatValue: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  // emptyText → commonStyles.emptyText 사용
  emptySubText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  menuSection: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuText: {
    fontSize: fontSize.base,
    color: colors.text,
  },
  menuArrow: {
    fontSize: fontSize.xxl,
    color: colors.secondaryLight,
  },
  logoutText: {
    color: colors.error,
  },
});
