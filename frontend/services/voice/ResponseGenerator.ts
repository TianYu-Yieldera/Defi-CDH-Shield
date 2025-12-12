// ResponseGenerator - 响应生成器

import type { CDPPosition } from '@/types';
import type { CommandResult, SupportedLanguage, VoiceAlert } from './types';
import {
  checkRiskResponse,
  healthFactorResponse,
  positionsResponse,
  alertsResponse,
  helpResponse,
  unknownCommandResponse,
} from '@/lib/voice/templates';

// 类型守卫：检查是否为 CDPPosition 数组
function isCDPPositionArray(data: unknown): data is CDPPosition[] {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return true; // 空数组可以视为有效

  // 检查第一个元素是否具有 CDPPosition 的关键属性
  const firstItem = data[0];
  return (
    typeof firstItem === 'object' &&
    firstItem !== null &&
    'healthFactor' in firstItem &&
    'protocol' in firstItem &&
    'collateralAmount' in firstItem
  );
}

// 类型守卫：检查是否为 VoiceAlert 数组
function isVoiceAlertArray(data: unknown): data is VoiceAlert[] {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return true; // 空数组可以视为有效

  // 检查第一个元素是否具有 VoiceAlert 的关键属性
  const firstItem = data[0];
  return (
    typeof firstItem === 'object' &&
    firstItem !== null &&
    'level' in firstItem &&
    'positionId' in firstItem &&
    'message' in firstItem
  );
}

export class ResponseGenerator {
  // 根据命令结果生成响应
  generate(commandResult: CommandResult): string {
    const { intent, data, language, rawTranscript } = commandResult;

    switch (intent) {
      case 'check_risk':
        if (isCDPPositionArray(data)) {
          return checkRiskResponse(data, language);
        }
        return this.generateDataError(language);

      case 'health_factor':
        if (isCDPPositionArray(data)) {
          return healthFactorResponse(data, language);
        }
        return this.generateDataError(language);

      case 'positions':
        if (isCDPPositionArray(data)) {
          return positionsResponse(data, language);
        }
        return this.generateDataError(language);

      case 'alerts':
        if (isVoiceAlertArray(data)) {
          return alertsResponse(data, language);
        }
        return this.generateDataError(language);

      case 'help':
        return helpResponse(null, language);

      case 'unknown':
      default:
        return unknownCommandResponse(rawTranscript, language);
    }
  }

  // 数据错误消息
  private generateDataError(language: SupportedLanguage): string {
    return language === 'zh'
      ? '获取数据时出现问题，请稍后重试。'
      : 'Error fetching data. Please try again later.';
  }

  // 生成简短确认响应
  generateConfirmation(intent: string, language: SupportedLanguage): string {
    const confirmations: Record<string, { zh: string; en: string }> = {
      check_risk: { zh: '正在分析风险...', en: 'Analyzing risks...' },
      health_factor: { zh: '正在查询健康因子...', en: 'Checking health factors...' },
      positions: { zh: '正在获取仓位信息...', en: 'Fetching positions...' },
      alerts: { zh: '正在检查预警...', en: 'Checking alerts...' },
      help: { zh: '好的，让我告诉你...', en: 'Sure, let me explain...' },
    };

    const confirmation = confirmations[intent];
    if (confirmation) {
      return confirmation[language];
    }
    return language === 'zh' ? '正在处理...' : 'Processing...';
  }

  // 生成欢迎消息
  generateWelcome(language: SupportedLanguage): string {
    if (language === 'zh') {
      return '您好！我是 CDP Shield 语音助手。您可以问我关于仓位风险的问题，说 "帮助" 了解更多。';
    }
    return 'Hello! I\'m the CDP Shield voice assistant. You can ask me about your position risks. Say "help" to learn more.';
  }

  // 生成告别消息
  generateGoodbye(language: SupportedLanguage): string {
    if (language === 'zh') {
      return '再见！如需帮助，随时唤醒我。';
    }
    return 'Goodbye! Wake me anytime you need help.';
  }

  // 生成错误消息
  generateError(errorCode: string, language: SupportedLanguage): string {
    const errorMessages: Record<string, { zh: string; en: string }> = {
      voice_not_supported: {
        zh: '抱歉，您的浏览器不支持语音功能。请使用 Chrome 或 Edge 浏览器。',
        en: 'Sorry, your browser doesn\'t support voice features. Please use Chrome or Edge.',
      },
      no_microphone_permission: {
        zh: '需要麦克风权限才能使用语音功能。请在浏览器中允许麦克风访问。',
        en: 'Microphone permission is required. Please allow microphone access in your browser.',
      },
      network_error: {
        zh: '网络连接出现问题。请检查您的网络连接后重试。',
        en: 'Network connection issue. Please check your connection and try again.',
      },
      recognition_error: {
        zh: '语音识别出现问题。请稍后重试。',
        en: 'Speech recognition error. Please try again later.',
      },
      recognition_timeout: {
        zh: '没有检测到语音。请对着麦克风说话。',
        en: 'No speech detected. Please speak into the microphone.',
      },
      no_speech_detected: {
        zh: '没有检测到语音输入。请确保麦克风正常工作并重试。',
        en: 'No speech input detected. Please ensure your microphone is working and try again.',
      },
      default: {
        zh: '出现了一些问题。请稍后重试。',
        en: 'Something went wrong. Please try again later.',
      },
    };

    const message = errorMessages[errorCode] || errorMessages.default;
    return message[language];
  }

  // 生成状态更新消息
  generateStatusUpdate(status: string, language: SupportedLanguage): string {
    const statusMessages: Record<string, { zh: string; en: string }> = {
      listening: { zh: '正在聆听...', en: 'Listening...' },
      processing: { zh: '正在处理...', en: 'Processing...' },
      speaking: { zh: '正在播报...', en: 'Speaking...' },
      ready: { zh: '准备就绪', en: 'Ready' },
    };

    const message = statusMessages[status];
    if (message) {
      return message[language];
    }
    return '';
  }
}
