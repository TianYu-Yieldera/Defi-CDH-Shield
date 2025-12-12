// DemoScenarioRunner - 预设演示场景运行器
// 提供完整的演示流程，包括语音播报和视觉效果

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from 'lucide-react';
import { getVoiceService } from '@/services/voice/VoiceService';
import { playSound } from '@/services/voice/SoundGenerator';
import { triggerVibration } from '@/hooks/useVibration';
import { useCDPStore } from '@/store/cdpStore';

// 演示步骤类型
interface DemoStep {
  id: string;
  title: string;
  titleCN: string;
  description: string;
  descriptionCN: string;
  voiceEN?: string;
  voiceCN?: string;
  action?: () => void | Promise<void>;
  duration: number; // 毫秒
  highlight?: string; // 高亮的 UI 元素选择器
}

// 预设场景类型
interface DemoScenario {
  id: string;
  name: string;
  nameCN: string;
  description: string;
  steps: DemoStep[];
}

// 预设演示场景
const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'full-demo',
    name: 'Complete Demo',
    nameCN: '完整演示',
    description: 'Full demonstration of CDPShield features',
    steps: [
      {
        id: 'intro',
        title: 'Introduction',
        titleCN: '介绍',
        description: 'Welcome to CDPShield',
        descriptionCN: '欢迎使用 CDPShield',
        voiceEN: 'Welcome to CDP Shield, your AI-powered DeFi position monitor. I will help you protect your collateralized debt positions.',
        voiceCN: '欢迎使用 CDP Shield，您的 AI 智能 DeFi 仓位监控助手。我将帮助您保护您的抵押债务仓位。',
        duration: 6000,
      },
      {
        id: 'show-position',
        title: 'View Position',
        titleCN: '查看仓位',
        description: 'Displaying current CDP position',
        descriptionCN: '显示当前 CDP 仓位',
        voiceEN: 'Here is your current position. You have 10 ETH as collateral, worth about 35,000 dollars, with a health factor of 1.8.',
        voiceCN: '这是您当前的仓位。您有 10 个 ETH 作为抵押品，价值约 35000 美元，健康因子为 1.8。',
        duration: 8000,
        highlight: '.cdp-position-card',
      },
      {
        id: 'price-drop',
        title: 'Price Alert',
        titleCN: '价格警报',
        description: 'Simulating market volatility',
        descriptionCN: '模拟市场波动',
        voiceEN: 'Alert! ETH price is dropping. Your health factor is now at 1.4. Consider adding more collateral.',
        voiceCN: '警告！ETH 价格正在下跌。您的健康因子现在是 1.4。建议增加抵押品。',
        duration: 6000,
        action: async () => {
          playSound.warning();
          triggerVibration('warning');
        },
      },
      {
        id: 'critical-alert',
        title: 'Critical Alert',
        titleCN: '紧急警报',
        description: 'Health factor approaching liquidation',
        descriptionCN: '健康因子接近清算线',
        voiceEN: 'Critical alert! Your health factor has dropped to 1.15. Liquidation risk is high! Take immediate action!',
        voiceCN: '紧急警报！您的健康因子已降至 1.15。清算风险很高！请立即采取行动！',
        duration: 7000,
        action: async () => {
          playSound.critical();
          triggerVibration('critical');
        },
      },
      {
        id: 'voice-command',
        title: 'Voice Command',
        titleCN: '语音命令',
        description: 'Demonstrate voice interaction',
        descriptionCN: '演示语音交互',
        voiceEN: 'You can ask me questions anytime. Try saying: What is my health factor? or Help me add collateral.',
        voiceCN: '您可以随时问我问题。试着说：我的健康因子是多少？或者：帮我增加抵押品。',
        duration: 8000,
      },
      {
        id: 'recovery',
        title: 'Position Recovered',
        titleCN: '仓位恢复',
        description: 'Collateral added, position is safe',
        descriptionCN: '已添加抵押品，仓位安全',
        voiceEN: 'Excellent! Collateral has been added. Your health factor is now 1.9. Your position is safe.',
        voiceCN: '太好了！已添加抵押品。您的健康因子现在是 1.9。您的仓位是安全的。',
        duration: 6000,
        action: async () => {
          playSound.success();
          triggerVibration('success');
        },
      },
      {
        id: 'conclusion',
        title: 'Demo Complete',
        titleCN: '演示完成',
        description: 'Thank you for watching',
        descriptionCN: '感谢观看',
        voiceEN: 'This concludes the demonstration. CDP Shield keeps you informed and protected 24/7. Thank you for watching!',
        voiceCN: '演示到此结束。CDP Shield 全天候为您提供信息和保护。感谢观看！',
        duration: 6000,
      },
    ],
  },
  {
    id: 'quick-alert',
    name: 'Quick Alert Demo',
    nameCN: '快速警报演示',
    description: 'Demonstrate alert system in 30 seconds',
    steps: [
      {
        id: 'normal',
        title: 'Normal State',
        titleCN: '正常状态',
        description: 'Position is healthy',
        descriptionCN: '仓位健康',
        voiceEN: 'Your position is currently healthy with a health factor of 1.8.',
        voiceCN: '您的仓位当前健康，健康因子为 1.8。',
        duration: 4000,
      },
      {
        id: 'warning',
        title: 'Warning',
        titleCN: '警告',
        description: 'Price dropping',
        descriptionCN: '价格下跌',
        voiceEN: 'Warning! Health factor dropping to 1.4.',
        voiceCN: '警告！健康因子降至 1.4。',
        duration: 4000,
        action: async () => {
          playSound.warning();
          triggerVibration('warning');
        },
      },
      {
        id: 'critical',
        title: 'Critical',
        titleCN: '紧急',
        description: 'Liquidation risk',
        descriptionCN: '清算风险',
        voiceEN: 'Critical! Health factor at 1.1. Action required!',
        voiceCN: '紧急！健康因子 1.1。需要行动！',
        duration: 4000,
        action: async () => {
          playSound.critical();
          triggerVibration('critical');
        },
      },
      {
        id: 'safe',
        title: 'Safe',
        titleCN: '安全',
        description: 'Position recovered',
        descriptionCN: '仓位恢复',
        voiceEN: 'Position safe. Health factor restored to 1.9.',
        voiceCN: '仓位安全。健康因子恢复至 1.9。',
        duration: 4000,
        action: async () => {
          playSound.success();
          triggerVibration('success');
        },
      },
    ],
  },
];

