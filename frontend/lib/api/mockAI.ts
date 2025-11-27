import { AnalysisResponse, PortfolioData, Recommendation } from '../types';

export class PortfolioAnalysisEngine {
  async analyze(portfolio: PortfolioData): Promise<AnalysisResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const healthScore = this.calculateHealthScore(portfolio);
    const recommendations = this.generateRecommendations(portfolio);

    return {
      healthScore,
      recommendations,
      insights: {
        totalValue: portfolio.totalValue,
        positionCount: portfolio.positions.length,
        protocolCount: new Set(portfolio.positions.map(p => p.protocol)).size,
        compared: {
          percentile: this.calculatePercentile(healthScore.overall),
          message: `Your health score is better than ${this.calculatePercentile(healthScore.overall)}% of users`,
        },
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        model: 'rule-based',
        provider: 'local',
      },
    };
  }

  private calculateHealthScore(portfolio: PortfolioData) {
    const avgHealthFactor =
      portfolio.cdpPositions.reduce((sum, p) => sum + p.healthFactor, 0) /
      (portfolio.cdpPositions.length || 1);

    const riskScore = Math.min(100, Math.max(0, (avgHealthFactor - 1) * 50 + 50));

    const avgAPY =
      portfolio.lendingPositions.reduce((sum, p) => sum + p.apy, 0) /
      (portfolio.lendingPositions.length || 1);

    const efficiencyScore = Math.min(100, avgAPY * 15);

    const protocolCount = new Set(portfolio.positions.map(p => p.protocol)).size;
    const diversificationScore = Math.min(100, protocolCount * 25);

    const overall = Math.round(
      (riskScore * 0.5 + efficiencyScore * 0.3 + diversificationScore * 0.2)
    );

    return {
      overall,
      breakdown: {
        risk: Math.round(riskScore),
        efficiency: Math.round(efficiencyScore),
        diversification: Math.round(diversificationScore),
      },
      level: (overall >= 90 ? 'excellent' :
              overall >= 70 ? 'good' :
              overall >= 50 ? 'fair' : 'poor') as any,
    };
  }

  private generateRecommendations(portfolio: PortfolioData): Recommendation[] {
    const recommendations: Recommendation[] = [];

    portfolio.cdpPositions.forEach((position, index) => {
      if (position.healthFactor < 1.5) {
        recommendations.push({
          id: `urgent-${index}`,
          priority: 'urgent',
          title: `CDP liquidation risk detected`,
          description: `Your health factor is ${position.healthFactor.toFixed(2)}. Price drop triggers liquidation.`,
          impact: {
            type: 'risk_reduction',
            value: '-60% liquidation risk',
          },
          action: {
            label: 'Reduce Leverage',
            link: `/adjust?position=${position.id}`,
          },
        });
      }
    });

    portfolio.walletBalances.forEach((balance, index) => {
      if (balance.value > 1000) {
        recommendations.push({
          id: `opportunity-${index}`,
          priority: 'opportunity',
          title: `Idle funds detected`,
          description: `Earning 0% - Could earn 4.2% APY`,
          impact: {
            type: 'yield_increase',
            value: `+${(balance.value * 0.042).toFixed(0)}/year`,
          },
          action: {
            label: 'Deposit to Moonwell',
            link: '/deposit',
          },
        });
      }
    });

    return recommendations.slice(0, 5);
  }

  private calculatePercentile(score: number): number {
    return Math.min(99, Math.max(1, Math.round((score - 60) / 15 * 34 + 50)));
  }
}

export const analysisEngine = new PortfolioAnalysisEngine();
