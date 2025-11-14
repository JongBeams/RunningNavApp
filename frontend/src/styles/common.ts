import {StyleSheet} from 'react-native';
import {colors, spacing, fontSize, borderRadius, shadows} from './theme';

/**
 * 여러 컴포넌트에서 재사용 가능한 공통 스타일
 */
export const commonStyles = StyleSheet.create({
  // ========== 컨테이너 스타일 (Container Styles) ==========

  // 기본 컨테이너 - 전체 화면을 채우는 기본 배경
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // 패딩이 있는 컨테이너 - 내부에 여백이 있는 컨테이너
  containerPadded: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.base,
  },

  // 중앙 정렬 컨테이너 - 내용을 화면 중앙에 배치
  contentCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ========== 카드 스타일 (Card Styles) ==========

  // 기본 카드 - 일반적인 콘텐츠를 담는 카드
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
    ...shadows.base,
  },

  // 큰 카드 - 더 많은 여백과 강조가 필요한 카드
  cardLarge: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.base,
    ...shadows.md,
  },

  // ========== 텍스트 스타일 (Text Styles) ==========

  // 제목 - 화면의 메인 제목
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },

  // 부제목 - 제목 아래의 설명 텍스트
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  // 소제목 - 섹션의 제목
  heading: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },

  // 본문 - 일반적인 내용 텍스트
  body: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // ========== 버튼 스타일 (Button Styles) ==========

  // 주요 버튼 - 주요 액션에 사용 (파란색 배경)
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 주요 버튼 텍스트
  buttonPrimaryText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '700',
  },

  // 보조 버튼 - 보조 액션에 사용 (흰색 배경 + 파란 테두리)
  buttonSecondary: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },

  // 보조 버튼 텍스트
  buttonSecondaryText: {
    color: colors.primary,
    fontSize: fontSize.base,
    fontWeight: '700',
  },

  // 외곽선 버튼 - 덜 중요한 액션에 사용 (투명 배경 + 회색 테두리)
  buttonOutline: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // 외곽선 버튼 텍스트
  buttonOutlineText: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '600',
  },

  // ========== 입력 필드 스타일 (Input Styles) ==========

  // 기본 입력 필드 - 텍스트 입력에 사용
  input: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.base,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // 포커스된 입력 필드 - 입력 중일 때의 스타일
  inputFocused: {
    borderColor: colors.primary,
  },

  // ========== 구분선 (Divider) ==========

  // 구분선 - 콘텐츠를 구분하는 선
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.base,
  },

  // ========== 간격 유틸리티 (Spacing Utilities) ==========

  // 위 여백 (Margin Top)
  mt_xs: {marginTop: spacing.xs}, // 위 여백 4px
  mt_sm: {marginTop: spacing.sm}, // 위 여백 8px
  mt_md: {marginTop: spacing.md}, // 위 여백 12px
  mt_base: {marginTop: spacing.base}, // 위 여백 16px
  mt_lg: {marginTop: spacing.lg}, // 위 여백 20px
  mt_xl: {marginTop: spacing.xl}, // 위 여백 24px

  // 아래 여백 (Margin Bottom)
  mb_xs: {marginBottom: spacing.xs}, // 아래 여백 4px
  mb_sm: {marginBottom: spacing.sm}, // 아래 여백 8px
  mb_md: {marginBottom: spacing.md}, // 아래 여백 12px
  mb_base: {marginBottom: spacing.base}, // 아래 여백 16px
  mb_lg: {marginBottom: spacing.lg}, // 아래 여백 20px
  mb_xl: {marginBottom: spacing.xl}, // 아래 여백 24px

  // 내부 여백 (Padding)
  p_xs: {padding: spacing.xs}, // 내부 여백 4px
  p_sm: {padding: spacing.sm}, // 내부 여백 8px
  p_md: {padding: spacing.md}, // 내부 여백 12px
  p_base: {padding: spacing.base}, // 내부 여백 16px
  p_lg: {padding: spacing.lg}, // 내부 여백 20px
  p_xl: {padding: spacing.xl}, // 내부 여백 24px
});

/* 
 아이콘 경로 모음
 */
//홈 아이콘
export const HOME_ICON_PATH =
  "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25";
