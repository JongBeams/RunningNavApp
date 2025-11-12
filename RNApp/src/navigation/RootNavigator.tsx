import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import TabNavigator from './TabNavigator';

// 코스 상세 화면 (임시)
const CourseDetailScreen = () => {
  return null; // 추후 구현 예정
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
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
        name="CourseDetail"
        component={CourseDetailScreen}
        options={({route}) => ({
          title: route.params.courseName || '코스 상세',
          headerBackTitle: '뒤로',
        })}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
