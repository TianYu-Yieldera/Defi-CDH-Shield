// Voice 响应模板 - 中英文双语支持

import type { CDPPosition } from '@/types';
import type { VoiceAlert, SupportedLanguage, AlertLevel } from '@/services/voice/types';

// 响应模板类型
type TemplateFunction<T> = (data: T, language: SupportedLanguage) => string;

// 风险分析响应
export const checkRiskResponse: TemplateFunction<CDPPosition[]> = (positions, language) => {
  if (positions.length === 0) {
    return language === 'zh'
      ? '您目前没有活跃的仓位。'
      : 'You currently have no active positions.';
  }

  const count = positions.length;
  const criticalPositions = positions.filter(p => p.healthFactor < 1.1);
  const warningPositions = positions.filter(p => p.healthFactor >= 1.1 && p.healthFactor < 1.3);
  const cautionPositions = positions.filter(p => p.healthFactor >= 1.3 && p.healthFactor < 1.5);
  const safePositions = positions.filter(p => p.healthFactor >= 1.5);

  if (language === 'zh') {
    let response = `您目前有 ${count} 个活跃仓位。`;

    if (criticalPositions.length > 0) {
      response += `其中 ${criticalPositions.length} 个仓位面临紧急清算风险，请立即处理！`;
      criticalPositions.forEach(p => {
        response += ` ${p.protocol} 仓位健康因子仅为 ${p.healthFactor.toFixed(2)}。`;
      });
    }

    if (warningPositions.length > 0) {
      response += `${warningPositions.length} 个仓位处于警告区间，建议关注。`;
    }

    if (cautionPositions.length > 0) {
      response += `${cautionPositions.length} 个仓位需要注意。`;
    }

    if (safePositions.length > 0 && criticalPositions.length === 0 && warningPositions.length === 0) {
      response += '所有仓位状态健康。';
    }

    return response;
  } else {
    let response = `You have ${count} active position${count > 1 ? 's' : ''}.`;

    if (criticalPositions.length > 0) {
      response += ` ${criticalPositions.length} position${criticalPositions.length > 1 ? 's are' : ' is'} at critical liquidation risk! Please take action immediately!`;
      criticalPositions.forEach(p => {
        response += ` ${p.protocol} health factor is only ${p.healthFactor.toFixed(2)}.`;
      });
    }

    if (warningPositions.length > 0) {
      response += ` ${warningPositions.length} position${warningPositions.length > 1 ? 's are' : ' is'} in warning zone.`;
    }

    if (cautionPositions.length > 0) {
      response += ` ${cautionPositions.length} position${cautionPositions.length > 1 ? 's need' : ' needs'} attention.`;
    }

    if (safePositions.length > 0 && criticalPositions.length === 0 && warningPositions.length === 0) {
      response += ' All positions are healthy.';
    }

    return response;
  }
};

// 健康因子响应
export const healthFactorResponse: TemplateFunction<CDPPosition[]> = (positions, language) => {
  if (positions.length === 0) {
    return language === 'zh'
      ? '您目前没有活跃的仓位。'
      : 'You currently have no active positions.';
  }

  if (language === 'zh') {
    let response = '各仓位健康因子如下：';
    positions.forEach(p => {
      const status = getHealthStatus(p.healthFactor, 'zh');
      response += ` ${p.protocol}，${p.healthFactor.toFixed(2)}，${status}。`;
    });
    return response;
  } else {
    let response = 'Health factors for your positions:';
    positions.forEach(p => {
      const status = getHealthStatus(p.healthFactor, 'en');
      response += ` ${p.protocol}, ${p.healthFactor.toFixed(2)}, ${status}.`;
    });
    return response;
  }
};

// 仓位信息响应
export const positionsResponse: TemplateFunction<CDPPosition[]> = (positions, language) => {
  if (positions.length === 0) {
    return language === 'zh'
      ? '您目前没有活跃的仓位。'
      : 'You currently have no active positions.';
  }

  if (language === 'zh') {
    let response = `您共有 ${positions.length} 个活跃仓位。`;
    positions.forEach(p => {
      response += ` ${p.protocol}：抵押 ${p.collateralAmount.toFixed(2)} ${p.collateralToken}，`;
      response += `借入 ${p.borrowedAmount.toFixed(2)} ${p.borrowedToken}，`;
      response += `健康因子 ${p.healthFactor.toFixed(2)}。`;
    });
    return response;
  } else {
    let response = `You have ${positions.length} active position${positions.length > 1 ? 's' : ''}.`;
    positions.forEach(p => {
      response += ` ${p.protocol}: collateral ${p.collateralAmount.toFixed(2)} ${p.collateralToken},`;
      response += ` borrowed ${p.borrowedAmount.toFixed(2)} ${p.borrowedToken},`;
      response += ` health factor ${p.healthFactor.toFixed(2)}.`;
    });
    return response;
  }
};

