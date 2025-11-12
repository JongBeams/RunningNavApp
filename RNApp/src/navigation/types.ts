import type {NavigatorScreenParams} from '@react-navigation/native';

// 탭 네비게이터 파라미터 타입 정의
export type TabParamList = {
  CourseList: undefined;
  CourseCreate: undefined;
  Navigation: undefined;
};

// 루트 스택 네비게이터 파라미터 타입 정의
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  CourseDetail: {
    courseId: string;
    courseName?: string;
  };
};

// 네비게이션 프롭 타입 헬퍼
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
