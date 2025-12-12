// SpeechSynthesizer - 语音合成服务封装

import type { SupportedLanguage, VoiceError } from './types';
import {
  DEFAULT_VOICE_CONFIG,
  MAX_SYNTHESIS_TEXT_LENGTH,
  SUPPORTED_LANGUAGES,
  ERROR_CODES,
  CHINESE_REGEX,
} from '@/lib/voice/constants';

export interface SynthesizerCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: VoiceError) => void;
  onPause?: () => void;
  onResume?: () => void;
}

export class SpeechSynthesizer {
  private isSpeaking = false;
  private isPaused = false;
  private callbacks: SynthesizerCallbacks = {};
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voiceCache: Map<string, SpeechSynthesisVoice | null> = new Map();

  constructor() {
    this.loadVoices();
  }

  // 加载可用的语音
  private loadVoices(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // 某些浏览器需要等待 voiceschanged 事件
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        this.cacheVoices();
      };
    }

    // 尝试立即加载
    this.cacheVoices();
  }

  // 缓存语音
  private cacheVoices(): void {
    const voices = speechSynthesis.getVoices();

    // 缓存中文语音
    const zhVoice = voices.find(v =>
      v.lang.startsWith('zh') && (v.name.includes('Google') || v.localService)
    ) || voices.find(v => v.lang.startsWith('zh'));
    this.voiceCache.set('zh', zhVoice || null);

    // 缓存英文语音
    const enVoice = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Google') || v.localService)
    ) || voices.find(v => v.lang.startsWith('en'));
    this.voiceCache.set('en', enVoice || null);
  }

  // 获取适合的语音
  private getVoice(language: SupportedLanguage): SpeechSynthesisVoice | null {
    // 先从缓存获取
    let voice = this.voiceCache.get(language);

    if (!voice) {
      // 重新加载语音
      this.cacheVoices();
      voice = this.voiceCache.get(language);
    }

    return voice || null;
  }

  // 自动检测语言
  private detectLanguage(text: string): SupportedLanguage {
    return CHINESE_REGEX.test(text) ? 'zh' : 'en';
  }

  // 检查是否支持语音合成
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
  }

  // 设置回调函数
  setCallbacks(callbacks: SynthesizerCallbacks): void {
    this.callbacks = callbacks;
  }

  // 语音播报
  speak(text: string, language?: SupportedLanguage): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!SpeechSynthesizer.isSupported()) {
        reject({
          code: ERROR_CODES.NOT_SUPPORTED,
          message: 'Speech Synthesis not supported',
        });
        return;
      }

      // 停止当前播放
      if (this.isSpeaking) {
        this.stop();
      }

      // 截断过长文本
      const truncatedText = text.length > MAX_SYNTHESIS_TEXT_LENGTH
        ? text.substring(0, MAX_SYNTHESIS_TEXT_LENGTH) + '...'
        : text;

      // 自动检测语言
      const detectedLanguage = language || this.detectLanguage(truncatedText);
      const langConfig = SUPPORTED_LANGUAGES[detectedLanguage];

      // 创建语音合成实例
      const utterance = new SpeechSynthesisUtterance(truncatedText);
      utterance.lang = langConfig.synthesisLang;
      utterance.rate = DEFAULT_VOICE_CONFIG.synthesis.rate;
      utterance.pitch = DEFAULT_VOICE_CONFIG.synthesis.pitch;
      utterance.volume = DEFAULT_VOICE_CONFIG.synthesis.volume;

      // 设置语音
      const voice = this.getVoice(detectedLanguage);
      if (voice) {
        utterance.voice = voice;
      }

      // 事件处理
      utterance.onstart = () => {
        this.isSpeaking = true;
        this.isPaused = false;
        this.callbacks.onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtterance = null;
        this.callbacks.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtterance = null;

        // 忽略 interrupted 错误 (通常是用户主动停止)
        if (event.error === 'interrupted') {
          resolve();
          return;
        }

        const error: VoiceError = {
          code: ERROR_CODES.SYNTHESIS_ERROR,
          message: `Speech synthesis error: ${event.error}`,
          details: event,
        };
        this.callbacks.onError?.(error);
        reject(error);
      };

      this.currentUtterance = utterance;

      try {
        speechSynthesis.speak(utterance);
      } catch (error) {
        reject({
          code: ERROR_CODES.SYNTHESIS_ERROR,
          message: 'Failed to start speech synthesis',
          details: error,
        });
      }
    });
  }

  // 停止播报
  stop(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentUtterance = null;
  }

  // 暂停播报
  pause(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis && this.isSpeaking) {
      speechSynthesis.pause();
      this.isPaused = true;
      this.callbacks.onPause?.();
    }
  }

  // 恢复播报
  resume(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis && this.isPaused) {
      speechSynthesis.resume();
      this.isPaused = false;
      this.callbacks.onResume?.();
    }
  }

  // 获取当前状态
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  getIsPaused(): boolean {
    return this.isPaused;
  }

  // 获取可用语音列表
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return [];
    }
    return speechSynthesis.getVoices();
  }

  // 设置语速
  setRate(rate: number): void {
    if (rate >= 0.1 && rate <= 10) {
      DEFAULT_VOICE_CONFIG.synthesis.rate = rate;
    }
  }

  // 设置音调
  setPitch(pitch: number): void {
    if (pitch >= 0 && pitch <= 2) {
      DEFAULT_VOICE_CONFIG.synthesis.pitch = pitch;
    }
  }

  // 设置音量
  setVolume(volume: number): void {
    if (volume >= 0 && volume <= 1) {
      DEFAULT_VOICE_CONFIG.synthesis.volume = volume;
    }
  }
}
