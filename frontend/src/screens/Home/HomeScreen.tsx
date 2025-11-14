import React from 'react';
import {View, Text, StyleSheet, ScrollView, BackHandler, Alert} from 'react-native';
import {colors, spacing, fontSize, commonStyles} from '@/src/styles';
import {useFocusEffect} from '@react-navigation/native';
import { WebView } from 'react-native-webview';





export default function HomeScreen() {
  // Android 뒤로가기 버튼 처리 - 앱 종료 확인
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          '앱 종료',
          '앱을 종료하시겠습니까?',
          [
            {
              text: '확인',
              onPress: () => BackHandler.exitApp(),
            },
            {
              text: '취소',
              style: 'cancel',
            },
          ],
          {cancelable: false},
        );
        return true; // 이벤트가 처리되었음을 알림
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );

  return (
    <View style={commonStyles.container}>
      <ScrollView style={styles.content}>
        <Text style={commonStyles.title}>홈</Text>
        <Text style={commonStyles.subtitle}>공지사항 및 업데이트</Text>

        <View style={commonStyles.card}>
          <Text style={styles.noticeTitle}>환영합니다!</Text>
          <Text style={commonStyles.body}>
            러닝 네비게이션 앱에 오신 것을 환영합니다.
          </Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={styles.noticeTitle}>최신 업데이트</Text>
          <Text style={commonStyles.body}>
            새로운 기능이 추가되었습니다. 지금 바로 확인해보세요!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: spacing.base,
  },
  noticeTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
});
