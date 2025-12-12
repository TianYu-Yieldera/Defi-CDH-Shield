// VoiceProvider - 全局语音功能提供者

'use client';

import { useEffect, useState } from 'react';
import { VoiceButton } from './VoiceButton';
import { VoiceAlertBanner } from './VoiceAlertBanner';
import { VoiceAssistant } from './VoiceAssistant';

interface VoiceProviderProps {
  children?: React.ReactNode;
  showButton?: boolean;
  showAlerts?: boolean;
  buttonSize?: 'sm' | 'md' | 'lg';
}

export function VoiceProvider({
  children,
  showButton = true,
  showAlerts = true,
  buttonSize = 'lg',
}: VoiceProviderProps) {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {children}

      {/* 预警横幅 */}
      {showAlerts && <VoiceAlertBanner />}

      {/* 语音助手面板 */}
      <VoiceAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

      {/* 语音按钮 */}
      {showButton && (
        <VoiceButton
          size={buttonSize}
          showBadge={true}
        />
      )}
    </>
  );
}
