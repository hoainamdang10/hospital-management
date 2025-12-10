/**
 * ChatBot Module Exports
 * Re-export all ChatBot related components and utilities
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

// Components
export { default as SmartSuggestions } from './SmartSuggestions';
export { default as QuickReplies } from './QuickReplies';
export { default as FeedbackButtons } from './FeedbackButtons';

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
    DashboardContext,
    GenericContext,
} from './types';

export type { QuickReply } from './quickRepliesConfig';
export type { StoredMessage, ConversationData } from './conversationStorage';

// Utilities
export { buildDynamicSystemPrompt, getContextualWelcomeMessage } from './contextPromptBuilder';
export { getSuggestionsForPage, SUGGESTIONS_CONFIG, DEFAULT_SUGGESTIONS } from './suggestionsConfig';
export { getQuickReplies, shouldShowQuickReplies } from './quickRepliesConfig';
export {
    saveConversation,
    loadConversation,
    clearConversation,
    updateMessageFeedback,
    toStoredMessage,
    fromStoredMessage,
    getOrCreateSessionId,
} from './conversationStorage';
