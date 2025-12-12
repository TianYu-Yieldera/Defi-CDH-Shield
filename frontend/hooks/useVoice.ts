// useVoice Hook - 语音功能 React Hook

'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  useVoiceStore,
  useVoiceStatus,
  useVoiceListening,
  useVoiceSpeaking,
  useVoiceTranscript,
  useVoiceInterimTranscript,
  useVoiceResponse,
  useVoiceAlerts,
  useVoiceError,
  useVoiceSupported,
  useVoicePermission,
} from '@/store/voiceStore';
import { getVoiceService } from '@/services/voice/VoiceService';
import { getAlertMonitor } from '@/services/voice/AlertMonitor';
import type { SupportedLanguage } from '@/services/voice/types';

export function useVoice() {
  const [isReady, setIsReady] = useState(false);

  const status = useVoiceStatus();
  const isListening = useVoiceListening();
  const isSpeaking = useVoiceSpeaking();
  const transcript = useVoiceTranscript();
  const interimTranscript = useVoiceInterimTranscript();
  const response = useVoiceResponse();
  const alerts = useVoiceAlerts();
  const error = useVoiceError();
  const isSupported = useVoiceSupported();
  const hasPermission = useVoicePermission();
  const { dismissAlert, clearAlerts, setLanguage, reset } = useVoiceStore();

  // 初始化语音服务
  useEffect(() => {
    const initVoice = async () => {
      const voiceService = getVoiceService();
      const initialized = await voiceService.initialize();
      setIsReady(initialized);

      if (initialized) {
        // 启动预警监控
        const alertMonitor = getAlertMonitor();
        alertMonitor.start();
      }
    };

    initVoice();

    return () => {
      // 清理
      const alertMonitor = getAlertMonitor();
      alertMonitor.stop();
    };
  }, []);

  // 开始/停止语音识别
  const toggleListening = useCallback(async () => {
    const voiceService = getVoiceService();

    if (isListening) {
      voiceService.stopListening();
    } else {
      await voiceService.startListening();
    }
  }, [isListening]);

  // 开始语音识别
  const startListening = useCallback(async () => {
    const voiceService = getVoiceService();
    await voiceService.startListening();
  }, []);

  // 停止语音识别
  const stopListening = useCallback(() => {
    const voiceService = getVoiceService();
    voiceService.stopListening();
  }, []);

  // 语音播报
  const speak = useCallback(async (text: string, language?: SupportedLanguage) => {
    const voiceService = getVoiceService();
    await voiceService.speak(text, language);
  }, []);

  // 停止语音播报
  const stopSpeaking = useCallback(() => {
    const voiceService = getVoiceService();
    voiceService.stopSpeaking();
  }, []);

  // 切换语言
  const changeLanguage = useCallback((language: SupportedLanguage) => {
    setLanguage(language);
    const alertMonitor = getAlertMonitor();
    alertMonitor.setLanguage(language);
  }, [setLanguage]);

  // 关闭预警
  const handleDismissAlert = useCallback((alertId: string) => {
    dismissAlert(alertId);
  }, [dismissAlert]);

  // 清除所有预警
  const handleClearAlerts = useCallback(() => {
    clearAlerts();
  }, [clearAlerts]);

  // 重置语音状态
  const handleReset = useCallback(() => {
    const voiceService = getVoiceService();
    voiceService.stopListening();
    voiceService.stopSpeaking();
    reset();
  }, [reset]);

  // 手动触发预警检查 (演示模式)
  const forceAlertCheck = useCallback(() => {
    const alertMonitor = getAlertMonitor();
    alertMonitor.forceCheck();
  }, []);

  // 模拟健康因子下降 (演示模式)
  const simulateRisk = useCallback(async (positionId: string, healthFactor: number) => {
    const alertMonitor = getAlertMonitor();
    await alertMonitor.simulateHealthFactorDrop(positionId, healthFactor);
  }, []);

  return {
    // 状态
    status,
    isReady,
    isListening,
    isSpeaking,
    isSupported,
    hasPermission,
    transcript,
    interimTranscript,
    response,
    alerts,
    error,

    // 操作
    toggleListening,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    changeLanguage,
    dismissAlert: handleDismissAlert,
    clearAlerts: handleClearAlerts,
    reset: handleReset,

    // 演示模式
    forceAlertCheck,
    simulateRisk,
  };
}

// 简化版 Hook - 只用于显示状态
export function useVoiceState() {
  return {
    status: useVoiceStatus(),
    isListening: useVoiceListening(),
    isSpeaking: useVoiceSpeaking(),
    transcript: useVoiceTranscript(),
    response: useVoiceResponse(),
    alerts: useVoiceAlerts(),
    error: useVoiceError(),
  };
}

// 预警专用 Hook
export function useVoiceAlertsBadge() {
  const alerts = useVoiceAlerts();
  const criticalCount = alerts.filter(a => a.level === 'critical').length;
  const warningCount = alerts.filter(a => a.level === 'warning').length;

  return {
    total: alerts.length,
    critical: criticalCount,
    warning: warningCount,
    hasCritical: criticalCount > 0,
    hasWarning: warningCount > 0,
  };
}
