import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigation';
import TabNavigator from './TabNavigator';
import ListCourseScreen from '../screens/Running/ListCourseScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
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
    </Stack.Navigator>
  );
};

export default RootNavigator;
