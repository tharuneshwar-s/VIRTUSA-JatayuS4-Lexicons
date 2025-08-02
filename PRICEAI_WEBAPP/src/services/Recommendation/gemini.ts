import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  generateCompareProvidersPrompt, 
  generateSingleProviderPrompt,
  CompareProvidersPromptData,
  SingleProviderPromptData
} from "./prompts";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export interface RecommendationResult {
  success: boolean;
  data?: string;
  error?: string;
}

/**
 * Generate recommendations for comparing multiple providers
 */
export const generateCompareProvidersRecommendation = async (
  promptData: CompareProvidersPromptData
): Promise<RecommendationResult> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = generateCompareProvidersPrompt(promptData);
    
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    
    if (!text) {
      return {
        success: false,
        error: "No recommendation generated"
      };
    }
    
    return {
      success: true,
      data: text
    };
  } catch (error) {
    console.error("Error generating compare providers recommendation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

/**
 * Generate recommendations for a single provider
 */
export const generateSingleProviderRecommendation = async (
  promptData: SingleProviderPromptData
): Promise<RecommendationResult> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = generateSingleProviderPrompt(promptData);
    
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    
    if (!text) {
      return {
        success: false,
        error: "No recommendation generated"
      };
    }
    
    return {
      success: true,
      data: text
    };
  } catch (error) {
    console.error("Error generating single provider recommendation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

/**
 * Generic Gemini AI call for custom prompts
 */
export const generateCustomRecommendation = async (
  customPrompt: string
): Promise<RecommendationResult> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent(customPrompt);
    const text = await result.response.text();
    
    if (!text) {
      return {
        success: false,
        error: "No recommendation generated"
      };
    }
    
    return {
      success: true,
      data: text
    };
  } catch (error) {
    console.error("Error generating custom recommendation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};
