import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, BackHandler} from 'react-native';
import {colors, spacing, fontSize, commonStyles, RUNNIGN_START_ICON_PATH, HOME_ICON_PATH, LIST_COURSE_ICON_PATH} from '../../styles';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {MainTabParamList, RootStackParamList} from '../../types/navigation';
import { SVGIcon } from '../../components/common';
import NaverMapWebView from '../../components/map/NaverMapWebView';

type RunningScreenNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;



export default function RunningHomeScreen() {
  const navigation = useNavigation<RunningScreenNav>();
  const [selectedCourse, setSelectedCourse] = React.useState<string>('코스를 선택해주세요');

  const handleHomePress = () => {
    // MainTabs의 Home 탭으로 이동
    navigation.navigate('Home');
  };

  // Android 뒤로가기 버튼 처리
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Home');
        return true; // 이벤트가 처리되었음을 알림
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  return (
    <View style={commonStyles.container}>
      {/* 상단 헤더 - 선택된 코스명 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {/* {selectedCourse} */}현재 코스 1 표시
          </Text>
      </View>

      {/* 지도 영역 */}
      <View style={styles.mapPlaceholder}>
        <NaverMapWebView />
      </View>
      {/* 하단 탭바 모양 버튼 UI */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tab} onPress={() => {}}>
          <SVGIcon iconPath={RUNNIGN_START_ICON_PATH} color={colors.primary} />
          <Text style={styles.tabText}>러닝 시작</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={handleHomePress}>
          <SVGIcon iconPath={HOME_ICON_PATH} color={colors.primary} />
          <Text style={styles.tabText}>홈</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate('ListCourse')}>
          <SVGIcon iconPath={LIST_COURSE_ICON_PATH} color={colors.primary} />
          <Text style={styles.tabText}>코스 목록</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    height: 60,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.primaryLight,
    marginBottom: spacing.sm,
  },
  mapText: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  mapSubtext: {
    fontSize: fontSize.sm,
    color: colors.textLight,
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
});
