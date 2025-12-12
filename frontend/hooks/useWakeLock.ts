// useWakeLock - 屏幕常亮 Hook
// 使用 Screen Wake Lock API 防止屏幕休眠
// 对于 DeFi 监控场景非常重要

import { useCallback, useEffect, useRef, useState } from 'react';

interface WakeLockSentinel {
  release: () => Promise<void>;
  released: boolean;
  type: 'screen';
  addEventListener: (type: string, callback: () => void) => void;
  removeEventListener: (type: string, callback: () => void) => void;
}

interface UseWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  request: () => Promise<boolean>;
  release: () => Promise<void>;
  toggle: () => Promise<boolean>;
}

export function useWakeLock(): UseWakeLockReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // 检测 Wake Lock API 支持
  useEffect(() => {
    const supported =
      typeof navigator !== 'undefined' &&
      'wakeLock' in navigator &&
      typeof (navigator as any).wakeLock?.request === 'function';
    setIsSupported(supported);
  }, []);

  // 处理页面可见性变化 - 重新请求 wake lock
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && wakeLockRef.current?.released) {
        // 页面重新可见且 wake lock 已释放，尝试重新获取
        try {
          const sentinel = await (navigator as any).wakeLock.request('screen');
          wakeLockRef.current = sentinel;
          setIsActive(true);

          sentinel.addEventListener('release', () => {
            setIsActive(false);
          });
        } catch (error) {
          console.warn('Failed to re-acquire wake lock:', error);
          setIsActive(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        wakeLockRef.current.release().catch(console.warn);
      }
    };
  }, []);

  // 请求屏幕常亮
  const request = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Wake Lock API is not supported');
      return false;
    }

    // 如果已经激活，直接返回
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      return true;
    }

    try {
      const sentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockRef.current = sentinel;
      setIsActive(true);

      // 监听释放事件
      sentinel.addEventListener('release', () => {
        setIsActive(false);
        wakeLockRef.current = null;
      });

      return true;
    } catch (error) {
      console.warn('Wake Lock request failed:', error);
      setIsActive(false);
      return false;
    }
  }, [isSupported]);

  // 释放屏幕常亮
  const release = useCallback(async (): Promise<void> => {
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
      } catch (error) {
        console.warn('Wake Lock release failed:', error);
      }
    }
  }, []);

  // 切换状态
  const toggle = useCallback(async (): Promise<boolean> => {
    if (isActive) {
      await release();
      return false;
    } else {
      return await request();
    }
  }, [isActive, request, release]);

  return {
    isSupported,
    isActive,
    request,
    release,
    toggle,
  };
}

// 便捷函数 - 检查是否支持
export function isWakeLockSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'wakeLock' in navigator &&
    typeof (navigator as any).wakeLock?.request === 'function'
  );
}
