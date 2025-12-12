// Voice AI 常量配置

import type { VoiceConfig } from '@/services/voice/types';

// 默认语音配置
export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  recognition: {
    continuous: false,
    interimResults: true,
    maxAlternatives: 1,
    lang: 'zh-CN', // 默认中文，会自动检测
  },
  synthesis: {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  },
  alert: {
    criticalThreshold: 1.1,   // 健康因子 < 1.1 触发紧急警报
    warningThreshold: 1.3,    // 健康因子 < 1.3 触发警告
    cautionThreshold: 1.5,    // 健康因子 < 1.5 触发注意
    cooldownMs: 60000,        // 60秒冷却时间
    soundEnabled: true,       // 启用警报音效
    vibrationEnabled: true,   // 启用震动 (移动端)
  },
};

// 语音识别超时时间 (毫秒)
export const RECOGNITION_TIMEOUT = 10000;

// 语音合成最大文本长度
export const MAX_SYNTHESIS_TEXT_LENGTH = 500;

// 支持的语言配置
export const SUPPORTED_LANGUAGES = {
  zh: {
    code: 'zh-CN',
    name: '中文',
    recognitionLang: 'zh-CN',
    synthesisLang: 'zh-CN',
  },
  en: {
    code: 'en-US',
    name: 'English',
    recognitionLang: 'en-US',
    synthesisLang: 'en-US',
  },
} as const;

// 中文字符检测正则
export const CHINESE_REGEX = /[\u4e00-\u9fa5]/;

// 错误码映射
export const ERROR_CODES = {
  NOT_SUPPORTED: 'voice_not_supported',
  NO_PERMISSION: 'no_microphone_permission',
  NETWORK_ERROR: 'network_error',
  RECOGNITION_ERROR: 'recognition_error',
  SYNTHESIS_ERROR: 'synthesis_error',
  TIMEOUT: 'recognition_timeout',
  ABORTED: 'recognition_aborted',
  NO_SPEECH: 'no_speech_detected',
} as const;

// 错误消息 (中英文)
export const ERROR_MESSAGES = {
  [ERROR_CODES.NOT_SUPPORTED]: {
    zh: '您的浏览器不支持语音功能，请使用 Chrome 或 Edge 浏览器。',
    en: 'Your browser does not support voice features. Please use Chrome or Edge.',
  },
  [ERROR_CODES.NO_PERMISSION]: {
    zh: '请授予麦克风权限以使用语音功能。',
    en: 'Please grant microphone permission to use voice features.',
  },
  [ERROR_CODES.NETWORK_ERROR]: {
    zh: '网络连接出现问题，请检查您的网络。',
    en: 'Network connection error. Please check your network.',
  },
  [ERROR_CODES.RECOGNITION_ERROR]: {
    zh: '语音识别出现问题，请重试。',
    en: 'Speech recognition error. Please try again.',
  },
  [ERROR_CODES.SYNTHESIS_ERROR]: {
    zh: '语音播报出现问题，请重试。',
    en: 'Speech synthesis error. Please try again.',
  },
  [ERROR_CODES.TIMEOUT]: {
    zh: '没有检测到语音，请重试。',
    en: 'No speech detected. Please try again.',
  },
  [ERROR_CODES.ABORTED]: {
    zh: '语音识别已取消。',
    en: 'Speech recognition was cancelled.',
  },
  [ERROR_CODES.NO_SPEECH]: {
    zh: '没有检测到语音，请说话后重试。',
    en: 'No speech was detected. Please speak and try again.',
  },
} as const;

// 注意：音效现在使用 Web Audio API 动态生成
// 参见 /services/voice/SoundGenerator.ts

// 震动模式 (毫秒)
export const VIBRATION_PATTERNS = {
  critical: [200, 100, 200, 100, 200],  // 紧急：长-短-长-短-长
  warning: [200, 100, 200],              // 警告：长-短-长
  notification: [100],                    // 通知：短
} as const;

// 预警级别颜色
export const ALERT_COLORS = {
  critical: {
    bg: 'bg-red-500',
    text: 'text-white',
    border: 'border-red-600',
  },
  warning: {
    bg: 'bg-orange-500',
    text: 'text-white',
    border: 'border-orange-600',
  },
  caution: {
    bg: 'bg-yellow-500',
    text: 'text-gray-900',
    border: 'border-yellow-600',
  },
} as const;

// 预警级别图标
export const ALERT_ICONS = {
  critical: '',
  warning: '',
  caution: '',
} as const;

// 动画持续时间 (毫秒)
export const ANIMATION_DURATION = {
  fadeIn: 200,
  fadeOut: 200,
  pulse: 1000,
  wave: 500,
} as const;

// 浏览器兼容性检测
export function checkBrowserSupport(): {
  speechRecognition: boolean;
  speechSynthesis: boolean;
  vibration: boolean;
  wakeLock: boolean;
} {
  const isBrowser = typeof window !== 'undefined';

  return {
    speechRecognition: isBrowser && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
    speechSynthesis: isBrowser && 'speechSynthesis' in window,
    vibration: isBrowser && 'vibrate' in navigator,
    wakeLock: isBrowser && 'wakeLock' in navigator,
  };
}
