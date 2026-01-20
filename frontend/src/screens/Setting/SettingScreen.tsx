import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors, spacing, fontSize, commonStyles} from '../../styles';

const STORAGE_KEY_VIBRATION = '@settings_tts_vibration';

/**
 * 설정 화면
 *
 * 앱 전역 설정을 관리합니다.
 * - TTS 진동 사용 여부
 */
export default function SettingScreen() {
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // 설정 불러오기
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const vibrationValue = await AsyncStorage.getItem(STORAGE_KEY_VIBRATION);
      if (vibrationValue !== null) {
        setIsVibrationEnabled(JSON.parse(vibrationValue));
      }
    } catch (error) {
      console.error('[Setting] 설정 불러오기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 진동 설정 토글
  const toggleVibration = async (value: boolean) => {
    try {
      setIsVibrationEnabled(value);
      await AsyncStorage.setItem(STORAGE_KEY_VIBRATION, JSON.stringify(value));
      console.log('[Setting] TTS 진동 설정:', value ? '활성화' : '비활성화');
    } catch (error) {
      console.error('[Setting] 설정 저장 실패:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[commonStyles.container, commonStyles.loadingContainer]}>
        <Text style={commonStyles.loadingText}>설정 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.container}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>설정</Text>
        </View>

        {/* TTS 설정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>음성 안내 (TTS)</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>진동 사용</Text>
              <Text style={styles.settingDescription}>
                음성 안내가 시작될 때 진동을 울립니다
              </Text>
            </View>
            <Switch
              value={isVibrationEnabled}
              onValueChange={toggleVibration}
              trackColor={{false: colors.border, true: colors.primary}}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* 추가 섹션을 위한 공간 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>RunRun v1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // loadingContainer, loadingText → commonStyles 사용
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    marginTop: spacing.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});

// 다른 컴포넌트에서 진동 설정을 가져오기 위한 유틸리티 함수
export const getTTSVibrationSetting = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY_VIBRATION);
    return value !== null ? JSON.parse(value) : true; // 기본값: true
  } catch (error) {
    console.error('[Setting] 진동 설정 불러오기 실패:', error);
    return true;
  }
};
