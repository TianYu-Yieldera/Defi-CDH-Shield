// VoiceButton - 语音按钮组件

'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { useVoice, useVoiceAlertsBadge } from '@/hooks/useVoice';
import { cn } from '@/lib/utils';

interface VoiceButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export function VoiceButton({
  className,
  size = 'lg',
  showBadge = true,
}: VoiceButtonProps) {
  const {
    isReady,
    isListening,
    isSpeaking,
    isSupported,
    hasPermission,
    status,
    toggleListening,
    stopSpeaking,
  } = useVoice();

  const { total: alertCount, hasCritical } = useVoiceAlertsBadge();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // 浏览器不支持
  if (!isSupported) {
    return (
      <button
        disabled
        className={cn(
          'fixed bottom-6 right-6 rounded-full shadow-lg z-50',
          'bg-gray-400 cursor-not-allowed',
          getSizeClasses(size),
          className
        )}
        title="您的浏览器不支持语音功能"
      >
        <MicOff className={getIconSize(size)} />
      </button>
    );
  }

  const handleClick = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      toggleListening();
    }
  };

  const getButtonState = () => {
    if (isListening) return 'listening';
    if (isSpeaking) return 'speaking';
    if (status === 'processing') return 'processing';
    return 'idle';
  };

  const buttonState = getButtonState();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 预警徽章 */}
      {showBadge && alertCount > 0 && (
        <div
          className={cn(
            'absolute -top-2 -right-2 min-w-[24px] h-6 px-2',
            'flex items-center justify-center',
            'text-xs font-bold text-white rounded-full',
            'animate-pulse',
            hasCritical ? 'bg-red-500' : 'bg-orange-500'
          )}
        >
          {alertCount}
        </div>
      )}

      {/* 主按钮 */}
      <button
        onClick={handleClick}
        disabled={!isReady && !isSupported}
        className={cn(
          'rounded-full shadow-lg transition-all duration-200',
          'flex items-center justify-center',
          'focus:outline-none focus:ring-4',
          getSizeClasses(size),
          getButtonStyles(buttonState),
          !isReady && 'opacity-50',
          className
        )}
        title={getButtonTitle(buttonState, hasPermission)}
      >
        {buttonState === 'listening' && (
          <>
            <Mic className={cn(getIconSize(size), 'text-white')} />
            {/* 波纹动画 */}
            <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-40" />
          </>
        )}
        {buttonState === 'speaking' && (
          <Volume2 className={cn(getIconSize(size), 'text-white animate-pulse')} />
        )}
        {buttonState === 'processing' && (
          <Loader2 className={cn(getIconSize(size), 'text-white animate-spin')} />
        )}
        {buttonState === 'idle' && (
          <Mic className={cn(getIconSize(size), 'text-white')} />
        )}
      </button>

      {/* 状态文字提示 */}
      {isListening && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full">
            正在聆听...
          </span>
        </div>
      )}
    </div>
  );
}

// 获取按钮尺寸类
function getSizeClasses(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'w-12 h-12';
    case 'md':
      return 'w-14 h-14';
    case 'lg':
      return 'w-16 h-16';
  }
}

// 获取图标尺寸类
function getIconSize(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'w-5 h-5';
    case 'md':
      return 'w-6 h-6';
    case 'lg':
      return 'w-7 h-7';
  }
}

// 获取按钮样式
function getButtonStyles(state: 'idle' | 'listening' | 'speaking' | 'processing'): string {
  switch (state) {
    case 'listening':
      return 'bg-red-500 hover:bg-red-600 focus:ring-red-300';
    case 'speaking':
      return 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-300';
    case 'processing':
      return 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-300';
    case 'idle':
    default:
      return 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-300';
  }
}

// 获取按钮提示文字
function getButtonTitle(
  state: 'idle' | 'listening' | 'speaking' | 'processing',
  hasPermission: boolean
): string {
  if (!hasPermission) {
    return '点击授予麦克风权限';
  }
  switch (state) {
    case 'listening':
      return '点击停止语音输入';
    case 'speaking':
      return '点击停止语音播报';
    case 'processing':
      return '正在处理...';
    case 'idle':
    default:
      return '点击开始语音输入';
  }
}
