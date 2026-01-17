/**
 * AI Types and Interfaces
 * Issue 6: AI Integration (Read-Only Only)
 * 
 * AI SAFETY RULES:
 * - AI is READ-ONLY (no writes, no state transitions)
 * - AI requires explicit user action (no auto-execution)
 * - AI suggestions are non-authoritative (humans decide)
 * - AI must indicate confidence and refuse when uncertain
 * - All AI usage is audited
 */

/**
 * AI confidence levels
 */
export type AIConfidence = 'low' | 'medium' | 'high';

/**
 * AI response structure
 * 
 * MANDATORY FIELDS:
 * - suggestion: The AI output (may be null if refused)
 * - confidence: AI's confidence in the suggestion
 * - refused: Whether AI refused to answer
 * - reasoning: Why AI made this suggestion or refused
 */
export interface AIResponse<T = any> {
  suggestion: T | null;
  confidence: AIConfidence;
  refused: boolean;
  reasoning: string;
}

/**
 * Draft clinical note suggestion
 */
export interface DraftNoteSuggestion {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

/**
 * Lab result explanation
 */
export interface LabExplanation {
  summary: string;
  normalRange: string;
  significance: string;
  recommendations: string[];
}

/**
 * Diagnosis suggestion
 */
export interface DiagnosisSuggestion {
  diagnosis: string;
  reasoning: string;
  confidence: AIConfidence;
  recommendedTests: string[];
}

/**
 * AI context type (for audit logging)
 */
export type AIContextType = 
  | 'draft_note_generation'
  | 'lab_result_explanation'
  | 'diagnosis_suggestion';

/**
 * AI invocation metadata (for audit logging)
 */
export interface AIInvocationMetadata {
  contextType: AIContextType;
  confidence: AIConfidence;
  refused: boolean;
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * User action on AI suggestion (for audit logging)
 */
export type AIUserAction = 'accepted' | 'dismissed' | 'edited';
