import type {NavigatorScreenParams} from '@react-navigation/native';
import type {CourseResponse} from '../services/api/courseApi';

// 인증 스택 네비게이터 (로그인, 회원가입)
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

// 메인 탭 네비게이터 (러닝, 홈, 마이페이지)
export type MainTabParamList = {
  Running: undefined;
  Home: undefined;
  MyPage: undefined;
};

// 러닝 탭 네비게이터 (경로 추가, 홈, 경로 목록)
export type RunningTabParamList = {
  AddCourse: undefined;   // 경로 추가
  Home: undefined;        // 홈
  ListCourse: undefined;  // 경로 목록
};

// 루트 스택 네비게이터 파라미터 타입 정의
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  CourseDetail: {
    courseId: string;
    courseName?: string;
  };
  ListCourse: undefined;
  CreateCourse: undefined;
  RunningNavigation: {
    course: CourseResponse;
  };
  Setting: undefined;
  RunningRecordList: undefined;
  RunningRecordDetail: {
    recordId: number;
  };
};

// 네비게이션 프롭 타입 헬퍼
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
