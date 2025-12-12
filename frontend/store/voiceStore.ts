// voiceStore - 语音状态管理

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  VoiceStore,
  VoiceStatus,
  VoiceAlert,
  VoiceError,
  SupportedLanguage,
  VoiceSettings,
} from '@/services/voice/types';

// 生成唯一 ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Alert 保留时间 (已 dismiss 的 alert 保留 1 小时后清理)
const ALERT_RETENTION_MS = 60 * 60 * 1000; // 1 hour

// 清理过期的已 dismiss alerts
const cleanupOldAlerts = (alerts: VoiceAlert[]): VoiceAlert[] => {
  const now = Date.now();
  return alerts.filter((alert) => {
    // 保留未 dismiss 的 alerts
    if (!alert.dismissed) return true;
    // 只保留 1 小时内的已 dismiss alerts
    return now - alert.timestamp < ALERT_RETENTION_MS;
  });
};

// 默认设置
const defaultSettings: VoiceSettings = {
  speechRate: 1.0,
  soundEnabled: true,
  vibrationEnabled: true,
};

// 初始状态
const initialState = {
  status: 'idle' as VoiceStatus,
  isListening: false,
  isSpeaking: false,
  isSupported: false,
  hasPermission: false,
  transcript: '',
  interimTranscript: '',
  response: '',
  alerts: [] as VoiceAlert[],
  lastError: null as VoiceError | null,
  language: 'zh' as SupportedLanguage,
  settings: defaultSettings,
};

export const useVoiceStore = create<VoiceStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setStatus: (status) => {
        set({ status }, false, 'setStatus');
      },

      setListening: (isListening) => {
        set(
          {
            isListening,
            status: isListening ? 'listening' : get().isSpeaking ? 'speaking' : 'idle',
          },
          false,
          'setListening'
        );
      },

      setSpeaking: (isSpeaking) => {
        set(
          {
            isSpeaking,
            status: isSpeaking ? 'speaking' : get().isListening ? 'listening' : 'idle',
          },
          false,
          'setSpeaking'
        );
      },

      setSupported: (isSupported) => {
        set({ isSupported }, false, 'setSupported');
      },

      setPermission: (hasPermission) => {
        set({ hasPermission }, false, 'setPermission');
      },

      setTranscript: (transcript) => {
        set({ transcript, interimTranscript: '' }, false, 'setTranscript');
      },

      setInterimTranscript: (interimTranscript) => {
        set({ interimTranscript }, false, 'setInterimTranscript');
      },

      setResponse: (response) => {
        set({ response }, false, 'setResponse');
      },

      setLanguage: (language) => {
        set({ language }, false, 'setLanguage');
      },

      addAlert: (alertData) => {
        const alert: VoiceAlert = {
          ...alertData,
          id: generateId(),
          timestamp: Date.now(),
          dismissed: false,
        };

        set(
          (state) => {
            // 先清理过期的 alerts
            const cleanedAlerts = cleanupOldAlerts(state.alerts);

            // 检查是否已存在相同仓位的预警
            const existingIndex = cleanedAlerts.findIndex(
              (a) => a.positionId === alert.positionId && !a.dismissed
            );

            if (existingIndex >= 0) {
              // 更新现有预警
              const newAlerts = [...cleanedAlerts];
              newAlerts[existingIndex] = alert;
              return { alerts: newAlerts };
            }

            // 添加新预警
            return { alerts: [...cleanedAlerts, alert] };
          },
          false,
          'addAlert'
        );
      },

      dismissAlert: (id) => {
        set(
          (state) => ({
            alerts: state.alerts.map((a) =>
              a.id === id ? { ...a, dismissed: true } : a
            ),
          }),
          false,
          'dismissAlert'
        );
      },

      clearAlerts: () => {
        set({ alerts: [] }, false, 'clearAlerts');
      },

      // 手动清理过期的已 dismiss alerts
      cleanupAlerts: () => {
        set(
          (state) => ({
            alerts: cleanupOldAlerts(state.alerts),
          }),
          false,
          'cleanupAlerts'
        );
      },

      setError: (lastError) => {
        set(
          {
            lastError,
            status: lastError ? 'error' : get().status,
          },
          false,
          'setError'
        );
      },

      updateSettings: (newSettings) => {
        set(
          (state) => ({
            settings: { ...state.settings, ...newSettings },
          }),
          false,
          'updateSettings'
        );
      },

      reset: () => {
        set(
          {
            ...initialState,
            isSupported: get().isSupported,
            hasPermission: get().hasPermission,
          },
          false,
          'reset'
        );
      },
    }),
    {
      name: 'VoiceStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// 选择器 hooks
export const useVoiceStatus = () => useVoiceStore((state) => state.status);
export const useVoiceListening = () => useVoiceStore((state) => state.isListening);
export const useVoiceSpeaking = () => useVoiceStore((state) => state.isSpeaking);
export const useVoiceTranscript = () => useVoiceStore((state) => state.transcript);
export const useVoiceInterimTranscript = () => useVoiceStore((state) => state.interimTranscript);
export const useVoiceResponse = () => useVoiceStore((state) => state.response);
export const useVoiceAlerts = () => useVoiceStore((state) => state.alerts.filter((a) => !a.dismissed));
export const useVoiceError = () => useVoiceStore((state) => state.lastError);
export const useVoiceLanguage = () => useVoiceStore((state) => state.language);
export const useVoiceSupported = () => useVoiceStore((state) => state.isSupported);
export const useVoicePermission = () => useVoiceStore((state) => state.hasPermission);
export const useVoiceSettings = () => useVoiceStore((state) => state.settings);
