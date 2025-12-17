import {useEffect, useState, useCallback} from 'react';
import ttsService, {TTSConfig} from '../services/tts/ttsService';

/**
 * TTS Hook 반환 타입
 */
export interface UseTTSReturn {
  // 상태
  isSpeaking: boolean;
  isInitialized: boolean;

  // 메서드
  speak: (text: string, queueMode?: boolean) => Promise<void>;
  stop: () => Promise<void>;
  setRate: (rate: number) => Promise<void>;
  setPitch: (pitch: number) => Promise<void>;
  setLanguage: (language: string) => Promise<void>;

  // 설정
  config: TTSConfig;
}

/**
 * TTS Hook 옵션
 */
export interface UseTTSOptions {
  autoInitialize?: boolean; // 자동 초기화 여부 (기본값: true)
  initialConfig?: TTSConfig; // 초기 설정
  onStart?: () => void; // 음성 시작 콜백
  onFinish?: () => void; // 음성 종료 콜백
  onError?: (error: any) => void; // 에러 콜백
}

/**
 * TTS 커스텀 Hook
 *
 * React 컴포넌트에서 TTS 기능을 쉽게 사용할 수 있도록 제공
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { speak, stop, isSpeaking } = useTTS({
 *     onFinish: () => console.log('음성 종료'),
 *   });
 *
 *   return (
 *     <View>
 *       <Button onPress={() => speak('안녕하세요')} title="말하기" />
 *       <Button onPress={stop} title="중지" />
 *       <Text>{isSpeaking ? '말하는 중...' : '대기 중'}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useTTS(options?: UseTTSOptions): UseTTSReturn {
  const {
    autoInitialize = true,
    initialConfig,
    onStart,
    onFinish,
    onError,
  } = options || {};

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [config, setConfig] = useState<TTSConfig>(
    initialConfig || {
      language: 'ko-KR',
      rate: 0.5,
      pitch: 1.0,
    },
  );

  // TTS 초기화
  useEffect(() => {
    if (autoInitialize) {
      const init = async () => {
        try {
          await ttsService.initialize(initialConfig);
          setIsInitialized(true);
          console.log('[useTTS] Initialized');
        } catch (error) {
          console.error('[useTTS] Initialization failed:', error);
          onError?.(error);
        }
      };

      init();
    }
  }, [autoInitialize, initialConfig, onError]);

  // 이벤트 리스너 등록
  useEffect(() => {
    const removeListeners = ttsService.addEventListener({
      onStart: () => {
        console.log('[useTTS] Speech started');
        setIsSpeaking(true);
        onStart?.();
      },
      onFinish: () => {
        console.log('[useTTS] Speech finished');
        setIsSpeaking(false);
        onFinish?.();
      },
      onCancel: () => {
        console.log('[useTTS] Speech cancelled');
        setIsSpeaking(false);
      },
      onError: error => {
        console.error('[useTTS] Speech error:', error);
        setIsSpeaking(false);
        onError?.(error);
      },
    });

    return () => {
      removeListeners();
    };
  }, [onStart, onFinish, onError]);

  // 주기적으로 말하기 상태 체크는 이벤트 리스너로 대체
  // (react-native-tts의 isSpeaking이 일부 버전에서 지원되지 않음)

  // 텍스트 음성 변환
  const speak = useCallback(
    async (text: string, queueMode: boolean = false) => {
      try {
        await ttsService.speak(text, queueMode);
      } catch (error) {
        console.error('[useTTS] Speak failed:', error);
        onError?.(error);
      }
    },
    [onError],
  );

  // 음성 중지
  const stop = useCallback(async () => {
    try {
      await ttsService.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error('[useTTS] Stop failed:', error);
    }
  }, []);

  // 말하기 속도 변경
  const setRate = useCallback(
    async (rate: number) => {
      try {
        await ttsService.setRate(rate);
        setConfig(prev => ({...prev, rate}));
      } catch (error) {
        console.error('[useTTS] Set rate failed:', error);
        onError?.(error);
      }
    },
    [onError],
  );

  // 음높이 변경
  const setPitch = useCallback(
    async (pitch: number) => {
      try {
        await ttsService.setPitch(pitch);
        setConfig(prev => ({...prev, pitch}));
      } catch (error) {
        console.error('[useTTS] Set pitch failed:', error);
        onError?.(error);
      }
    },
    [onError],
  );

  // 언어 변경
  const setLanguage = useCallback(
    async (language: string) => {
      try {
        await ttsService.setLanguage(language);
        setConfig(prev => ({...prev, language}));
      } catch (error) {
        console.error('[useTTS] Set language failed:', error);
        onError?.(error);
      }
    },
    [onError],
  );

  return {
    isSpeaking,
    isInitialized,
    speak,
    stop,
    setRate,
    setPitch,
    setLanguage,
    config,
  };
}

export default useTTS;
