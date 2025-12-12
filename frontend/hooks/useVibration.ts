// useVibration - 移动端震动反馈 Hook
// 提供触觉反馈支持，增强移动端用户体验

import { useCallback, useEffect, useState } from 'react';
import { VIBRATION_PATTERNS } from '@/lib/voice/constants';

interface VibrationOptions {
  enabled?: boolean;
}

interface UseVibrationReturn {
  isSupported: boolean;
  vibrate: (pattern: number | number[]) => boolean;
  vibratePattern: (type: 'critical' | 'warning' | 'notification' | 'success' | 'click') => boolean;
  cancel: () => void;
}

// 额外的震动模式
const EXTRA_PATTERNS = {
  success: [50, 50, 100],
  click: [10],
};

export function useVibration(options: VibrationOptions = {}): UseVibrationReturn {
  const { enabled = true } = options;
  const [isSupported, setIsSupported] = useState(false);

  // 检测震动 API 支持
  useEffect(() => {
    const supported =
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator &&
      typeof navigator.vibrate === 'function';
    setIsSupported(supported);
  }, []);

  // 基础震动方法
  const vibrate = useCallback(
    (pattern: number | number[]): boolean => {
      if (!enabled || !isSupported) return false;

      try {
        return navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Vibration failed:', error);
        return false;
      }
    },
    [enabled, isSupported]
  );

  // 预设模式震动
  const vibratePattern = useCallback(
    (type: 'critical' | 'warning' | 'notification' | 'success' | 'click'): boolean => {
      if (!enabled || !isSupported) return false;

      const allPatterns = { ...VIBRATION_PATTERNS, ...EXTRA_PATTERNS };
      const pattern = allPatterns[type];

      if (!pattern) {
        console.warn(`Unknown vibration pattern: ${type}`);
        return false;
      }

      try {
        return navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Vibration pattern failed:', error);
        return false;
      }
    },
    [enabled, isSupported]
  );

  // 取消震动
  const cancel = useCallback(() => {
    if (!isSupported) return;

    try {
      navigator.vibrate(0);
    } catch (error) {
      console.warn('Vibration cancel failed:', error);
    }
  }, [isSupported]);

  return {
    isSupported,
    vibrate,
    vibratePattern,
    cancel,
  };
}

// 便捷函数 - 直接触发震动
export function triggerVibration(
  type: 'critical' | 'warning' | 'notification' | 'success' | 'click'
): boolean {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return false;
  }

  const allPatterns = { ...VIBRATION_PATTERNS, ...EXTRA_PATTERNS };
  const pattern = allPatterns[type];

  if (!pattern) return false;

  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}
