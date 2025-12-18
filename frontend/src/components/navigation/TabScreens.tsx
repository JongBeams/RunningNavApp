import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../types/navigation';
import {colors, fontSize} from '../../styles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 커스텀 헤더 컴포넌트
export const CustomHeader = {
  Logo: () => <Text style={styles.logo}>RunRun</Text>,
  SettingsButton: () => {
    const navigation = useNavigation<NavigationProp>();

    return (
      <TouchableOpacity onPress={() => navigation.navigate('Setting')}>
        <Text style={styles.settingsButton}>설정</Text>
      </TouchableOpacity>
    );
  },
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
