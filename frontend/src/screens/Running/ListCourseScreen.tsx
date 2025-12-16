import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../types/navigation';
import {colors, spacing, fontSize, commonStyles, ADD_COURSE_ICON_PATH} from '../../styles';
import {SVGIcon} from '../../components/common';
import {getMyCourses, deleteCourse, geoJsonToWaypoints, type CourseResponse} from '../../services/api/courseApi';

type ListCourseScreenNav = NativeStackNavigationProp<RootStackParamList, 'ListCourse'>;

export default function ListCourseScreen() {
  const navigation = useNavigation<ListCourseScreenNav>();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await getMyCourses();
      setCourses(data);
    } catch (error: any) {
      console.error('[ListCourse] 코스 목록 조회 실패:', error);
      console.error('[ListCourse] Error response:', error.response?.data);
      console.error('[ListCourse] Error status:', error.response?.status);

      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('인증 오류', '로그인이 필요합니다.');
      } else if (error.response?.status === 404) {
        Alert.alert('오류', 'API 엔드포인트를 찾을 수 없습니다.');
      } else {
        Alert.alert('오류', '코스 목록을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 화면이 포커스될 때마다 목록 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadCourses();
    }, []),
  );

  const handleAddCourse = () => {
    navigation.navigate('CreateCourse');
  };

  const handleDeleteCourse = (courseId: string, courseName: string) => {
    Alert.alert('코스 삭제', `"${courseName}" 코스를 삭제하시겠습니까?`, [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCourse(courseId);
            Alert.alert('성공', '코스가 삭제되었습니다.');
            loadCourses();
          } catch (error) {
            console.error('[ListCourse] 코스 삭제 실패:', error);
            Alert.alert('오류', '코스 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}분`;
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={commonStyles.title}>코스 목록</Text>
            <Text style={commonStyles.subtitle}>저장된 러닝 경로를 확인하세요</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddCourse}>
            <SVGIcon iconPath={ADD_COURSE_ICON_PATH} color={colors.white} size={20} />
            <Text style={styles.addButtonText}>코스 추가</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : courses.length === 0 ? (
          <View style={commonStyles.card}>
            <Text style={styles.emptyText}>아직 저장된 코스가 없습니다</Text>
            <Text style={commonStyles.body}>
              코스 추가 버튼을 눌러 새로운 러닝 코스를 만들어보세요!
            </Text>
          </View>
        ) : (
          <>
            {courses.map(course => (
              <View key={course.id} style={styles.courseCard}>
                <View style={styles.courseHeader}>
                  <Text style={styles.courseName}>{course.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteCourse(course.id, course.name)}
                    style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.courseInfo}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>거리</Text>
                    <Text style={styles.infoValue}>
                      {formatDistance(course.distance)}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>예상시간</Text>
                    <Text style={styles.infoValue}>
                      {formatDuration(course.duration)}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>경유지</Text>
                    <Text style={styles.infoValue}>
                      {geoJsonToWaypoints(course.waypointsGeoJson).length}개
                    </Text>
                  </View>
                </View>
                <Text style={styles.courseDate}>
                  생성일: {new Date(course.createdAt).toLocaleDateString('ko-KR')}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  courseCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  courseName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  deleteButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  courseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.sm,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  courseDate: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    textAlign: 'right',
  },
});
