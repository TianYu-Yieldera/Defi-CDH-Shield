// VoiceAssistant - 语音助手主面板组件

'use client';

import { useState, useEffect } from 'react';
import { X, Mic, Volume2, Settings, HelpCircle, Globe, VolumeX, Smartphone } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { getVoiceService } from '@/services/voice/VoiceService';
import { VoiceWaveform } from './VoiceWaveform';
import { VoiceTranscript } from './VoiceTranscript';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { QUICK_COMMANDS } from '@/lib/voice/commands';
import { useVoiceStore } from '@/store/voiceStore';
import type { SupportedLanguage } from '@/services/voice/types';

interface VoiceAssistantProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function VoiceAssistant({
  className,
  isOpen = false,
  onClose,
}: VoiceAssistantProps) {
  const {
    isReady,
    isListening,
    isSpeaking,
    isSupported,
    hasPermission,
    status,
    error,
    toggleListening,
    speak,
    stopSpeaking,
  } = useVoice();

  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const setResponse = useVoiceStore((state) => state.setResponse);
  const setTranscript = useVoiceStore((state) => state.setTranscript);
  const language = useVoiceStore((state) => state.language);
  const setLanguage = useVoiceStore((state) => state.setLanguage);
  const settings = useVoiceStore((state) => state.settings);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  // 切换语言
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
  };

  // 更新设置
  const handleSettingsChange = (newSettings: Partial<typeof settings>) => {
    const voiceService = getVoiceService();
    voiceService.updateSettings(newSettings);
  };

  // 处理快捷命令点击 - 模拟语音输入并处理
  const handleQuickCommand = async (command: typeof QUICK_COMMANDS[number]) => {
    const voiceService = getVoiceService();
    // 复用 VoiceService 中的实例，避免重复创建
    const commandProcessor = voiceService.getCommandProcessor();
    const responseGenerator = voiceService.getResponseGenerator();

    try {
      // 设置显示文本
      setTranscript(command.labelZh);

      // 处理命令
      const result = commandProcessor.process(command.labelZh);
      const response = responseGenerator.generate(result);

      // 设置响应文本
      setResponse(response);

      // 语音播报响应
      await voiceService.speak(response, 'zh');
    } catch (err) {
      console.error('Quick command error:', err);
      useVoiceStore.getState().setError({
        code: 'command_error',
        message: language === 'zh' ? '命令处理失败，请重试' : 'Command processing failed, please try again',
      });
    }
  };

  return (
    <Card
      className={cn(
        'fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)]',
        'shadow-2xl z-50 overflow-hidden',
        'animate-slide-up',
        className
      )}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              isListening ? 'bg-red-400 animate-pulse' :
              isSpeaking ? 'bg-green-400 animate-pulse' :
              isReady ? 'bg-green-400' : 'bg-gray-400'
            )}
          />
          <h3 className="font-semibold text-white">语音助手</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors",
              showSettings && "bg-white/20"
            )}
            title="设置"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="p-4 space-y-4">
        {/* 设置面板 */}
        {showSettings && (
          <div className="space-y-4 pb-4 border-b">
            {/* 语言选择 */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Globe className="w-3 h-3" />
                语言 / Language
              </Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={language === 'zh' ? 'default' : 'outline'}
                  onClick={() => handleLanguageChange('zh')}
                  className="flex-1"
                >
                  中文
                </Button>
                <Button
                  size="sm"
                  variant={language === 'en' ? 'default' : 'outline'}
                  onClick={() => handleLanguageChange('en')}
                  className="flex-1"
                >
                  English
                </Button>
              </div>
            </div>

            {/* 语速控制 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  语速 / Speech Rate
                </Label>
                <span className="text-xs font-mono">{settings.speechRate.toFixed(1)}x</span>
              </div>
              <Slider
                value={[settings.speechRate]}
                min={0.5}
                max={2.0}
                step={0.1}
                onValueChange={([value]) => handleSettingsChange({ speechRate: value })}
              />
            </div>

            {/* 音效开关 */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <VolumeX className="w-3 h-3" />
                警报音效
              </Label>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => handleSettingsChange({ soundEnabled: checked })}
              />
            </div>

            {/* 震动开关 */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                震动反馈
              </Label>
              <Switch
                checked={settings.vibrationEnabled}
                onCheckedChange={(checked) => handleSettingsChange({ vibrationEnabled: checked })}
              />
            </div>
          </div>
        )}

        {/* 状态显示 */}
        {!isSupported && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            您的浏览器不支持语音功能。请使用 Chrome 或 Edge 浏览器。
          </div>
        )}

        {isSupported && !hasPermission && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            请点击麦克风按钮授予麦克风权限以使用语音功能。
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            {error.message}
          </div>
        )}

        {/* 波形动画 */}
        {isListening && (
          <div className="flex justify-center py-4">
            <VoiceWaveform isActive={isListening} barCount={7} />
          </div>
        )}

        {/* 转写内容 */}
        <VoiceTranscript maxHeight="150px" />

        {/* 快捷命令 */}
        {!isListening && !isSpeaking && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <HelpCircle className="w-3 h-3" />
              <span>快捷命令</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_COMMANDS.map((command) => (
                <button
                  key={command.id}
                  onClick={() => handleQuickCommand(command)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm',
                    'bg-gray-100 hover:bg-gray-200',
                    'dark:bg-gray-700 dark:hover:bg-gray-600',
                    'transition-colors'
                  )}
                >
                  {command.icon} {command.labelZh}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="p-4 border-t bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-center gap-4">
          {/* 主麦克风按钮 */}
          <button
            onClick={toggleListening}
            disabled={!isReady}
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center',
              'transition-all duration-200 shadow-lg',
              isListening
                ? 'bg-red-500 hover:bg-red-600 scale-110'
                : 'bg-blue-500 hover:bg-blue-600',
              !isReady && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Mic className={cn(
              'w-6 h-6 text-white',
              isListening && 'animate-pulse'
            )} />
          </button>

          {/* 停止播放按钮 */}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
            >
              <Volume2 className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* 状态文字 */}
        <p className="text-center text-xs text-gray-500 mt-3">
          {isListening ? '正在聆听...' :
           isSpeaking ? '正在播报...' :
           status === 'processing' ? '正在处理...' :
           '点击麦克风开始语音输入'}
        </p>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </Card>
  );
}

// 简化版语音助手 (嵌入式)
export function VoiceAssistantInline({ className }: { className?: string }) {
  const { isListening, isSpeaking, toggleListening, isReady } = useVoice();

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          语音助手
        </h3>
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            isReady ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      </div>

      <VoiceTranscript maxHeight="120px" className="mb-4" />

      <Button
        onClick={toggleListening}
        disabled={!isReady}
        className={cn(
          'w-full',
          isListening && 'bg-red-500 hover:bg-red-600'
        )}
      >
        <Mic className={cn('w-4 h-4 mr-2', isListening && 'animate-pulse')} />
        {isListening ? '停止' : '开始语音'}
      </Button>
    </div>
  );
}
