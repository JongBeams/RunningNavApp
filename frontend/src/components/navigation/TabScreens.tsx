import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';
import {colors, fontSize} from '../../styles';

// 커스텀 헤더 컴포넌트
export const CustomHeader = {
  Logo: () => <Text style={styles.logo}>RunRun</Text>,
  SettingsButton: () => (
    <TouchableOpacity onPress={() => console.log('설정 클릭')}>
      <Text style={styles.settingsButton}>설정</Text>
    </TouchableOpacity>
  ),
};

const styles = StyleSheet.create({
  logo: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 16,
  },
  settingsButton: {
    fontSize: fontSize.base,
    color: colors.text,
    marginRight: 16,
  },
});
