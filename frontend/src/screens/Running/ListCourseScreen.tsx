import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../types/navigation';
import {colors, spacing, fontSize, commonStyles, shadows, borderRadius, ADD_COURSE_ICON_PATH} from '../../styles';
import {SVGIcon} from '../../components/common';
import {getMyCourses, deleteCourse, geoJsonToWaypoints, createCourse, getCourseByShareCode, type CourseResponse} from '../../services/api/courseApi';

type ListCourseScreenNav = NativeStackNavigationProp<RootStackParamList, 'ListCourse'>;

export default function ListCourseScreen() {
  const navigation = useNavigation<ListCourseScreenNav>();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [shareCodeInput, setShareCodeInput] = useState('');
  const [importing, setImporting] = useState(false);

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

  const handleOpenImportModal = () => {
    setShareCodeInput('');
    setImportModalVisible(true);
  };

  const handleCloseImportModal = () => {
    setImportModalVisible(false);
    setShareCodeInput('');
  };

  const handleImportCourse = async () => {
    const code = shareCodeInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('알림', '공유 코드를 입력해주세요.');
      return;
    }

    if (code.length !== 8) {
      Alert.alert('알림', '공유 코드는 8자리입니다.');
      return;
    }

    try {
      setImporting(true);

      // shareCode로 코스 조회
      const sourceCourse = await getCourseByShareCode(code);

      // 새 코스로 복사하여 저장
      await createCourse({
        name: `${sourceCourse.name} (복사본)`,
        routeGeoJson: sourceCourse.routeGeoJson,
        waypointsGeoJson: sourceCourse.waypointsGeoJson,
        distance: sourceCourse.distance,
        duration: sourceCourse.duration,
      });

      handleCloseImportModal();
      Alert.alert('성공', `"${sourceCourse.name}" 코스를 불러왔습니다.`);
      loadCourses();
    } catch (error: any) {
      console.error('[ListCourse] 코스 불러오기 실패:', error);
      if (error.response?.status === 404) {
        Alert.alert('오류', '해당 공유 코드의 코스를 찾을 수 없습니다.');
      } else {
        Alert.alert('오류', '코스를 불러오는데 실패했습니다.');
      }
    } finally {
      setImporting(false);
    }
  };

  const handleCopyShareCode = (shareCode: string | undefined, courseName: string) => {
    if (!shareCode) {
      Alert.alert('알림', '이 코스에는 공유 코드가 없습니다.');
      return;
    }
    Clipboard.setString(shareCode);
    Alert.alert('복사 완료', `"${courseName}" 코스의 공유 코드가 클립보드에 복사되었습니다.\n\n코드: ${shareCode}`);
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
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.importButton} onPress={handleOpenImportModal}>
              <Text style={styles.importButtonText}>코스 불러오기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleAddCourse}>
              <SVGIcon iconPath={ADD_COURSE_ICON_PATH} color={colors.white} size={20} />
              <Text style={styles.addButtonText}>코스 추가</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={commonStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : courses.length === 0 ? (
          <View style={commonStyles.card}>
            <Text style={commonStyles.emptyText}>아직 저장된 코스가 없습니다</Text>
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
                  <View style={styles.courseActions}>
                    <TouchableOpacity
                      onPress={() => handleCopyShareCode(course.shareCode, course.name)}
                      style={styles.copyButton}>
                      <Text style={styles.copyButtonText}>복사</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteCourse(course.id, course.name)}
                      style={styles.deleteButton}>
                      <Text style={styles.deleteButtonText}>삭제</Text>
                    </TouchableOpacity>
                  </View>
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

      {/* 코스 불러오기 모달 */}
      <Modal
        visible={importModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseImportModal}>
        <View style={commonStyles.modalCenterOverlay}>
          <View style={commonStyles.modalCenterContent}>
            <Text style={commonStyles.modalCenterTitle}>코스 불러오기</Text>
            <Text style={commonStyles.modalCenterDescription}>
              공유 받은 8자리 코드를 입력하세요
            </Text>
            <TextInput
              style={commonStyles.modalInput}
              placeholder="예: ABC12345"
              placeholderTextColor={colors.textLight}
              value={shareCodeInput}
              onChangeText={setShareCodeInput}
              autoCapitalize="characters"
              maxLength={8}
            />
            <View style={commonStyles.modalButtons}>
              <TouchableOpacity
                style={commonStyles.modalCancelButton}
                onPress={handleCloseImportModal}>
                <Text style={commonStyles.modalCancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[commonStyles.modalConfirmButton, importing && commonStyles.buttonDisabled]}
                onPress={handleImportCourse}
                disabled={importing}>
                {importing ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={commonStyles.modalConfirmButtonText}>불러오기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // 버튼 스타일 - commonStyles.buttonSmall 기반
  addButton: {
    ...commonStyles.buttonSmall,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.base,
  },
  addButtonText: {
    ...commonStyles.buttonSmallText,
    color: colors.white,
  },
  // loadingContainer, emptyText → commonStyles 사용
  // 카드 스타일 - shadows.base 사용
  courseCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.base,
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
  courseActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  copyButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  copyButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
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
  // 헤더 버튼 영역
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  importButton: {
    ...commonStyles.buttonSmall,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.base,
  },
  importButtonText: {
    ...commonStyles.buttonSmallText,
    color: colors.white,
  },
});
