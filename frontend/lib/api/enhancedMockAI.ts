import { AnalysisResponse, PortfolioData, Recommendation, HealthScore } from '../types';

/**
 * Enhanced Rule-based AI Analyzer
 * Free, no API required, pure local computation
 *
 * Advantages:
 * - Zero cost
 * - Fast response (<100ms)
 * - Data privacy (no external calls)
 * - Optimized for DeFi scenarios
 */
export class EnhancedMockAI {

  /**
   * Analyze portfolio
   */
  async analyze(portfolio: PortfolioData): Promise<AnalysisResponse> {
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    const healthScore = this.calculateHealthScore(portfolio);
    const recommendations = this.generateRecommendations(portfolio);
    const insights = this.generateInsights(portfolio, healthScore);

    return {
      healthScore,
      recommendations,
      insights,
      metadata: {
        analyzedAt: new Date().toISOString(),
        cachedUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        model: 'mock',
        provider: 'mock',
      },
    };
  }

  /**
   * Calculate health score
   * Considers: risk, efficiency, diversification
   */
  private calculateHealthScore(portfolio: PortfolioData): HealthScore {
    // 1. Risk score (50% weight)
    const riskScore = this.calculateRiskScore(portfolio);

    // 2. Efficiency score (30% weight)
    const efficiencyScore = this.calculateEfficiencyScore(portfolio);

    // 3. Diversification score (20% weight)
    const diversificationScore = this.calculateDiversificationScore(portfolio);

    // 4. Weighted total
    const overall = Math.round(
      riskScore * 0.5 +
      efficiencyScore * 0.3 +
      diversificationScore * 0.2
    );

    // 5. Rating level
    const level = this.getScoreLevel(overall);

    return {
      overall,
      breakdown: {
        risk: Math.round(riskScore),
        efficiency: Math.round(efficiencyScore),
        diversification: Math.round(diversificationScore),
      },
      level,
    };
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(portfolio: PortfolioData): number {
    if (portfolio.cdpPositions.length === 0) {
      return 100;
    }

    // Calculate average health factor
    const avgHealthFactor =
      portfolio.cdpPositions.reduce((sum, p) => sum + p.healthFactor, 0) /
      portfolio.cdpPositions.length;

    // Consider market volatility
    const avgVolatility = this.getAverageVolatility(portfolio);

    // Base risk score
    let riskScore = Math.min(100, Math.max(0, (avgHealthFactor - 1) * 50 + 50));

    // Volatility adjustment
    if (avgVolatility > 0.5 && avgHealthFactor < 2.0) {
      riskScore *= 0.8;
    }

    // Check for critical positions
    const minHealthFactor = Math.min(...portfolio.cdpPositions.map(p => p.healthFactor));
    if (minHealthFactor < 1.2) {
      riskScore = Math.min(riskScore, 30);
    }

    return riskScore;
  }

  /**
   * Calculate efficiency score
   */
  private calculateEfficiencyScore(portfolio: PortfolioData): number {
    // 1. Lending APY
    const avgAPY = portfolio.lendingPositions.length > 0
      ? portfolio.lendingPositions.reduce((sum, p) => sum + p.apy, 0) / portfolio.lendingPositions.length
      : 0;

    let efficiencyScore = Math.min(100, avgAPY * 15);

    // 2. Idle funds penalty
    const idleValue = portfolio.walletBalances.reduce((sum, b) => sum + b.value, 0);
    const idleRatio = idleValue / (portfolio.totalValue || 1);

    if (idleRatio > 0.2) {
      efficiencyScore *= (1 - idleRatio * 0.5);
    }

    // 3. Capital utilization
    const totalInvested = portfolio.positions.reduce((sum, p) => sum + p.value, 0);
    const utilizationRate = totalInvested / (portfolio.totalValue || 1);

    efficiencyScore *= (0.5 + utilizationRate * 0.5);

    return Math.max(0, efficiencyScore);
  }

  /**
   * Calculate diversification score
   */
  private calculateDiversificationScore(portfolio: PortfolioData): number {
    // 1. Protocol count
    const protocolCount = new Set(portfolio.positions.map(p => p.protocol)).size;
    let diversificationScore = Math.min(100, protocolCount * 25);

    // 2. Protocol concentration check
    const protocolDistribution = this.getProtocolDistribution(portfolio);
    const maxConcentration = Math.max(...Object.values(protocolDistribution));

    if (maxConcentration > 0.7) {
      diversificationScore *= 0.5;
    } else if (maxConcentration > 0.5) {
      diversificationScore *= 0.7;
    }

    // 3. Asset type diversity
    const assetTypes = new Set(portfolio.positions.map(p => p.type));
    diversificationScore += assetTypes.size * 10;

    return Math.min(100, diversificationScore);
  }

  /**
   * Generate smart recommendations
   */
  private generateRecommendations(portfolio: PortfolioData): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 1. Liquidation risk warnings
    this.addLiquidationRiskWarnings(portfolio, recommendations);

    // 2. Idle funds opportunities
    this.addIdleFundsOpportunities(portfolio, recommendations);

    // 3. Protocol concentration warnings
    this.addConcentrationWarnings(portfolio, recommendations);

    // 4. APY optimization suggestions
    this.addAPYOptimizations(portfolio, recommendations);

    // 5. Market volatility warnings
    this.addVolatilityWarnings(portfolio, recommendations);

    // Sort by priority and limit results
    return this.prioritizeRecommendations(recommendations).slice(0, 5);
  }

