import { AnalysisResponse, PortfolioData } from '../types';
import { EnhancedMockAI } from './enhancedMockAI';

/**
 * Portfolio Analyzer Interface
 */
export interface IPortfolioAnalyzer {
  analyze(portfolio: PortfolioData): Promise<AnalysisResponse>;
}

/**
 * Portfolio Analyzer Factory
 * Returns the analysis engine instance
 */
export class PortfolioAnalyzerFactory {
  static getAnalyzer(): IPortfolioAnalyzer {
    return new EnhancedMockAI();
  }
}

/**
 * Default portfolio analyzer instance
 */
export const portfolioAnalyzer = PortfolioAnalyzerFactory.getAnalyzer();

/**
 * Analyze portfolio using rule-based engine
 */
export async function analyzePortfolio(
  portfolio: PortfolioData
): Promise<AnalysisResponse> {
  return portfolioAnalyzer.analyze(portfolio);
}
