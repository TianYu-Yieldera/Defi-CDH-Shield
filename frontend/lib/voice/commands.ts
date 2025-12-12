// Voice 命令定义 - 中英文双语支持

import type { CommandIntent, SupportedLanguage } from '@/services/voice/types';
import { CHINESE_REGEX } from './constants';

// 命令关键词映射
export const COMMAND_KEYWORDS: Record<CommandIntent, { zh: string[]; en: string[] }> = {
  check_risk: {
    zh: ['查看风险', '风险', '分析风险', '风险分析', '检查风险', '风险情况', '风险怎么样'],
    en: ['check risk', 'risk', 'analyze risk', 'show risk', 'risk status', 'risk analysis'],
  },
  health_factor: {
    zh: ['健康因子', '健康度', '健康', '健康值', '查看健康因子', '健康状况'],
    en: ['health factor', 'health', 'health score', 'check health', 'health status'],
  },
  positions: {
    zh: ['仓位', '持仓', '我的仓位', '查看仓位', '仓位情况', '所有仓位', '仓位列表'],
    en: ['positions', 'my positions', 'show positions', 'list positions', 'all positions'],
  },
  alerts: {
    zh: ['预警', '警报', '有没有预警', '有没有警报', '查看预警', '预警情况', '警报信息'],
    en: ['alerts', 'warnings', 'any alerts', 'show alerts', 'check alerts', 'alert status'],
  },
  help: {
    zh: ['帮助', '怎么用', '使用说明', '可以做什么', '有什么功能'],
    en: ['help', 'how to use', 'what can you do', 'instructions', 'commands'],
  },
  unknown: {
    zh: [],
    en: [],
  },
};

// 检测文本语言
export function detectLanguage(text: string): SupportedLanguage {
  return CHINESE_REGEX.test(text) ? 'zh' : 'en';
}

// 检测命令意图
export function detectIntent(transcript: string): CommandIntent {
  const normalizedTranscript = transcript.toLowerCase().trim();

  // 遍历所有命令
  for (const [intent, keywords] of Object.entries(COMMAND_KEYWORDS)) {
    if (intent === 'unknown') continue;

    // 检查中文关键词
    for (const keyword of keywords.zh) {
      if (normalizedTranscript.includes(keyword.toLowerCase())) {
        return intent as CommandIntent;
      }
    }

    // 检查英文关键词
    for (const keyword of keywords.en) {
      if (normalizedTranscript.includes(keyword.toLowerCase())) {
        return intent as CommandIntent;
      }
    }
  }

  return 'unknown';
}

// 命令示例 (用于帮助提示)
export const COMMAND_EXAMPLES: Record<Exclude<CommandIntent, 'unknown'>, { zh: string; en: string }> = {
  check_risk: {
    zh: '说 "查看风险" 来分析您的仓位风险状况',
    en: 'Say "check risk" to analyze your position risk status',
  },
  health_factor: {
    zh: '说 "健康因子" 来查看各仓位的健康度',
    en: 'Say "health factor" to check the health of your positions',
  },
  positions: {
    zh: '说 "我的仓位" 来查看所有持仓信息',
    en: 'Say "my positions" to view all your positions',
  },
  alerts: {
    zh: '说 "有没有预警" 来查看当前预警信息',
    en: 'Say "any alerts" to check current alert status',
  },
  help: {
    zh: '说 "帮助" 来获取使用说明',
    en: 'Say "help" to get instructions',
  },
};

// 快捷命令列表 (用于 UI 显示)
export const QUICK_COMMANDS = [
  { id: 'check_risk', labelZh: '查看风险', labelEn: 'Check Risk', icon: '' },
  { id: 'health_factor', labelZh: '健康因子', labelEn: 'Health Factor', icon: '' },
  { id: 'positions', labelZh: '我的仓位', labelEn: 'Positions', icon: '' },
  { id: 'alerts', labelZh: '预警信息', labelEn: 'Alerts', icon: '' },
] as const;

// 获取命令显示名称
export function getCommandLabel(intent: CommandIntent, language: SupportedLanguage): string {
  const labels: Record<CommandIntent, { zh: string; en: string }> = {
    check_risk: { zh: '风险分析', en: 'Risk Analysis' },
    health_factor: { zh: '健康因子', en: 'Health Factor' },
    positions: { zh: '仓位查询', en: 'Positions' },
    alerts: { zh: '预警查询', en: 'Alerts' },
    help: { zh: '帮助', en: 'Help' },
    unknown: { zh: '未知命令', en: 'Unknown Command' },
  };

  return labels[intent][language];
}
