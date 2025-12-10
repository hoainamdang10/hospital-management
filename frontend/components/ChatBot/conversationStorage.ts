/**
 * Conversation Storage
 * Lưu trữ conversation vào localStorage để không mất khi refresh
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

export interface StoredMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;  // ISO string for serialization
    feedback?: 'positive' | 'negative';
    messageId?: string;
}

export interface ConversationData {
    messages: StoredMessage[];
    lastUpdated: string;
    sessionId: string;
}

const STORAGE_KEY = 'hospital_chatbot_conversation';
const MAX_MESSAGES = 50;  // Giới hạn số tin nhắn lưu trữ
const EXPIRY_HOURS = 24;  // Xóa conversation sau 24 giờ không hoạt động

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if conversation expired
 */
function isExpired(lastUpdated: string): boolean {
    const lastTime = new Date(lastUpdated).getTime();
    const now = Date.now();
    const expiryMs = EXPIRY_HOURS * 60 * 60 * 1000;
    return now - lastTime > expiryMs;
}

/**
 * Lưu conversation vào localStorage
 */
export function saveConversation(messages: StoredMessage[], sessionId?: string): void {
    try {
        const data: ConversationData = {
            messages: messages.slice(-MAX_MESSAGES),  // Giữ lại MAX_MESSAGES tin nhắn gần nhất
            lastUpdated: new Date().toISOString(),
            sessionId: sessionId || generateSessionId(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.warn('[ChatBot Storage] Failed to save conversation:', error);
    }
}

/**
 * Lấy conversation từ localStorage
 */
export function loadConversation(): ConversationData | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const data: ConversationData = JSON.parse(stored);

        // Check expiry
        if (isExpired(data.lastUpdated)) {
            clearConversation();
            return null;
        }

        return data;
    } catch (error) {
        console.warn('[ChatBot Storage] Failed to load conversation:', error);
        return null;
    }
}

/**
 * Xóa conversation khỏi localStorage
 */
export function clearConversation(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.warn('[ChatBot Storage] Failed to clear conversation:', error);
    }
}

/**
 * Cập nhật feedback cho một message
 */
export function updateMessageFeedback(
    messageId: string,
    feedback: 'positive' | 'negative'
): void {
    try {
        const data = loadConversation();
        if (!data) return;

        const messageIndex = data.messages.findIndex((m) => m.messageId === messageId);
        if (messageIndex !== -1) {
            data.messages[messageIndex].feedback = feedback;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    } catch (error) {
        console.warn('[ChatBot Storage] Failed to update feedback:', error);
    }
}

/**
 * Convert từ component Message sang StoredMessage
 */
export function toStoredMessage(
    message: { role: 'user' | 'assistant'; content: string; timestamp: Date },
    messageId?: string
): StoredMessage {
    return {
        role: message.role,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
        messageId: messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
}

/**
 * Convert từ StoredMessage sang component Message
 */
export function fromStoredMessage(stored: StoredMessage): {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    messageId: string;
    feedback?: 'positive' | 'negative';
} {
    return {
        role: stored.role,
        content: stored.content,
        timestamp: new Date(stored.timestamp),
        messageId: stored.messageId || `msg_${Date.now()}`,
        feedback: stored.feedback,
    };
}

/**
 * Lấy session ID hiện tại hoặc tạo mới
 */
export function getOrCreateSessionId(): string {
    const data = loadConversation();
    if (data?.sessionId) {
        return data.sessionId;
    }
    return generateSessionId();
}