interface DemoScenarioRunnerProps {
  language?: 'en' | 'zh';
  onComplete?: () => void;
  onStepChange?: (step: DemoStep, index: number) => void;
}

export function DemoScenarioRunner({
  language = 'en',
  onComplete,
  onStepChange,
}: DemoScenarioRunnerProps) {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const voiceService = getVoiceService();

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // 运行当前步骤
  const runStep = useCallback(async (step: DemoStep, index: number) => {
    setCurrentStepIndex(index);
    setProgress(0);
    onStepChange?.(step, index);

    try {
      // 执行动作
      if (step.action) {
        await step.action();
      }

      // 语音播报
      const voiceText = language === 'zh' ? step.voiceCN : step.voiceEN;
      if (voiceText) {
        // 不等待语音播报完成，让它与进度条同时运行
        voiceService.speak(voiceText, language).catch((err) => {
          console.warn('Voice playback error:', err);
        });
      }
    } catch (err) {
      console.error('Step action error:', err);
    }

    // 进度更新
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / (step.duration / 100));
        if (next >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return next;
      });
    }, 100);

    return new Promise<void>((resolve) => {
      timerRef.current = setTimeout(() => {
        clearInterval(progressInterval);
        resolve();
      }, step.duration);
    });
  }, [language, voiceService, onStepChange]);

  // 开始演示
  const startDemo = useCallback(async (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    setIsRunning(true);
    setIsPaused(false);
    setCurrentStepIndex(0);

    for (let i = 0; i < scenario.steps.length; i++) {
      if (!isRunning) break;

      while (isPaused) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await runStep(scenario.steps[i], i);
    }

    setIsRunning(false);
    setCurrentStepIndex(-1);
    onComplete?.();
  }, [runStep, isRunning, isPaused, onComplete]);

  // 暂停/继续
  const togglePause = useCallback(() => {
    setIsPaused(!isPaused);
    if (isPaused) {
      voiceService.stopSpeaking();
    }
  }, [isPaused, voiceService]);

  // 跳过当前步骤
  const skipStep = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    voiceService.stopSpeaking();
  }, [voiceService]);

  // 停止演示
  const stopDemo = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStepIndex(-1);
    setSelectedScenario(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    voiceService.stopSpeaking();
  }, [voiceService]);

  const currentStep = selectedScenario?.steps[currentStepIndex];

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          {language === 'zh' ? '演示场景' : 'Demo Scenarios'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 场景选择 */}
        {!isRunning && (
          <div className="space-y-2">
            {DEMO_SCENARIOS.map((scenario) => (
              <Button
                key={scenario.id}
                variant="outline"
                className="w-full justify-start h-auto py-3"
                onClick={() => startDemo(scenario)}
              >
                <div className="text-left">
                  <div className="font-medium">
                    {language === 'zh' ? scenario.nameCN : scenario.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {scenario.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}

        {/* 运行中的状态 */}
        {isRunning && selectedScenario && (
          <div className="space-y-4">
            {/* 当前步骤 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {language === 'zh' ? currentStep?.titleCN : currentStep?.title}
                </span>
                <Badge variant="secondary">
                  {currentStepIndex + 1} / {selectedScenario.steps.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === 'zh' ? currentStep?.descriptionCN : currentStep?.description}
              </p>
              <Progress value={progress} className="h-2" />
            </div>

            {/* 步骤列表 */}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {selectedScenario.steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 text-sm p-2 rounded ${
                    index === currentStepIndex
                      ? 'bg-primary/10 text-primary'
                      : index < currentStepIndex
                      ? 'text-muted-foreground'
                      : ''
                  }`}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : index === currentStepIndex ? (
                    <AlertTriangle className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  <span>{language === 'zh' ? step.titleCN : step.title}</span>
                </div>
              ))}
            </div>

            {/* 控制按钮 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePause}
                className="flex-1"
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    {language === 'zh' ? '继续' : 'Resume'}
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    {language === 'zh' ? '暂停' : 'Pause'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={skipStep}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={stopDemo}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                {language === 'zh' ? '停止' : 'Stop'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
