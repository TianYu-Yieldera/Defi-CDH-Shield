// AlertMonitor - 预警监控服务

import type { CDPPosition } from '@/types';
import type { AlertLevel, SupportedLanguage, VoiceAlert } from './types';
import { useVoiceStore } from '@/store/voiceStore';
import { useCDPStore } from '@/store/cdpStore';
import { getVoiceService } from './VoiceService';
import { alertBroadcastTemplate } from '@/lib/voice/templates';
import { DEFAULT_VOICE_CONFIG } from '@/lib/voice/constants';

export class AlertMonitor {
  private static instance: AlertMonitor | null = null;
  private static referenceCount = 0; // 引用计数
  private cooldownMap: Map<string, number> = new Map();
  private unsubscribe: (() => void) | null = null;
  private isRunning = false;
  private language: SupportedLanguage = 'zh';

  private constructor() {}

  // 获取单例实例
  static getInstance(): AlertMonitor {
    if (!AlertMonitor.instance) {
      AlertMonitor.instance = new AlertMonitor();
    }
    return AlertMonitor.instance;
  }

  // 启动监控 (支持引用计数)
  start(): void {
    AlertMonitor.referenceCount++;

    // 如果已经在运行，只增加引用计数
    if (this.isRunning) {
      console.log(`[AlertMonitor] Reference count: ${AlertMonitor.referenceCount}`);
      return;
    }

    // 订阅 CDP 数据变化
    this.unsubscribe = useCDPStore.subscribe((state, prevState) => {
      // 只在仓位数据变化时检查
      if (state.positions !== prevState.positions) {
        this.checkPositions(state.positions);
      }
    });

    // 检查当前仓位
    const currentPositions = useCDPStore.getState().positions;
    if (currentPositions.length > 0) {
      this.checkPositions(currentPositions);
    }

    this.isRunning = true;
    console.log(`[AlertMonitor] Started monitoring (ref: ${AlertMonitor.referenceCount})`);
  }

  // 停止监控 (支持引用计数)
  stop(): void {
    AlertMonitor.referenceCount--;

    // 只有当引用计数为0时才真正停止
    if (AlertMonitor.referenceCount > 0) {
      console.log(`[AlertMonitor] Reference count: ${AlertMonitor.referenceCount}`);
      return;
    }

    // 确保引用计数不会变成负数
    AlertMonitor.referenceCount = 0;

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isRunning = false;
    console.log('[AlertMonitor] Stopped monitoring');
  }

  // 设置语言
  setLanguage(language: SupportedLanguage): void {
    this.language = language;
  }

  // 检查所有仓位
  private checkPositions(positions: CDPPosition[]): void {
    positions.forEach((position) => {
      const alertLevel = this.getAlertLevel(position.healthFactor);

      if (alertLevel && this.canAlert(position.id)) {
        this.triggerAlert(position, alertLevel);
      }
    });
  }

  // 获取预警级别
  private getAlertLevel(healthFactor: number): AlertLevel | null {
    const { criticalThreshold, warningThreshold, cautionThreshold } =
      DEFAULT_VOICE_CONFIG.alert;

    if (healthFactor < criticalThreshold) return 'critical';
    if (healthFactor < warningThreshold) return 'warning';
    if (healthFactor < cautionThreshold) return 'caution';
    return null;
  }

  // 检查是否可以发送预警 (冷却机制)
  private canAlert(positionId: string): boolean {
    const lastAlert = this.cooldownMap.get(positionId) || 0;
    const cooldown = DEFAULT_VOICE_CONFIG.alert.cooldownMs;
    return Date.now() - lastAlert > cooldown;
  }

  // 触发预警
  private async triggerAlert(position: CDPPosition, level: AlertLevel): Promise<void> {
    // 记录冷却时间
    this.cooldownMap.set(position.id, Date.now());

    const voiceService = getVoiceService();
    const voiceStore = useVoiceStore.getState();

    // 生成预警消息
    const message = alertBroadcastTemplate(position, level, this.language);

    // 添加到预警列表
    voiceStore.addAlert({
      positionId: position.id,
      protocol: position.protocol,
      level,
      healthFactor: position.healthFactor,
      message,
    });

    // 只有 critical 和 warning 级别才触发语音和震动
    if (level === 'critical' || level === 'warning') {
      // 1. 播放警报音效
      if (DEFAULT_VOICE_CONFIG.alert.soundEnabled) {
        voiceService.playSound(level);
      }

      // 2. 触发震动 (移动端)
      if (DEFAULT_VOICE_CONFIG.alert.vibrationEnabled) {
        voiceService.vibrate(level);
      }

      // 3. 语音播报
      await voiceService.speak(message, this.language);
    }

    console.log(`[AlertMonitor] Alert triggered: ${level} for ${position.protocol}`);
  }

  // 手动触发预警检查 (用于演示模式)
  forceCheck(): void {
    const positions = useCDPStore.getState().positions;
    // 清除冷却时间以允许重新触发
    this.cooldownMap.clear();
    this.checkPositions(positions);
  }

  // 模拟健康因子下降 (用于演示模式)
  async simulateHealthFactorDrop(
    positionId: string,
    targetHealthFactor: number
  ): Promise<void> {
    const cdpStore = useCDPStore.getState();

    // 更新仓位健康因子
    cdpStore.updatePosition(positionId, {
      healthFactor: targetHealthFactor,
    });

    // 清除该仓位的冷却时间
    this.cooldownMap.delete(positionId);
  }

  // 清除所有冷却时间
  clearCooldowns(): void {
    this.cooldownMap.clear();
  }

  // 获取监控状态
  getStatus(): {
    isRunning: boolean;
    cooldownMap: Map<string, number>;
    language: SupportedLanguage;
  } {
    return {
      isRunning: this.isRunning,
      cooldownMap: new Map(this.cooldownMap),
      language: this.language,
    };
  }
}

// 导出单例获取函数
export function getAlertMonitor(): AlertMonitor {
  return AlertMonitor.getInstance();
}
