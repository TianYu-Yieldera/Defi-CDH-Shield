// CommandProcessor - 命令处理器

import type { CDPPosition } from '@/types';
import type { CommandResult, CommandIntent, SupportedLanguage, VoiceAlert } from './types';
import { detectIntent, detectLanguage } from '@/lib/voice/commands';
import { useCDPStore } from '@/store/cdpStore';
import { useVoiceStore } from '@/store/voiceStore';

export class CommandProcessor {
  // 处理语音输入
  process(transcript: string): CommandResult {
    const normalizedTranscript = transcript.trim();
    const intent = detectIntent(normalizedTranscript);
    const language = detectLanguage(normalizedTranscript);

    let data: CDPPosition[] | VoiceAlert[] | null = null;

    switch (intent) {
      case 'check_risk':
      case 'health_factor':
      case 'positions':
        data = this.getPositionsData();
        break;
      case 'alerts':
        data = this.getAlertsData();
        break;
      case 'help':
        data = null;
        break;
      case 'unknown':
      default:
        data = null;
        break;
    }

    return {
      intent,
      data,
      language,
      rawTranscript: normalizedTranscript,
    };
  }

  // 获取仓位数据
  private getPositionsData(): CDPPosition[] {
    try {
      const state = useCDPStore.getState();
      return state.positions || [];
    } catch (error) {
      console.warn('Failed to get positions data:', error);
      return [];
    }
  }

  // 获取预警数据
  private getAlertsData(): VoiceAlert[] {
    try {
      const state = useVoiceStore.getState();
      // 只返回未被dismiss的警报
      return state.alerts.filter((alert) => !alert.dismissed);
    } catch (error) {
      console.warn('Failed to get alerts data:', error);
      return [];
    }
  }

  // 验证命令意图
  validateIntent(intent: CommandIntent): boolean {
    const validIntents: CommandIntent[] = [
      'check_risk',
      'health_factor',
      'positions',
      'alerts',
      'help',
    ];
    return validIntents.includes(intent);
  }

  // 获取命令建议
  getSuggestions(partialTranscript: string, language: SupportedLanguage): string[] {
    const suggestions: Record<SupportedLanguage, string[]> = {
      zh: ['查看风险', '健康因子', '我的仓位', '有没有预警', '帮助'],
      en: ['check risk', 'health factor', 'my positions', 'any alerts', 'help'],
    };

    if (!partialTranscript) {
      return suggestions[language];
    }

    const normalized = partialTranscript.toLowerCase();
    return suggestions[language].filter(s =>
      s.toLowerCase().includes(normalized) ||
      normalized.includes(s.toLowerCase().substring(0, 2))
    );
  }
}
