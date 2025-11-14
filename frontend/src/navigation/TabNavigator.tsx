import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {TabParamList} from './types';

// 임시 화면 컴포넌트들 (추후 실제 화면으로 교체)
const CourseListScreen = () => {
  return null; // 추후 구현 예정
};

const CourseCreateScreen = () => {
  return null; // 추후 구현 예정
};

const NavigationScreen = () => {
  return null; // 추후 구현 예정
};

const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}>
      <Tab.Screen
        name="CourseList"
        component={CourseListScreen}
        options={{
          title: '코스 목록',
          tabBarLabel: '목록',
          tabBarIcon: ({color}) => null, // 추후 아이콘 추가
        }}
      />
      <Tab.Screen
        name="CourseCreate"
        component={CourseCreateScreen}
        options={{
          title: '코스 생성',
          tabBarLabel: '생성',
          tabBarIcon: ({color}) => null, // 추후 아이콘 추가
        }}
      />
      <Tab.Screen
        name="Navigation"
        component={NavigationScreen}
        options={{
          title: '네비게이션',
          tabBarLabel: '내비게이션',
          tabBarIcon: ({color}) => null, // 추후 아이콘 추가
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
