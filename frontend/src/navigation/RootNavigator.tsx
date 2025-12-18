import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigation';
import {useAuth} from '../context/AuthContext';
import TabNavigator from './TabNavigator';
import AuthNavigator from './AuthNavigator';
import ListCourseScreen from '../screens/Running/ListCourseScreen';
import CreateCourseScreenKakao from '../screens/Running/CreateCourseScreenKakao';
import RunningNavigationScreen from '../screens/Running/RunningNavigationScreen';
import SettingScreen from '../screens/Setting/SettingScreen';
import RunningRecordListScreen from '../screens/RunningRecord/RunningRecordListScreen';
import RunningRecordDetailScreen from '../screens/RunningRecord/RunningRecordDetailScreen';
import LoadingScreen from '../screens/Loading/LoadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const {isAuthenticated, isLoading} = useAuth();

  // 로딩 중일 때
  if (isLoading) {
    return <LoadingScreen />;
  }

  // 인증되지 않은 경우: 로그인/회원가입 화면
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // 인증된 경우: 메인 화면
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerTitleAlign: 'center',
      }}>
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ListCourse"
        component={ListCourseScreen}
        options={{
          headerShown: true,
          headerTitle: '경로 목록',
        }}
      />
      <Stack.Screen
        name="CreateCourse"
        component={CreateCourseScreenKakao}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="RunningNavigation"
        component={RunningNavigationScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Setting"
        component={SettingScreen}
        options={{
          headerShown: true,
          headerTitle: '설정',
        }}
      />
      <Stack.Screen
        name="RunningRecordList"
        component={RunningRecordListScreen}
        options={{
          headerShown: true,
          headerTitle: '러닝 기록',
        }}
      />
      <Stack.Screen
        name="RunningRecordDetail"
        component={RunningRecordDetailScreen}
        options={{
          headerShown: true,
          headerTitle: '러닝 상세',
        }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