  /**
   * Add liquidation risk warnings
   */
  private addLiquidationRiskWarnings(
    portfolio: PortfolioData,
    recommendations: Recommendation[]
  ) {
    portfolio.cdpPositions.forEach((position, index) => {
      let priority: 'urgent' | 'opportunity' | 'insight';
      let title: string;
      let description: string;
      let impact: string;

      if (position.healthFactor < 1.1) {
        priority = 'urgent';
        title = `CRITICAL: ${position.protocol.toUpperCase()} position at extreme risk`;
        description = `Health factor ${position.healthFactor.toFixed(2)} is critically low! Liquidation imminent if ${position.collateral.symbol} drops ${((1 - position.liquidationPrice / portfolio.marketData[position.collateral.symbol]?.price) * 100).toFixed(1)}%.`;
        impact = '-80% liquidation risk';

      } else if (position.healthFactor < 1.3) {
        priority = 'urgent';
        title = `HIGH RISK: ${position.protocol.toUpperCase()} liquidation warning`;
        description = `Health factor ${position.healthFactor.toFixed(2)} is dangerously low. Consider adding collateral or repaying debt.`;
        impact = '-60% liquidation risk';

      } else if (position.healthFactor < 1.5) {
        priority = 'urgent';
        title = `MODERATE RISK: ${position.protocol.toUpperCase()} needs monitoring`;
        description = `Health factor ${position.healthFactor.toFixed(2)} is below safe threshold (1.5). Market volatility could trigger liquidation.`;
        impact = '-40% liquidation risk';

      } else if (position.healthFactor < 2.0) {
        priority = 'insight';
        title = `Consider improving ${position.protocol.toUpperCase()} health factor`;
        description = `Health factor ${position.healthFactor.toFixed(2)} could be higher for better safety margin.`;
        impact = 'Increase safety buffer';

      } else {
        return;
      }

      recommendations.push({
        id: `risk-${position.id}-${index}`,
        priority,
        title,
        description,
        impact: {
          type: 'risk_reduction',
          value: impact,
        },
        action: {
          label: 'Reduce Leverage',
          link: `/adjust?position=${position.id}`,
        },
      });
    });
  }

  /**
   * Add idle funds opportunities
   */
  private addIdleFundsOpportunities(
    portfolio: PortfolioData,
    recommendations: Recommendation[]
  ) {
    portfolio.walletBalances.forEach((balance, index) => {
      if (balance.value > 500) {
        const estimatedAPY = 4.2;
        const yearlyEarnings = balance.value * (estimatedAPY / 100);

        recommendations.push({
          id: `idle-${index}`,
          priority: 'opportunity',
          title: `${balance.symbol} idle funds: $${balance.value.toLocaleString()}`,
          description: `Your ${balance.symbol} is earning 0%. Deposit to Moonwell to earn ~${estimatedAPY}% APY.`,
          impact: {
            type: 'yield_increase',
            value: `+$${yearlyEarnings.toFixed(0)}/year`,
          },
          action: {
            label: 'Deposit to Moonwell',
            link: '/deposit',
            params: { symbol: balance.symbol, amount: balance.amount },
          },
        });
      }
    });
  }

