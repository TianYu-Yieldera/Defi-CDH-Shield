// VoiceWaveform - 语音波形动画组件

'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface VoiceWaveformProps {
  isActive?: boolean;
  color?: string;
  barCount?: number;
  className?: string;
}

export function VoiceWaveform({
  isActive = true,
  color = 'bg-blue-500',
  barCount = 5,
  className,
}: VoiceWaveformProps) {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1 h-8',
        className
      )}
    >
      {bars.map((index) => (
        <div
          key={index}
          className={cn(
            'w-1 rounded-full transition-all duration-150',
            color,
            isActive ? 'animate-wave' : 'h-2'
          )}
          style={{
            animationDelay: `${index * 0.1}s`,
            height: isActive ? undefined : '8px',
          }}
        />
      ))}

      <style jsx>{`
        @keyframes wave {
          0%, 100% {
            height: 8px;
          }
          50% {
            height: 24px;
          }
        }
        .animate-wave {
          animation: wave 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// 圆形波形动画
export function VoiceWaveformCircle({
  isActive = true,
  size = 'md',
  className,
}: {
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      {/* 背景圆 */}
      <div className="absolute inset-0 bg-blue-100 rounded-full" />

      {/* 波纹动画 */}
      {isActive && (
        <>
          <div className="absolute inset-0 bg-blue-300 rounded-full animate-ping opacity-30" />
          <div
            className="absolute inset-2 bg-blue-400 rounded-full animate-ping opacity-40"
            style={{ animationDelay: '0.2s' }}
          />
          <div
            className="absolute inset-4 bg-blue-500 rounded-full animate-ping opacity-50"
            style={{ animationDelay: '0.4s' }}
          />
        </>
      )}

      {/* 中心圆 */}
      <div
        className={cn(
          'absolute inset-0 m-auto w-1/2 h-1/2 rounded-full',
          isActive ? 'bg-blue-600' : 'bg-blue-400'
        )}
      />
    </div>
  );
}

// 频谱波形动画 (更复杂的效果)
export function VoiceSpectrum({
  isActive = true,
  barCount = 12,
  className,
}: {
  isActive?: boolean;
  barCount?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / barCount - 2;

    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < barCount; i++) {
        const barHeight = isActive
          ? Math.random() * (height - 10) + 10
          : 10;

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // 渐变色
        const gradient = ctx.createLinearGradient(x, y, x, height);
        gradient.addColorStop(0, '#3B82F6');
        gradient.addColorStop(1, '#1D4ED8');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={60}
      className={cn('rounded-lg', className)}
    />
  );
}
