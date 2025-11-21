import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {colors, spacing, fontSize, commonStyles, ADD_COURSE_ICON_PATH} from '../../styles';
import {SVGIcon} from '../../components/common';

export default function ListCourseScreen() {
  const handleAddCourse = () => {
    // TODO: 코스 추가 화면으로 이동
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

        <View style={commonStyles.card}>
          <Text style={styles.emptyText}>아직 저장된 코스가 없습니다</Text>
          <Text style={commonStyles.body}>
            코스 추가 탭에서 새로운 러닝 코스를 만들어보세요!
          </Text>
        </View>
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
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
