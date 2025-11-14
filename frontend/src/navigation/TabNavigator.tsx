import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainTabParamList} from '../types/navigation';
import HomeScreen from '../screens/Home/HomeScreen';
import MyPageScreen from '../screens/MyPage/MyPageScreen';
import RunningHomeScreen from '../screens/Running/RunningHomeScreen';
import {CustomHeader} from '../components/navigation/TabScreens';
import {SVGIcon} from '../components/common';
import {HOME_ICON_PATH, USER_ICON_PATH,RUNNIGN_ICON_PATH} from '../styles';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}>
      <Tab.Screen
        name="Running"
        component={RunningHomeScreen}
        options={{
          headerShown: false,
          tabBarLabel: '러닝',
          tabBarIcon: ({color}) => (
            <SVGIcon iconPath={RUNNIGN_ICON_PATH} color={color} />
          ),
          tabBarStyle: {display: 'none'}, // Running 탭일 때 TabNavigator 탭바 숨김
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: '',
          headerLeft: CustomHeader.Logo,
          headerRight: CustomHeader.SettingsButton,
          tabBarLabel: '홈',
          tabBarIcon: ({color}) => (
            <SVGIcon iconPath={HOME_ICON_PATH} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{
          headerTitle: '',
          headerLeft: CustomHeader.Logo,
          headerRight: CustomHeader.SettingsButton,
          tabBarLabel: '마이페이지',
          tabBarIcon: ({color}) => (
            <SVGIcon iconPath={USER_ICON_PATH} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
