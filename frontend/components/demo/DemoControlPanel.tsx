// DemoControlPanel - 演示控制面板
// 用于 Hackathon 演示，让评委可以控制各种场景

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Volume2,
  Vibrate,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useCDPStore } from '@/store/cdpStore';
import { useVoiceStore } from '@/store/voiceStore';
import { getVoiceService } from '@/services/voice/VoiceService';
import { triggerVibration } from '@/hooks/useVibration';
import { playSound } from '@/services/voice/SoundGenerator';

interface DemoScenario {
  id: string;
  name: string;
  nameCN: string;
  description: string;
  duration: number; // 秒
  steps: DemoStep[];
}

interface DemoStep {
  delay: number; // 延迟(毫秒)
  action: () => void;
  description: string;
}

export function DemoControlPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);
  const [healthFactor, setHealthFactor] = useState(1.8);
  const [priceChange, setPriceChange] = useState(0);
  const [autoMode, setAutoMode] = useState(false);

  const cdpStore = useCDPStore();
  const voiceStore = useVoiceStore();

  // 模拟价格变化
  const simulatePriceChange = useCallback((changePercent: number) => {
    const positions = cdpStore.positions;
    if (positions.length > 0) {
      const position = positions[0];
      const newPrice = position.currentPrice * (1 + changePercent / 100);
      cdpStore.updatePosition(position.id, {
        currentPrice: newPrice,
        collateralValueUSD: position.collateralAmount * newPrice,
      });
    }
    setPriceChange(changePercent);
  }, [cdpStore]);

  // 模拟健康因子变化
  const simulateHealthFactor = useCallback((newHF: number) => {
    const positions = cdpStore.positions;
    if (positions.length > 0) {
      cdpStore.updatePosition(positions[0].id, {
        healthFactor: newHF,
      });
    }
    setHealthFactor(newHF);

    // 触发警报
    if (newHF < 1.3) {
      playSound.critical();
      triggerVibration('critical');
    } else if (newHF < 1.5) {
      playSound.warning();
      triggerVibration('warning');
    }
  }, [cdpStore]);

  // 触发紧急警报
  const triggerCriticalAlert = useCallback(() => {
    playSound.critical();
    triggerVibration('critical');

    const voiceService = getVoiceService();
    voiceService.speak('Warning! Critical alert! Your position health factor has dropped below safe threshold. Immediate action required.', 'en');
  }, []);

  // 触发普通警报
  const triggerWarningAlert = useCallback(() => {
    playSound.warning();
    triggerVibration('warning');

    const voiceService = getVoiceService();
    voiceService.speak('Attention: Your position health factor is decreasing. Please monitor closely.', 'en');
  }, []);

  // 播放成功音效
  const playSuccessSound = useCallback(() => {
    playSound.success();
    triggerVibration('success');
  }, []);

  // 重置状态
  const resetDemo = useCallback(() => {
    setHealthFactor(1.8);
    setPriceChange(0);
    setIsRunning(false);
    setCurrentScenario(null);

    const positions = cdpStore.positions;
    if (positions.length > 0) {
      cdpStore.updatePosition(positions[0].id, {
        healthFactor: 1.8,
        currentPrice: 3500,
      });
    }
  }, [cdpStore]);

  // 预设场景
  const scenarios: DemoScenario[] = [
    {
      id: 'price-crash',
      name: 'Price Crash',
      nameCN: '价格暴跌',
      description: 'Simulate ETH price dropping 20%, triggering critical alert',
      duration: 10,
      steps: [
        { delay: 0, action: () => simulatePriceChange(-5), description: 'Price -5%' },
        { delay: 2000, action: () => simulatePriceChange(-10), description: 'Price -10%' },
        { delay: 4000, action: () => simulatePriceChange(-15), description: 'Price -15%' },
        { delay: 6000, action: () => simulatePriceChange(-20), description: 'Price -20%' },
        { delay: 8000, action: triggerCriticalAlert, description: 'Critical Alert' },
      ],
    },
    {
      id: 'health-decline',
      name: 'Health Declining',
      nameCN: '健康度下降',
      description: 'Gradually decrease health factor from safe to critical',
      duration: 12,
      steps: [
        { delay: 0, action: () => simulateHealthFactor(1.6), description: 'HF: 1.6' },
        { delay: 3000, action: () => simulateHealthFactor(1.4), description: 'HF: 1.4 (Warning)' },
        { delay: 6000, action: () => simulateHealthFactor(1.2), description: 'HF: 1.2 (Critical)' },
        { delay: 9000, action: () => simulateHealthFactor(1.05), description: 'HF: 1.05 (Liquidation Risk)' },
      ],
    },
    {
      id: 'recovery',
      name: 'Market Recovery',
      nameCN: '市场恢复',
      description: 'Simulate price recovery after a dip',
      duration: 8,
      steps: [
        { delay: 0, action: () => simulatePriceChange(-10), description: 'Price dip -10%' },
        { delay: 2000, action: triggerWarningAlert, description: 'Warning Alert' },
        { delay: 4000, action: () => simulatePriceChange(-5), description: 'Recovery to -5%' },
        { delay: 6000, action: () => simulatePriceChange(0), description: 'Full recovery' },
        { delay: 7000, action: playSuccessSound, description: 'Success' },
      ],
    },
  ];

  // 运行场景
  const runScenario = useCallback((scenario: DemoScenario) => {
    if (isRunning) return;

    setIsRunning(true);
    setCurrentScenario(scenario.id);

    scenario.steps.forEach((step) => {
      setTimeout(() => {
        step.action();
      }, step.delay);
    });

    // 结束场景
    setTimeout(() => {
      setIsRunning(false);
      setCurrentScenario(null);
    }, scenario.duration * 1000);
  }, [isRunning]);

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-2xl border-primary/20">
      <CardHeader
        className="cursor-pointer py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Demo Control Panel</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isRunning && (
              <Badge variant="destructive" className="animate-pulse">
                Running
              </Badge>
            )}
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pb-4">
          {/* Quick Actions */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick Actions</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={triggerCriticalAlert}
                className="h-auto py-2 flex flex-col gap-1"
              >
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-xs">Critical</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={triggerWarningAlert}
                className="h-auto py-2 flex flex-col gap-1"
              >
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-xs">Warning</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={playSuccessSound}
                className="h-auto py-2 flex flex-col gap-1"
              >
                <Zap className="h-4 w-4 text-green-500" />
                <span className="text-xs">Success</span>
              </Button>
            </div>
          </div>

          {/* Health Factor Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Health Factor</Label>
              <span
                className={`text-sm font-mono ${
                  healthFactor < 1.3
                    ? 'text-red-500'
                    : healthFactor < 1.5
                    ? 'text-yellow-500'
                    : 'text-green-500'
                }`}
              >
                {healthFactor.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[healthFactor]}
              min={1.0}
              max={2.5}
              step={0.05}
              onValueChange={([value]) => simulateHealthFactor(value)}
            />
          </div>

          {/* Price Change Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Price Change</Label>
              <span
                className={`text-sm font-mono ${
                  priceChange < 0 ? 'text-red-500' : priceChange > 0 ? 'text-green-500' : ''
                }`}
              >
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[priceChange]}
              min={-30}
              max={30}
              step={1}
              onValueChange={([value]) => simulatePriceChange(value)}
            />
          </div>

          {/* Demo Scenarios */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Demo Scenarios</Label>
            <div className="space-y-2">
              {scenarios.map((scenario) => (
                <Button
                  key={scenario.id}
                  size="sm"
                  variant={currentScenario === scenario.id ? 'default' : 'outline'}
                  className="w-full justify-start h-auto py-2"
                  disabled={isRunning && currentScenario !== scenario.id}
                  onClick={() => runScenario(scenario)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {currentScenario === scenario.id && isRunning ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    <div className="text-left flex-1">
                      <div className="text-sm">{scenario.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {scenario.nameCN} • {scenario.duration}s
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Auto Mode Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Auto Demo Mode</Label>
            <Switch
              checked={autoMode}
              onCheckedChange={setAutoMode}
            />
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={resetDemo}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Demo
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
