/**
 * ChatBot Module Exports
 * Re-export all ChatBot related components and utilities
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

// Components
export { default as SmartSuggestions } from './SmartSuggestions';

// Types
export type {
    ChatContext,
    ChatBotProps,
    ChatBotAction,
    ChatMessage,
    Suggestion,
    SuggestionActionType,
    PaymentPendingContext,
    AppointmentsListContext,
    AppointmentDetailContext,
    BillingContext,
    GenericContext,
} from './types';

// Utilities
export { buildDynamicSystemPrompt, getContextualWelcomeMessage } from './contextPromptBuilder';
export { getSuggestionsForPage, SUGGESTIONS_CONFIG, DEFAULT_SUGGESTIONS } from './suggestionsConfig';
