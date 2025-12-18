import Tts from 'react-native-tts';
import {Vibration} from 'react-native';
import {getTTSVibrationSetting} from '../../screens/Setting/SettingScreen';

/**
 * TTS 초기화 옵션
 */
export interface TTSConfig {
  language?: string; // 언어 코드 (예: 'ko-KR', 'en-US')
  rate?: number; // 말하기 속도 (0.0 ~ 1.0, 기본값: 0.5)
  pitch?: number; // 음높이 (0.0 ~ 2.0, 기본값: 1.0)
}

/**
 * TTS 이벤트 리스너 타입
 */
export interface TTSEventListeners {
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
}

/**
 * TTS 서비스 클래스
 * Android TTS API를 래핑하여 텍스트 음성 변환 기능 제공
 */
class TTSService {
  private isInitialized = false;
  private currentLanguage = 'ko-KR';
  private currentRate = 0.5;
  private currentPitch = 1.0;

  /**
   * TTS 초기화
   */
  async initialize(config?: TTSConfig): Promise<void> {
    if (this.isInitialized) {
      console.log('[TTS] Already initialized');
      return;
    }

    try {
      // 사용 가능한 음성 엔진 확인
      const engines = await Tts.engines();
      console.log('[TTS] Available engines:', engines);

      // 기본 언어 설정
      const language = config?.language || this.currentLanguage;
      await Tts.setDefaultLanguage(language);
      this.currentLanguage = language;

      // 말하기 속도 설정 (0.0 ~ 1.0)
      const rate = config?.rate !== undefined ? config.rate : this.currentRate;
      await Tts.setDefaultRate(rate);
      this.currentRate = rate;

      // 음높이 설정 (0.0 ~ 2.0)
      const pitch =
        config?.pitch !== undefined ? config.pitch : this.currentPitch;
      await Tts.setDefaultPitch(pitch);
      this.currentPitch = pitch;

      // 초기화된 음성 확인
      const voices = await Tts.voices();
      console.log('[TTS] Available voices:', voices.length);

      this.isInitialized = true;
      console.log('[TTS] Initialized successfully', {
        language: this.currentLanguage,
        rate: this.currentRate,
        pitch: this.currentPitch,
      });
    } catch (error) {
      console.error('[TTS] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 텍스트를 음성으로 변환하여 재생
   */
  async speak(text: string, queueMode: boolean = false): Promise<void> {
    if (!this.isInitialized) {
      console.warn('[TTS] Not initialized, initializing now...');
      await this.initialize();
    }

    try {
      console.log('[TTS] Speaking:', text);

      // queueMode가 false면 기존 음성 중지 후 재생
      if (!queueMode) {
        await this.stop();
      }

      // 진동 설정 확인 및 실행
      const isVibrationEnabled = await getTTSVibrationSetting();
      if (isVibrationEnabled) {
        Vibration.vibrate(200); // 200ms 진동
      }

      // react-native-tts는 옵션 없이도 작동
      Tts.speak(text);
    } catch (error) {
      console.error('[TTS] Speak failed:', error);
      throw error;
    }
  }

  /**
   * 음성 재생 중지
   */
  async stop(): Promise<void> {
    try {
      await Tts.stop();
      console.log('[TTS] Stopped');
    } catch (error) {
      console.error('[TTS] Stop failed:', error);
    }
  }

  /**
   * 음성 재생 일시정지 (Android 지원)
   */
  async pause(): Promise<void> {
    try {
      // react-native-tts는 pause를 직접 지원하지 않음
      // stop으로 대체
      await this.stop();
      console.log('[TTS] Paused (stopped)');
    } catch (error) {
      console.error('[TTS] Pause failed:', error);
    }
  }

  /**
   * 현재 말하기 속도 변경
   */
  async setRate(rate: number): Promise<void> {
    try {
      await Tts.setDefaultRate(rate);
      this.currentRate = rate;
      console.log('[TTS] Rate changed to:', rate);
    } catch (error) {
      console.error('[TTS] Set rate failed:', error);
    }
  }

  /**
   * 현재 음높이 변경
   */
  async setPitch(pitch: number): Promise<void> {
    try {
      await Tts.setDefaultPitch(pitch);
      this.currentPitch = pitch;
      console.log('[TTS] Pitch changed to:', pitch);
    } catch (error) {
      console.error('[TTS] Set pitch failed:', error);
    }
  }

  /**
   * 현재 언어 변경
   */
  async setLanguage(language: string): Promise<void> {
    try {
      await Tts.setDefaultLanguage(language);
      this.currentLanguage = language;
      console.log('[TTS] Language changed to:', language);
    } catch (error) {
      console.error('[TTS] Set language failed:', error);
    }
  }

  /**
   * 이벤트 리스너 등록
   */
  addEventListener(listeners: TTSEventListeners): () => void {
    const subscriptions: any[] = [];

    if (listeners.onStart) {
      const sub = Tts.addEventListener('tts-start', listeners.onStart);
      subscriptions.push(sub);
    }

    if (listeners.onFinish) {
      const sub = Tts.addEventListener('tts-finish', listeners.onFinish);
      subscriptions.push(sub);
    }

    if (listeners.onCancel) {
      const sub = Tts.addEventListener('tts-cancel', listeners.onCancel);
      subscriptions.push(sub);
    }

    if (listeners.onError) {
      const sub = Tts.addEventListener('tts-error', listeners.onError);
      subscriptions.push(sub);
    }

    // 구독 해제 함수 반환
    return () => {
      subscriptions.forEach(sub => {
        if (sub && typeof sub.remove === 'function') {
          sub.remove();
        }
      });
    };
  }

  /**
   * TTS가 현재 말하는 중인지 확인
   *
   * 참고: react-native-tts의 isSpeaking()은 지원되지 않습니다.
   * 이벤트 리스너(tts-start, tts-finish)를 통해 상태를 추적하세요.
   */
  isSpeaking(): boolean {
    // 이벤트 기반으로 상태를 추적하도록 변경됨
    console.warn('[TTS] isSpeaking() is not supported. Use event listeners instead.');
    return false;
  }

  /**
   * 사용 가능한 음성 목록 가져오기
   */
  async getVoices(): Promise<any[]> {
    try {
      return await Tts.voices();
    } catch (error) {
      console.error('[TTS] Get voices failed:', error);
      return [];
    }
  }

  /**
   * 현재 설정 가져오기
   */
  getConfig(): TTSConfig {
    return {
      language: this.currentLanguage,
      rate: this.currentRate,
      pitch: this.currentPitch,
    };
  }
}

// 싱글톤 인스턴스 생성
const ttsService = new TTSService();

export default ttsService;