  /**
   * Add protocol concentration warnings
   */
  private addConcentrationWarnings(
    portfolio: PortfolioData,
    recommendations: Recommendation[]
  ) {
    const distribution = this.getProtocolDistribution(portfolio);

    Object.entries(distribution).forEach(([protocol, ratio]) => {
      if (ratio > 0.7) {
        recommendations.push({
          id: `concentration-${protocol}`,
          priority: 'insight',
          title: `High concentration in ${protocol}: ${(ratio * 100).toFixed(0)}%`,
          description: `${(ratio * 100).toFixed(0)}% of your portfolio is in ${protocol}. Consider diversifying to reduce protocol-specific risk.`,
          impact: {
            type: 'efficiency',
            value: 'Reduce correlation risk',
          },
        });
      }
    });
  }

  /**
   * Add APY optimization suggestions
   */
  private addAPYOptimizations(
    portfolio: PortfolioData,
    recommendations: Recommendation[]
  ) {
    portfolio.lendingPositions.forEach((position, index) => {
      if (position.apy < 3) {
        recommendations.push({
          id: `low-apy-${index}`,
          priority: 'opportunity',
          title: `Low APY on ${position.symbol}: ${position.apy.toFixed(2)}%`,
          description: `Your ${position.symbol} is only earning ${position.apy.toFixed(2)}%. Consider moving to higher yield protocols.`,
          impact: {
            type: 'yield_increase',
            value: `Potential +${((6 - position.apy) * position.value / 100).toFixed(0)}/year`,
          },
        });
      }
    });
  }

  /**
   * Add market volatility warnings
   */
  private addVolatilityWarnings(
    portfolio: PortfolioData,
    recommendations: Recommendation[]
  ) {
    const highVolatilityAssets = Object.entries(portfolio.marketData)
      .filter(([_, data]) => data.volatility > 0.5);

    if (highVolatilityAssets.length > 0) {
      const avgHealthFactor = portfolio.cdpPositions.length > 0
        ? portfolio.cdpPositions.reduce((s, p) => s + p.healthFactor, 0) / portfolio.cdpPositions.length
        : 3;

      if (avgHealthFactor < 2.0) {
        recommendations.push({
          id: 'volatility-warning',
          priority: 'insight',
          title: `High market volatility detected`,
          description: `Market volatility is elevated. Consider increasing health factor above 2.0 for safety.`,
          impact: {
            type: 'risk_reduction',
            value: 'Protect from volatility',
          },
        });
      }
    }
  }

  /**
   * Generate insights
   */
  private generateInsights(portfolio: PortfolioData, healthScore: HealthScore) {
    const percentile = this.calculatePercentile(healthScore.overall);

    let message = '';
    if (percentile >= 80) {
      message = `Excellent! Your portfolio is healthier than ${percentile}% of users. Keep it up!`;
    } else if (percentile >= 60) {
      message = `Good job! Your portfolio outperforms ${percentile}% of users. Some room for improvement.`;
    } else if (percentile >= 40) {
      message = `Your portfolio is performing better than ${percentile}% of users. Consider the recommendations below.`;
    } else {
      message = `Attention needed. Your portfolio needs optimization to reduce risks.`;
    }

    return {
      totalValue: portfolio.totalValue,
      positionCount: portfolio.positions.length,
      protocolCount: new Set(portfolio.positions.map(p => p.protocol)).size,
      compared: {
        percentile,
        message,
      },
    };
  }

  /**
   * Helper functions
   */

  private getScoreLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  private getAverageVolatility(portfolio: PortfolioData): number {
    const volatilities = Object.values(portfolio.marketData).map(d => d.volatility);
    return volatilities.length > 0
      ? volatilities.reduce((s, v) => s + v, 0) / volatilities.length
      : 0;
  }

  private getProtocolDistribution(portfolio: PortfolioData): Record<string, number> {
    const distribution: Record<string, number> = {};
    const total = portfolio.totalValue || 1;

    portfolio.positions.forEach(position => {
      distribution[position.protocol] = (distribution[position.protocol] || 0) + position.value / total;
    });

    return distribution;
  }

  private calculatePercentile(score: number): number {
    // Simulate based on normal distribution
    // Mean: 65, StdDev: 15
    const mean = 65;
    const stdDev = 15;
    const z = (score - mean) / stdDev;

    // Simplified normal distribution CDF
    const percentile = Math.round(50 + 34 * Math.tanh(z / 1.5));

    return Math.min(99, Math.max(1, percentile));
  }

  private prioritizeRecommendations(recommendations: Recommendation[]): Recommendation[] {
    const priorityOrder = { urgent: 0, opportunity: 1, insight: 2 };

    return recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Sort by ID for stability
      return a.id.localeCompare(b.id);
    });
  }
}

// Export singleton instance
export const enhancedMockAI = new EnhancedMockAI();
