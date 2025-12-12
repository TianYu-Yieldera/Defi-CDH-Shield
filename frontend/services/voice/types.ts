// Voice AI 类型定义

import type { CDPPosition } from '@/types';

// 预警级别
export type AlertLevel = 'critical' | 'warning' | 'caution';

// 语音状态
export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

// 支持的语言
export type SupportedLanguage = 'zh' | 'en';

// 命令意图类型
export type CommandIntent =
  | 'check_risk'
  | 'health_factor'
  | 'positions'
  | 'alerts'
  | 'help'
  | 'unknown';

// 语音识别结果
export interface RecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  language: SupportedLanguage;
}

// 命令处理结果
export interface CommandResult {
  intent: CommandIntent;
  data: CDPPosition[] | VoiceAlert[] | null;
  language: SupportedLanguage;
  rawTranscript: string;
}

// 语音预警
export interface VoiceAlert {
  id: string;
  positionId: string;
  protocol: string;
  level: AlertLevel;
  healthFactor: number;
  message: string;
  timestamp: number;
  dismissed: boolean;
}

// 语音服务配置
export interface VoiceConfig {
  // 语音识别配置
  recognition: {
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    lang: string;
  };
  // 语音合成配置
  synthesis: {
    rate: number;
    pitch: number;
    volume: number;
  };
  // 预警配置
  alert: {
    criticalThreshold: number;
    warningThreshold: number;
    cautionThreshold: number;
    cooldownMs: number;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
}

// 语音服务事件
export interface VoiceEvents {
  onStart?: () => void;
  onResult?: (result: RecognitionResult) => void;
  onEnd?: () => void;
  onError?: (error: VoiceError) => void;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
}

// 语音错误
export interface VoiceError {
  code: string;
  message: string;
  details?: unknown;
}

// 语音设置
export interface VoiceSettings {
  speechRate: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// 语音状态存储
export interface VoiceState {
  status: VoiceStatus;
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  hasPermission: boolean;
  transcript: string;
  interimTranscript: string;
  response: string;
  alerts: VoiceAlert[];
  lastError: VoiceError | null;
  language: SupportedLanguage;
  settings: VoiceSettings;
}

// 语音状态操作
export interface VoiceActions {
  setStatus: (status: VoiceStatus) => void;
  setListening: (listening: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setSupported: (supported: boolean) => void;
  setPermission: (hasPermission: boolean) => void;
  setTranscript: (transcript: string) => void;
  setInterimTranscript: (transcript: string) => void;
  setResponse: (response: string) => void;
  setLanguage: (language: SupportedLanguage) => void;
  addAlert: (alert: Omit<VoiceAlert, 'id' | 'timestamp' | 'dismissed'>) => void;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
  cleanupAlerts: () => void;
  setError: (error: VoiceError | null) => void;
  updateSettings: (settings: Partial<VoiceSettings>) => void;
  reset: () => void;
}

// 完整的语音存储类型
export type VoiceStore = VoiceState & VoiceActions;

// Web Speech API 类型补充
export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// 全局 Window 扩展
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
