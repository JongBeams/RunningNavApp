import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
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
import {
  getMyRunningRecords,
  RunningRecordResponse,
} from '../../services/api/runningRecordApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RunningRecordListScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [records, setRecords] = useState<RunningRecordResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadRecords();
    }, []),
  );

  // 러닝 기록 목록 로드
  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await getMyRunningRecords();
      setRecords(data);
    } catch (error) {
      console.error('[RunningRecordList] 데이터 로드 실패:', error);
      Alert.alert('오류', '러닝 기록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadRecords();
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
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${year}.${month}.${day} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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
      {records.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>아직 러닝 기록이 없습니다</Text>
          <Text style={styles.emptySubText}>첫 러닝을 시작해보세요!</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          renderItem={renderRecordItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: spacing.md,
  },
  recordItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  recordCourseName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  recordDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  recordStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
  },
  recordStatItem: {
    alignItems: 'center',
  },
  recordStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  recordStatValue: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
