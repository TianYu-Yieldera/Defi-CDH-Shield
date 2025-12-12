// SpeechRecognizer - 语音识别服务封装

import type {
  RecognitionResult,
  SupportedLanguage,
  VoiceError,
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from './types';
import {
  DEFAULT_VOICE_CONFIG,
  RECOGNITION_TIMEOUT,
  ERROR_CODES,
  SUPPORTED_LANGUAGES,
} from '@/lib/voice/constants';
import { detectLanguage } from '@/lib/voice/commands';

export interface RecognizerCallbacks {
  onStart?: () => void;
  onResult?: (result: RecognitionResult) => void;
  onEnd?: () => void;
  onError?: (error: VoiceError) => void;
}

export class SpeechRecognizer {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private timeoutId: NodeJS.Timeout | null = null;
  private callbacks: RecognizerCallbacks = {};
  private pendingPromise: {
    resolve: (result: RecognitionResult) => void;
    reject: (error: VoiceError) => void;
  } | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn('Speech Recognition API not supported');
      return;
    }

    this.recognition = new SpeechRecognitionAPI();
    this.configureRecognition();
    this.setupEventListeners();
  }

  private configureRecognition(): void {
    if (!this.recognition) return;

    const config = DEFAULT_VOICE_CONFIG.recognition;
    this.recognition.continuous = config.continuous;
    this.recognition.interimResults = config.interimResults;
    this.recognition.maxAlternatives = config.maxAlternatives;
    this.recognition.lang = config.lang;
  }

  private setupEventListeners(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.callbacks.onStart?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;
      const language = detectLanguage(transcript);

      const recognitionResult: RecognitionResult = {
        transcript,
        confidence,
        isFinal,
        language,
      };

      // 始终调用外部回调
      this.callbacks.onResult?.(recognitionResult);

      // 如果是最终结果，resolve pending promise
      if (isFinal) {
        this.clearTimeout();
        if (this.pendingPromise) {
          this.pendingPromise.resolve(recognitionResult);
          this.pendingPromise = null;
        }
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.clearTimeout();
      this.callbacks.onEnd?.();
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false;
      this.clearTimeout();

      const error = this.mapError(event.error);

      // 始终调用外部回调
      this.callbacks.onError?.(error);

      // reject pending promise
      if (this.pendingPromise) {
        this.pendingPromise.reject(error);
        this.pendingPromise = null;
      }
    };
  }

  private mapError(errorType: string): VoiceError {
    const errorMap: Record<string, { code: string; message: string }> = {
      'not-allowed': {
        code: ERROR_CODES.NO_PERMISSION,
        message: 'Microphone permission denied',
      },
      'network': {
        code: ERROR_CODES.NETWORK_ERROR,
        message: 'Network error occurred',
      },
      'no-speech': {
        code: ERROR_CODES.NO_SPEECH,
        message: 'No speech was detected',
      },
      'aborted': {
        code: ERROR_CODES.ABORTED,
        message: 'Recognition was aborted',
      },
      'audio-capture': {
        code: ERROR_CODES.RECOGNITION_ERROR,
        message: 'Audio capture failed',
      },
      'service-not-allowed': {
        code: ERROR_CODES.NOT_SUPPORTED,
        message: 'Speech service not allowed',
      },
    };

    const mappedError = errorMap[errorType] || {
      code: ERROR_CODES.RECOGNITION_ERROR,
      message: `Recognition error: ${errorType}`,
    };

    return {
      code: mappedError.code,
      message: mappedError.message,
      details: { originalError: errorType },
    };
  }

  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  // 检查是否支持语音识别
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  // 设置回调函数
  setCallbacks(callbacks: RecognizerCallbacks): void {
    this.callbacks = callbacks;
  }

  // 设置识别语言
  setLanguage(language: SupportedLanguage): void {
    if (this.recognition) {
      this.recognition.lang = SUPPORTED_LANGUAGES[language].recognitionLang;
    }
  }

  // 开始识别
  start(): Promise<RecognitionResult> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject({
          code: ERROR_CODES.NOT_SUPPORTED,
          message: 'Speech Recognition not supported',
        });
        return;
      }

      // 如果已经有 pending promise，先 reject 它
      if (this.pendingPromise) {
        this.pendingPromise.reject({
          code: ERROR_CODES.ABORTED,
          message: 'Recognition aborted by new request',
        });
      }

      if (this.isListening) {
        this.stop();
      }

      // 设置超时
      this.timeoutId = setTimeout(() => {
        this.stop();
        if (this.pendingPromise) {
          this.pendingPromise.reject({
            code: ERROR_CODES.TIMEOUT,
            message: 'Recognition timeout',
          });
          this.pendingPromise = null;
        }
      }, RECOGNITION_TIMEOUT);

      // 设置 pending promise
      this.pendingPromise = { resolve, reject };

      try {
        this.recognition.start();
      } catch (error) {
        this.clearTimeout();
        this.pendingPromise = null;
        reject({
          code: ERROR_CODES.RECOGNITION_ERROR,
          message: 'Failed to start recognition',
          details: error,
        });
      }
    });
  }

  // 停止识别
  stop(): void {
    this.clearTimeout();
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.warn('Error stopping recognition:', error);
      }
    }
    this.isListening = false;
  }

  // 中止识别
  abort(): void {
    this.clearTimeout();
    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
      } catch (error) {
        console.warn('Error aborting recognition:', error);
      }
    }
    this.isListening = false;
  }

  // 获取当前状态
  getIsListening(): boolean {
    return this.isListening;
  }

  // 请求麦克风权限
  static async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 获取权限后立即释放
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.warn('Microphone permission denied:', error);
      return false;
    }
  }
}