// 预警信息响应
export const alertsResponse: TemplateFunction<VoiceAlert[]> = (alerts, language) => {
  const activeAlerts = alerts.filter(a => !a.dismissed);

  if (activeAlerts.length === 0) {
    return language === 'zh'
      ? '目前没有活跃的预警信息，您的仓位状态良好。'
      : 'No active alerts. Your positions are in good status.';
  }

  if (language === 'zh') {
    let response = `您有 ${activeAlerts.length} 条预警信息。`;
    activeAlerts.forEach(a => {
      const levelText = a.level === 'critical' ? '紧急' : a.level === 'warning' ? '警告' : '注意';
      response += ` ${levelText}：${a.protocol} 仓位健康因子 ${a.healthFactor.toFixed(2)}。`;
    });
    return response;
  } else {
    let response = `You have ${activeAlerts.length} active alert${activeAlerts.length > 1 ? 's' : ''}.`;
    activeAlerts.forEach(a => {
      const levelText = a.level === 'critical' ? 'Critical' : a.level === 'warning' ? 'Warning' : 'Caution';
      response += ` ${levelText}: ${a.protocol} health factor ${a.healthFactor.toFixed(2)}.`;
    });
    return response;
  }
};

// 帮助响应
export const helpResponse: TemplateFunction<null> = (_, language) => {
  if (language === 'zh') {
    return '您可以使用以下语音命令：' +
      '说 "查看风险" 分析仓位风险；' +
      '说 "健康因子" 查看健康度；' +
      '说 "我的仓位" 查看持仓信息；' +
      '说 "有没有预警" 查看预警状态。' +
      '我会自动识别中英文，您可以使用任意语言。';
  } else {
    return 'You can use these voice commands: ' +
      'Say "check risk" to analyze position risks. ' +
      'Say "health factor" to check health scores. ' +
      'Say "my positions" to view your positions. ' +
      'Say "any alerts" to check alert status. ' +
      'I automatically detect Chinese and English.';
  }
};

// 未知命令响应
export const unknownCommandResponse: TemplateFunction<string> = (transcript, language) => {
  if (language === 'zh') {
    return `抱歉，我没有理解 "${transcript}"。您可以说 "帮助" 来了解可用的命令。`;
  } else {
    return `Sorry, I didn't understand "${transcript}". Say "help" to learn available commands.`;
  }
};

// 预警播报模板
export const alertBroadcastTemplate = (
  position: CDPPosition,
  level: AlertLevel,
  language: SupportedLanguage
): string => {
  if (language === 'zh') {
    switch (level) {
      case 'critical':
        return `紧急警报！${position.protocol} 仓位健康因子降至 ${position.healthFactor.toFixed(2)}，面临清算风险！建议立即添加抵押品或偿还债务。`;
      case 'warning':
        return `风险警告，${position.protocol} 仓位健康因子 ${position.healthFactor.toFixed(2)}，已进入警告区间，请密切关注。`;
      case 'caution':
        return `温馨提示，${position.protocol} 仓位健康因子 ${position.healthFactor.toFixed(2)}，建议适当关注。`;
    }
  } else {
    switch (level) {
      case 'critical':
        return `Critical alert! ${position.protocol} position health factor dropped to ${position.healthFactor.toFixed(2)}. Liquidation risk! Please add collateral or repay debt immediately.`;
      case 'warning':
        return `Risk warning. ${position.protocol} position health factor ${position.healthFactor.toFixed(2)}. Entering warning zone. Please monitor closely.`;
      case 'caution':
        return `Heads up. ${position.protocol} position health factor ${position.healthFactor.toFixed(2)}. Consider keeping an eye on it.`;
    }
  }
};

// 辅助函数：获取健康状态描述
function getHealthStatus(healthFactor: number, language: SupportedLanguage): string {
  if (language === 'zh') {
    if (healthFactor < 1.1) return '紧急风险';
    if (healthFactor < 1.3) return '警告';
    if (healthFactor < 1.5) return '需注意';
    return '安全';
  } else {
    if (healthFactor < 1.1) return 'critical';
    if (healthFactor < 1.3) return 'warning';
    if (healthFactor < 1.5) return 'caution';
    return 'safe';
  }
}

// 错误响应模板
export const errorResponse = (errorCode: string, language: SupportedLanguage): string => {
  const errorMessages: Record<string, { zh: string; en: string }> = {
    no_microphone_permission: {
      zh: '请授予麦克风权限以使用语音功能。',
      en: 'Please grant microphone permission to use voice features.',
    },
    network_error: {
      zh: '网络连接出现问题，请检查您的网络。',
      en: 'Network connection error. Please check your connection.',
    },
    recognition_error: {
      zh: '语音识别出现问题，请重试。',
      en: 'Speech recognition error. Please try again.',
    },
    default: {
      zh: '出现了一些问题，请稍后重试。',
      en: 'Something went wrong. Please try again later.',
    },
  };

  const message = errorMessages[errorCode] || errorMessages.default;
  return message[language];
};
