import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {colors, spacing, fontSize, commonStyles} from '../../styles';

export default function ListCourseScreen() {
  return (
    <View style={commonStyles.container}>
      <ScrollView style={styles.content}>
        <Text style={commonStyles.title}>경로 목록</Text>
        <Text style={commonStyles.subtitle}>저장된 러닝 경로를 확인하세요</Text>

        <View style={commonStyles.card}>
          <Text style={styles.emptyText}>아직 저장된 경로가 없습니다</Text>
          <Text style={commonStyles.body}>
            경로 추가 탭에서 새로운 러닝 경로를 만들어보세요!
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
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});
