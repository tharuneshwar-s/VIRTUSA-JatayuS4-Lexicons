// Export all recommendation services
export * from './prompts';
export * from './gemini';

// Re-export specific functions for easier imports
export { 
  generateCompareProvidersRecommendation,
  generateSingleProviderRecommendation,
  generateCustomRecommendation
} from './gemini';

export type {
  CompareProvidersPromptData,
  SingleProviderPromptData
} from './prompts';

export type {
  RecommendationResult
} from './gemini';
