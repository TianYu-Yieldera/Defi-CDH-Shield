// JudgeMode - 评委模式
// 为 Hackathon 评委提供简洁的演示界面

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Mic,
  Shield,
  Zap,
  Globe,
  Smartphone,
  Volume2,
  Bell,
  Check,
  X,
  ExternalLink,
  Github,
  FileText,
  Award,
} from 'lucide-react';
import { DemoScenarioRunner } from './DemoScenarioRunner';
import { useVoice } from '@/hooks/useVoice';
import { usePWA } from '@/hooks/usePWA';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useVibration } from '@/hooks/useVibration';
import { playSound } from '@/services/voice/SoundGenerator';

interface Feature {
  id: string;
  name: string;
  nameCN: string;
  description: string;
  supported: boolean;
  icon: React.ReactNode;
}

interface JudgeModeProps {
  language?: 'en' | 'zh';
}

export function JudgeMode({ language = 'en' }: JudgeModeProps) {
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [activeTab, setActiveTab] = useState('overview');

  const { isSupported: voiceSupported, startListening, isListening } = useVoice();
  const { isInstallable, isOnline, promptInstall } = usePWA();
  const { isSupported: wakeLockSupported, isActive: wakeLockActive, toggle: toggleWakeLock } = useWakeLock();
  const { isSupported: vibrationSupported, vibratePattern } = useVibration();

  // 检测功能支持状态
  const features: Feature[] = [
    {
      id: 'voice',
      name: 'Voice Recognition',
      nameCN: '语音识别',
      description: 'Web Speech API for voice commands',
      supported: voiceSupported,
      icon: <Mic className="h-5 w-5" />,
    },
    {
      id: 'tts',
      name: 'Text-to-Speech',
      nameCN: '语音合成',
      description: 'AI voice responses in multiple languages',
      supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
      icon: <Volume2 className="h-5 w-5" />,
    },
    {
      id: 'pwa',
      name: 'PWA Support',
      nameCN: 'PWA 支持',
      description: 'Install as mobile/desktop app',
      supported: isInstallable || isOnline,
      icon: <Smartphone className="h-5 w-5" />,
    },
    {
      id: 'wakelock',
      name: 'Screen Wake Lock',
      nameCN: '屏幕常亮',
      description: 'Keep screen on during monitoring',
      supported: wakeLockSupported,
      icon: <Shield className="h-5 w-5" />,
    },
    {
      id: 'vibration',
      name: 'Vibration',
      nameCN: '震动反馈',
      description: 'Haptic feedback for alerts',
      supported: vibrationSupported,
      icon: <Bell className="h-5 w-5" />,
    },
    {
      id: 'audio',
      name: 'Audio Alerts',
      nameCN: '音频警报',
      description: 'Web Audio API sound generation',
      supported: typeof window !== 'undefined' && 'AudioContext' in window,
      icon: <Zap className="h-5 w-5" />,
    },
  ];

  // 项目亮点
  const highlights = [
    {
      title: currentLanguage === 'zh' ? 'AI 语音助手' : 'AI Voice Assistant',
      description: currentLanguage === 'zh'
        ? '自然语言交互，支持中英文双语'
        : 'Natural language interaction with bilingual support',
    },
    {
      title: currentLanguage === 'zh' ? '实时监控' : 'Real-time Monitoring',
      description: currentLanguage === 'zh'
        ? '24/7 监控您的 DeFi 仓位'
        : '24/7 monitoring of your DeFi positions',
    },
    {
      title: currentLanguage === 'zh' ? '智能预警' : 'Smart Alerts',
      description: currentLanguage === 'zh'
        ? '多级别警报系统，防止清算'
        : 'Multi-level alert system to prevent liquidation',
    },
    {
      title: currentLanguage === 'zh' ? 'BASE 链原生' : 'BASE Native',
      description: currentLanguage === 'zh'
        ? '专为 BASE 生态系统优化'
        : 'Optimized for BASE ecosystem',
    },
  ];

  // 测试功能
  const testFeature = useCallback((featureId: string) => {
    switch (featureId) {
      case 'voice':
        startListening();
        break;
      case 'tts':
        const utterance = new SpeechSynthesisUtterance(
          currentLanguage === 'zh' ? '欢迎使用 CDP Shield' : 'Welcome to CDP Shield'
        );
        utterance.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en-US';
        speechSynthesis.speak(utterance);
        break;
      case 'vibration':
        vibratePattern('notification');
        break;
      case 'audio':
        playSound.notification();
        break;
      case 'wakelock':
        toggleWakeLock();
        break;
      case 'pwa':
        promptInstall();
        break;
    }
  }, [startListening, currentLanguage, vibratePattern, toggleWakeLock, promptInstall]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Shield className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold">CDPShield</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            {currentLanguage === 'zh'
              ? 'AI 驱动的 DeFi 仓位监控语音助手'
              : 'AI-Powered Voice Assistant for DeFi Position Monitoring'}
          </p>

          {/* Language Toggle */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant={currentLanguage === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentLanguage('en')}
            >
              English
            </Button>
            <Button
              variant={currentLanguage === 'zh' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentLanguage('zh')}
            >
              中文
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto">
            <TabsTrigger value="overview">
              {currentLanguage === 'zh' ? '概览' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="demo">
              {currentLanguage === 'zh' ? '演示' : 'Demo'}
            </TabsTrigger>
            <TabsTrigger value="features">
              {currentLanguage === 'zh' ? '功能' : 'Features'}
            </TabsTrigger>
            <TabsTrigger value="tech">
              {currentLanguage === 'zh' ? '技术' : 'Tech'}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Highlights */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {highlights.map((highlight, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{highlight.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{highlight.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentLanguage === 'zh' ? '快速体验' : 'Quick Experience'}
                </CardTitle>
                <CardDescription>
                  {currentLanguage === 'zh'
                    ? '点击按钮快速体验核心功能'
                    : 'Click buttons to quickly experience core features'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => testFeature('voice')} disabled={!voiceSupported}>
                    <Mic className="h-4 w-4 mr-2" />
                    {currentLanguage === 'zh' ? '语音输入' : 'Voice Input'}
                  </Button>
                  <Button variant="outline" onClick={() => testFeature('tts')}>
                    <Volume2 className="h-4 w-4 mr-2" />
                    {currentLanguage === 'zh' ? '语音播报' : 'Voice Output'}
                  </Button>
                  <Button variant="outline" onClick={() => playSound.warning()}>
                    <Bell className="h-4 w-4 mr-2" />
                    {currentLanguage === 'zh' ? '警报音效' : 'Alert Sound'}
                  </Button>
                  <Button variant="outline" onClick={() => playSound.critical()}>
                    <Zap className="h-4 w-4 mr-2" />
                    {currentLanguage === 'zh' ? '紧急警报' : 'Critical Alert'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Demo Tab */}
          <TabsContent value="demo" className="flex justify-center">
            <DemoScenarioRunner language={currentLanguage} />
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {feature.icon}
                        <CardTitle className="text-base">
                          {currentLanguage === 'zh' ? feature.nameCN : feature.name}
                        </CardTitle>
                      </div>
                      <Badge variant={feature.supported ? 'default' : 'secondary'}>
                        {feature.supported ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => testFeature(feature.id)}
                      disabled={!feature.supported}
                    >
                      {currentLanguage === 'zh' ? '测试' : 'Test'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tech Tab */}
          <TabsContent value="tech" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {currentLanguage === 'zh' ? '前端技术' : 'Frontend Stack'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Next.js 14 (App Router)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      TypeScript
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Tailwind CSS + shadcn/ui
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Zustand State Management
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Web Speech API
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Web Audio API
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {currentLanguage === 'zh' ? 'Web3 集成' : 'Web3 Integration'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      wagmi + viem
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      RainbowKit Wallet
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      BASE Sepolia Testnet
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Aave V3 Flash Loans
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Custom Smart Contracts
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Links */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentLanguage === 'zh' ? '项目链接' : 'Project Links'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" asChild>
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4 mr-2" />
                      GitHub
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      {currentLanguage === 'zh' ? '文档' : 'Documentation'}
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {currentLanguage === 'zh' ? '合约' : 'Contract'}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8">
          <div className="flex items-center justify-center gap-2">
            <Award className="h-4 w-4" />
            <span>Built for BASE Hackathon 2024</span>
          </div>
        </div>
      </div>
    </div>
  );
}
