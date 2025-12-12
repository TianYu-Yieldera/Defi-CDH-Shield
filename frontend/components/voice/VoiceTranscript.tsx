// VoiceTranscript - 实时转写显示组件

'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useVoice } from '@/hooks/useVoice';

interface VoiceTranscriptProps {
  className?: string;
  showResponse?: boolean;
  maxHeight?: string;
}

export function VoiceTranscript({
  className,
  showResponse = true,
  maxHeight = '200px',
}: VoiceTranscriptProps) {
  const { transcript, interimTranscript, response, isListening, isSpeaking } = useVoice();
  const containerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript, response]);

  const hasContent = transcript || interimTranscript || response;

  if (!hasContent && !isListening && !isSpeaking) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-800 p-4',
        className
      )}
      style={{ maxHeight }}
    >
      {/* 用户输入 */}
      {(transcript || interimTranscript) && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500">您说</span>
            {isListening && (
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </div>
          <p className="text-gray-900 dark:text-gray-100">
            {transcript}
            {interimTranscript && (
              <span className="text-gray-400 italic">{interimTranscript}</span>
            )}
          </p>
        </div>
      )}

      {/* AI 响应 */}
      {showResponse && response && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-blue-500">CDP Shield</span>
            {isSpeaking && (
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
            )}
          </div>
          <p className="text-gray-700 dark:text-gray-300">{response}</p>
        </div>
      )}

      {/* 等待状态 */}
      {isListening && !transcript && !interimTranscript && (
        <div className="flex items-center gap-2 text-gray-400">
          <span className="animate-pulse">正在聆听</span>
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      )}
    </div>
  );
}

// 简化版 - 只显示最新的转写
export function VoiceTranscriptBubble({ className }: { className?: string }) {
  const { transcript, interimTranscript, isListening } = useVoice();

  if (!transcript && !interimTranscript && !isListening) {
    return null;
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-2xl shadow-lg px-4 py-3',
        'border border-gray-100 dark:border-gray-700',
        'animate-fade-in',
        className
      )}
    >
      <p className="text-gray-900 dark:text-gray-100">
        {transcript || interimTranscript || (
          <span className="text-gray-400 animate-pulse">正在聆听...</span>
        )}
      </p>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
