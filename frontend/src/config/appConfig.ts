/**
 * 앱 전역 설정
 *
 * 디버그 UI, 테스트 모드 등을 제어합니다.
 * 릴리즈 빌드 전에 SHOW_DEBUG_UI를 false로 변경하세요.
 */

export const AppConfig = {
  /**
   * 디버그 UI 표시 여부
   * - true: 좌표, 상태 등 디버그 정보 표시
   * - false: 디버그 UI 숨김 (릴리즈용)
   */
  SHOW_DEBUG_UI: false,

  /**
   * 콘솔 로그 활성화 여부
   * - true: 상세 로그 출력
   * - false: 로그 비활성화 (릴리즈용)
   */
  ENABLE_CONSOLE_LOGS: __DEV__,
};
