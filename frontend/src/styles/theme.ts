/**
 * 앱 전체에서 사용하는 테마 상수
 */

export const colors = {
  // 주요 색상 (Primary Colors)
  primary: '#007AFF', // 메인 브랜드 색상 (파란색)
  primaryDark: '#0051D5', // 메인 색상 - 진한 버전
  primaryLight: '#4DA2FF', // 메인 색상 - 밝은 버전

  // 보조 색상 (Secondary Colors)
  secondary: '#8E8E93', // 보조 색상 (회색)
  secondaryLight: '#C7C7CC', // 보조 색상 - 밝은 버전

  // 배경 색상 (Background Colors)
  background: '#f5f5f5', // 기본 배경색
  backgroundLight: '#ffffff', // 밝은 배경색 (흰색)
  backgroundDark: '#e0e0e0', // 어두운 배경색

  // 텍스트 색상 (Text Colors)
  text: '#333333', // 기본 텍스트 색상 (진한 회색)
  textSecondary: '#666666', // 보조 텍스트 색상 (중간 회색)
  textLight: '#999999', // 연한 텍스트 색상 (밝은 회색)

  // 회색 계열 (Gray Scale)
  darkGray: '#333333', // 진한 회색
  gray: '#666666', // 중간 회색
  lightGray: '#CCCCCC', // 밝은 회색

  // UI 요소 색상 (UI Colors)
  border: '#e0e0e0', // 테두리 색상
  borderLight: '#f0f0f0', // 밝은 테두리 색상
  shadow: '#000000', // 그림자 색상

  // 상태 색상 (Status Colors)
  success: '#34C759', // 성공 (녹색)
  warning: '#FF9500', // 경고 (주황색)
  error: '#FF3B30', // 오류 (빨간색)
  info: '#5AC8FA', // 정보 (하늘색)

  // 기능 색상 (Functional Colors)
  white: '#FFFFFF', // 흰색
  black: '#000000', // 검은색
};

// 간격 (Spacing)
export const spacing = {
  xs: 4, // 아주 작은 간격 (4px)
  sm: 8, // 작은 간격 (8px)
  md: 12, // 중간 간격 (12px)
  base: 16, // 기본 간격 (16px)
  lg: 20, // 큰 간격 (20px)
  xl: 24, // 아주 큰 간격 (24px)
  xxl: 32, // 매우 큰 간격 (32px)
  xxxl: 40, // 초대형 간격 (40px)
};

// 폰트 크기 (Font Size)
export const fontSize = {
  xs: 12, // 매우 작은 텍스트 (12px) - 캡션, 힌트
  sm: 14, // 작은 텍스트 (14px) - 보조 텍스트
  base: 16, // 기본 텍스트 (16px) - 본문
  lg: 18, // 큰 텍스트 (18px) - 소제목
  xl: 20, // 아주 큰 텍스트 (20px) - 제목
  xxl: 24, // 매우 큰 텍스트 (24px) - 큰 제목
  xxxl: 28, // 초대형 텍스트 (28px) - 페이지 제목
  display: 32, // 디스플레이용 텍스트 (32px) - 특별한 제목
};

// 폰트 굵기 (Font Weight)
export const fontWeight = {
  normal: '400' as const, // 보통 (400)
  medium: '500' as const, // 중간 (500)
  semiBold: '600' as const, // 세미볼드 (600)
  bold: '700' as const, // 굵게 (700)
};

// 모서리 둥글기 (Border Radius)
export const borderRadius = {
  sm: 4, // 작은 둥글기 (4px)
  base: 8, // 기본 둥글기 (8px)
  md: 12, // 중간 둥글기 (12px)
  lg: 16, // 큰 둥글기 (16px)
  xl: 20, // 아주 큰 둥글기 (20px)
  full: 999, // 완전한 원형 (999px)
};

// 그림자 효과 (Shadows)
export const shadows = {
  // 작은 그림자 - 카드, 버튼 등에 사용
  sm: {
    shadowColor: colors.shadow, // 그림자 색상
    shadowOffset: {width: 0, height: 1}, // 그림자 위치 (아래로 1px)
    shadowOpacity: 0.05, // 그림자 투명도 (5%)
    shadowRadius: 2, // 그림자 블러 반경
    elevation: 1, // Android 전용 그림자 레벨
  },
  // 기본 그림자 - 일반 카드에 사용
  base: {
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // 중간 그림자 - 강조할 요소에 사용
  md: {
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  // 큰 그림자 - 모달, 팝업 등에 사용
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const theme = {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadows,
};

export type Theme = typeof theme;
