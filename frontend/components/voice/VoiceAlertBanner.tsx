// VoiceAlertBanner - 预警横幅组件

'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X, ChevronRight } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { cn } from '@/lib/utils';
import type { VoiceAlert, AlertLevel } from '@/services/voice/types';
import { Button } from '@/components/ui/button';

interface VoiceAlertBannerProps {
  className?: string;
  maxAlerts?: number;
}

export function VoiceAlertBanner({
  className,
  maxAlerts = 3,
}: VoiceAlertBannerProps) {
  const { alerts, dismissAlert } = useVoice();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || alerts.length === 0) return null;

  // 只显示最近的几条预警
  const visibleAlerts = alerts.slice(0, maxAlerts);

  return (
    <div
      className={cn(
        'fixed top-20 left-1/2 -translate-x-1/2 z-50',
        'w-full max-w-2xl px-4',
        'flex flex-col gap-2',
        className
      )}
    >
      {visibleAlerts.map((alert) => (
        <AlertItem
          key={alert.id}
          alert={alert}
          onDismiss={() => dismissAlert(alert.id)}
        />
      ))}
    </div>
  );
}

// 单个预警项
function AlertItem({
  alert,
  onDismiss,
}: {
  alert: VoiceAlert;
  onDismiss: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 入场动画
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 200);
  };

  const levelConfig = getAlertLevelConfig(alert.level);

  return (
    <div
      className={cn(
        'rounded-lg shadow-lg overflow-hidden',
        'transform transition-all duration-200',
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
        levelConfig.containerClass
      )}
    >
      <div className="p-4 flex items-start gap-3">
        {/* 图标 */}
        <div className={cn('flex-shrink-0 p-2 rounded-full', levelConfig.iconBgClass)}>
          <AlertTriangle className={cn('w-5 h-5', levelConfig.iconClass)} />
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-sm font-semibold', levelConfig.titleClass)}>
              {levelConfig.icon} {levelConfig.title}
            </span>
            <span className={cn('text-xs', levelConfig.protocolClass)}>
              {alert.protocol}
            </span>
          </div>
          <p className={cn('text-sm', levelConfig.messageClass)}>
            {alert.message}
          </p>

          {/* 操作按钮 */}
          {alert.level === 'critical' && (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                立即处理
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={handleDismiss}
          className={cn(
            'flex-shrink-0 p-1 rounded-full',
            'hover:bg-white/20 transition-colors',
            levelConfig.closeClass
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 进度条动画 (critical 级别自动消失) */}
      {alert.level !== 'critical' && (
        <div className="h-1 bg-black/10">
          <div
            className={cn('h-full', levelConfig.progressClass)}
            style={{
              animation: 'shrink 10s linear forwards',
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

// 获取预警级别配置
function getAlertLevelConfig(level: AlertLevel) {
  switch (level) {
    case 'critical':
      return {
        icon: '',
        title: 'Critical Alert',
        containerClass: 'bg-red-500',
        iconBgClass: 'bg-red-600',
        iconClass: 'text-white',
        titleClass: 'text-white',
        protocolClass: 'text-red-100',
        messageClass: 'text-red-50',
        closeClass: 'text-red-100',
        progressClass: 'bg-red-300',
      };
    case 'warning':
      return {
        icon: '',
        title: 'Risk Warning',
        containerClass: 'bg-orange-500',
        iconBgClass: 'bg-orange-600',
        iconClass: 'text-white',
        titleClass: 'text-white',
        protocolClass: 'text-orange-100',
        messageClass: 'text-orange-50',
        closeClass: 'text-orange-100',
        progressClass: 'bg-orange-300',
      };
    case 'caution':
    default:
      return {
        icon: '',
        title: 'Caution',
        containerClass: 'bg-yellow-400',
        iconBgClass: 'bg-yellow-500',
        iconClass: 'text-yellow-900',
        titleClass: 'text-yellow-900',
        protocolClass: 'text-yellow-800',
        messageClass: 'text-yellow-900',
        closeClass: 'text-yellow-800',
        progressClass: 'bg-yellow-600',
      };
  }
}

// 预警汇总徽章
export function VoiceAlertBadge({ className }: { className?: string }) {
  const { alerts } = useVoice();
  const criticalCount = alerts.filter((a) => a.level === 'critical').length;
  const warningCount = alerts.filter((a) => a.level === 'warning').length;
  const total = alerts.length;

  if (total === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-gray-100 dark:bg-gray-800',
        className
      )}
    >
      {criticalCount > 0 && (
        <span className="flex items-center gap-1 text-red-500 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {criticalCount}
        </span>
      )}
      {warningCount > 0 && (
        <span className="flex items-center gap-1 text-orange-500 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          {warningCount}
        </span>
      )}
      {criticalCount === 0 && warningCount === 0 && (
        <span className="text-gray-500 text-sm">{total} 条提醒</span>
      )}
    </div>
  );
}
