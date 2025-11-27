import { AnalysisResponse, PortfolioData } from '../types';
import { EnhancedMockAI } from './enhancedMockAI';

/**
 * AI Analyzer Interface
 */
export interface IAIAnalyzer {
  analyze(portfolio: PortfolioData): Promise<AnalysisResponse>;
}

/**
 * AI Analyzer Factory
 * Returns the rule-based analyzer instance
 */
export class AIAnalyzerFactory {
  static getAnalyzer(): IAIAnalyzer {
    return new EnhancedMockAI();
  }
}

/**
 * Default AI analyzer instance
 */
export const aiAnalyzer = AIAnalyzerFactory.getAnalyzer();

/**
 * Analyze portfolio using rule-based engine
 */
export async function analyzePortfolio(
  portfolio: PortfolioData
): Promise<AnalysisResponse> {
  return aiAnalyzer.analyze(portfolio);
}