//사용자 아이콘
export const USER_ICON_PATH ="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z";
//러닝 아이콘
export const RUNNIGN_ICON_PATH = "M 9.796875 5.300781 C 9.230469 5.394531 8.570312 5.832031 8.253906 6.324219 C 7.984375 6.742188 7.914062 7.027344 7.875 7.828125 C 7.847656 8.394531 7.820312 8.609375 7.738281 8.8125 C 7.539062 9.332031 7.128906 9.730469 6.570312 9.9375 C 6.355469 10.023438 6.226562 10.035156 5.882812 10.023438 C 5.527344 10.011719 5.414062 9.984375 5.148438 9.859375 C 4.695312 9.648438 4.433594 9.359375 4.105469 8.726562 C 3.789062 8.113281 3.492188 7.808594 3 7.574219 C 2.714844 7.4375 2.664062 7.429688 2.128906 7.429688 C 1.570312 7.429688 1.5625 7.429688 1.210938 7.609375 C 0.601562 7.90625 0.171875 8.460938 0.046875 9.117188 C 0.0078125 9.320312 0 10.304688 0.0078125 12.5625 C 0.0273438 15.699219 0.0273438 15.730469 0.136719 16.082031 C 0.558594 17.488281 1.761719 18.515625 3.210938 18.703125 C 3.648438 18.757812 20.351562 18.757812 20.789062 18.703125 C 22.011719 18.542969 23.0625 17.796875 23.601562 16.710938 C 23.949219 16.003906 24.070312 15.261719 23.953125 14.546875 C 23.664062 12.71875 22.148438 11.4375 20.277344 11.4375 C 19.261719 11.4375 18.355469 11.183594 17.605469 10.691406 C 17.503906 10.625 16.078125 9.460938 14.445312 8.101562 C 12.464844 6.449219 11.386719 5.585938 11.21875 5.503906 C 10.941406 5.375 10.425781 5.25 10.195312 5.253906 C 10.121094 5.257812 9.9375 5.277344 9.796875 5.300781 Z M 10.613281 6.78125 C 10.691406 6.824219 11.066406 7.117188 11.445312 7.429688 L 12.132812 8 L 10.59375 9.539062 L 11.601562 10.546875 L 12.421875 9.730469 L 13.242188 8.910156 L 13.382812 9.039062 C 13.460938 9.109375 13.597656 9.226562 13.683594 9.296875 L 13.84375 9.425781 L 13.109375 10.164062 L 12.375 10.898438 L 13.359375 11.882812 L 14.125 11.117188 C 14.539062 10.703125 14.902344 10.359375 14.925781 10.359375 C 14.949219 10.359375 15.085938 10.457031 15.230469 10.578125 C 15.375 10.703125 15.5 10.804688 15.515625 10.8125 C 15.523438 10.824219 15.21875 11.148438 14.835938 11.53125 L 14.132812 12.234375 L 15.117188 13.21875 L 15.867188 12.46875 L 16.617188 11.722656 L 16.875 11.886719 C 17.828125 12.496094 19.007812 12.84375 20.148438 12.84375 C 20.925781 12.84375 21.390625 13.011719 21.875 13.46875 C 22.191406 13.761719 22.476562 14.25 22.53125 14.585938 L 22.5625 14.765625 L 1.40625 14.765625 L 1.40625 12.054688 C 1.40625 9.511719 1.410156 9.34375 1.496094 9.1875 C 1.621094 8.945312 1.84375 8.8125 2.125 8.8125 C 2.5 8.8125 2.625 8.925781 2.9375 9.53125 C 3.164062 9.96875 3.277344 10.121094 3.609375 10.457031 C 3.933594 10.785156 4.085938 10.898438 4.4375 11.070312 C 5.019531 11.367188 5.441406 11.457031 6.109375 11.429688 C 6.535156 11.410156 6.707031 11.382812 7.035156 11.265625 C 8.03125 10.921875 8.796875 10.121094 9.125 9.101562 C 9.21875 8.8125 9.25 8.597656 9.277344 8.011719 C 9.304688 7.316406 9.3125 7.269531 9.4375 7.085938 C 9.6875 6.699219 10.195312 6.566406 10.613281 6.78125 Z M 22.265625 16.210938 C 22.265625 16.28125 22.007812 16.613281 21.828125 16.765625 C 21.605469 16.964844 21.320312 17.125 21 17.230469 C 20.75 17.316406 20.40625 17.320312 12 17.320312 C 3.59375 17.320312 3.25 17.316406 3 17.230469 C 2.679688 17.125 2.394531 16.964844 2.171875 16.765625 C 1.992188 16.613281 1.734375 16.28125 1.734375 16.210938 C 1.734375 16.191406 6.355469 16.171875 12 16.171875 C 17.648438 16.171875 22.265625 16.191406 22.265625 16.210938 Z M 22.265625 16.210938 "
//경로 추가 아이콘
export const ADD_COURSE_ICON_PATH="M12 4.5v15m7.5-7.5h-15";
//경로 리스트 아이콘
export const LIST_COURSE_ICON_PATH="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z";