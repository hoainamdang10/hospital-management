'use client';

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Minimize2, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import type { ChatBotProps } from './ChatBot/types';
import { getContextualWelcomeMessage } from './ChatBot/contextPromptBuilder';
import { getQuickReplies, shouldShowQuickReplies } from './ChatBot/quickRepliesConfig';
import { FeedbackButtons } from './ChatBot/FeedbackButtons';
import { QuickReplies } from './ChatBot/QuickReplies';
import {
  saveConversation,
  loadConversation,
  clearConversation,
  toStoredMessage,
  fromStoredMessage,
  updateMessageFeedback,
  getOrCreateSessionId,
  type StoredMessage,
} from './ChatBot/conversationStorage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageId: string;
  feedback?: 'positive' | 'negative';
}

/**
 * ChatBot Handle interface for imperative control
 */
export interface ChatBotHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  sendMessage: (message: string) => void;
  openWithMessage: (message: string) => void;
}

/**
 * ChatBot Component with Context Awareness
 * 
 * Features:
 * - Context-aware responses based on current page
 * - Conversation persistence via localStorage
 * - Quick Replies for follow-up suggestions
 * - Feedback buttons (👍/👎) for AI responses
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */
const ChatBot = forwardRef<ChatBotHandle, ChatBotProps>(function ChatBot(
  { context, onAction: _onAction, initialMessage },
  ref
) {
  // Note: onAction is reserved for future use (e.g., navigate, cancel appointment)
  void _onAction;
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  // Generate unique message ID
  const generateMessageId = useCallback(() => {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // Load conversation from localStorage on mount
  useEffect(() => {
    if (!hasInitialized) {
      const stored = loadConversation();
      const sid = getOrCreateSessionId();
      setSessionId(sid);

      if (stored && stored.messages.length > 0) {
        // Restore previous conversation
        const restoredMessages = stored.messages.map(fromStoredMessage);
        setMessages(restoredMessages);
      } else {
        // Initialize with welcome message
        const welcomeMessage = getContextualWelcomeMessage(context);
        setMessages([
          {
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date(),
            messageId: generateMessageId(),
          },
        ]);
      }
      setHasInitialized(true);
    }
  }, [context, hasInitialized, generateMessageId]);

  // Save conversation to localStorage whenever messages change
  useEffect(() => {
    if (hasInitialized && messages.length > 0) {
      const storedMessages: StoredMessage[] = messages.map((msg) =>
        toStoredMessage(msg, msg.messageId)
      );
      // Preserve feedback when saving
      storedMessages.forEach((stored, index) => {
        if (messages[index].feedback) {
          stored.feedback = messages[index].feedback;
        }
      });
      saveConversation(storedMessages, sessionId);
    }
  }, [messages, hasInitialized, sessionId]);

  // Update welcome message when context data changes (e.g., invoice loads)
  // Only update if we still have just the welcome message (no conversation yet)
  const contextDataKey = context?.data
    ? JSON.stringify({
      page: context.page,
      amount: (context.data as any)?.outstandingAmount || (context.data as any)?.totalAmount,
      status: (context.data as any)?.paymentStatus,
    })
    : '';

  useEffect(() => {
    if (hasInitialized && messages.length === 1 && contextDataKey) {
      const welcomeMessage = getContextualWelcomeMessage(context);
      if (messages[0].content !== welcomeMessage) {
        setMessages([
          {
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date(),
            messageId: generateMessageId(),
          },
        ]);
      }
    }
  }, [contextDataKey, context, hasInitialized, messages, generateMessageId]);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);

  // Handle initial message (from SmartSuggestions)
  useEffect(() => {
    if (initialMessage && isOpen && !isLoading) {
      setInput(initialMessage);
    }
  }, [initialMessage, isOpen, isLoading]);

  // Handle feedback
  const handleFeedback = useCallback((messageId: string, feedback: 'positive' | 'negative') => {
    setMessages((prev) =>
      prev.map((msg) => (msg.messageId === messageId ? { ...msg, feedback } : msg))
    );
    updateMessageFeedback(messageId, feedback);

    // Log feedback for analytics (can be sent to backend later)
    console.log('[ChatBot] Feedback received:', { messageId, feedback });
  }, []);

  // Handle quick reply selection
  const handleQuickReply = useCallback((message: string) => {
    setInput(message);
    setTimeout(() => {
      handleSend(message);
    }, 100);
  }, []);

  // Clear conversation
  const handleClearConversation = useCallback(() => {
    clearConversation();
    const welcomeMessage = getContextualWelcomeMessage(context);
    setMessages([
      {
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
        messageId: generateMessageId(),
      },
    ]);
  }, [context, generateMessageId]);

  // Imperative handle for external control
  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
    sendMessage: (message: string) => {
      setInput(message);
      // Trigger send after state update
      setTimeout(() => {
        handleSend(message);
      }, 0);
    },
    openWithMessage: (message: string) => {
      setIsOpen(true);
      setIsMinimized(false);
      setInput(message);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    },
  }));

  // Hide chatbot on appointment detail pages where there is a doctor-patient chat
  // But keep it on booking and payment-pending pages
  const shouldHide =
    pathname?.startsWith('/patient/appointments/') &&
    !pathname.includes('/book') &&
    !pathname.includes('/payment-pending') &&
    // Check if it's a UUID path (appointment detail)
    /\/patient\/appointments\/[a-f0-9-]{36}$/i.test(pathname || '');

  if (shouldHide) {
    return null;
  }

  const handleSend = async (messageOverride?: string) => {
    const messageToSend = messageOverride || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
      messageId: generateMessageId(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          userId: user?.id || user?.userId || null,
          patientId: user?.patientId || null,
          // Pass context to API for dynamic prompt
          context: context
            ? {
              page: context.page,
              data: context.data,
            }
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(
          errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Check if response has message
      if (!data.message) {
        console.error('Invalid API response:', data);
        throw new Error('API không trả về message');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        messageId: generateMessageId(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Xin lỗi, đã có lỗi xảy ra: ${error instanceof Error ? error.message : 'Unknown error'}. Vui lòng thử lại sau.`,
        timestamp: new Date(),
        messageId: generateMessageId(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get quick replies for the last assistant message
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const quickReplies =
    lastAssistantMessage && shouldShowQuickReplies(lastAssistantMessage.content)
      ? getQuickReplies(lastAssistantMessage.content)
      : [];

  return (
    <>
      {/* Chat Button - Floating */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed right-6 bottom-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-2xl transition-all hover:shadow-blue-500/50"
          >
            <MessageCircle className="h-7 w-7" />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
              <Sparkles className="h-3 w-3" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 60 : 600,
            }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-6 bottom-6 z-50 flex w-[400px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
            style={{ maxHeight: isMinimized ? '60px' : '600px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bot className="h-6 w-6" />
                  <span className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
                </div>
                <div>
                  <h3 className="font-semibold">AI Assistant</h3>
                  <p className="text-xs opacity-90">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Clear conversation button */}
                <button
                  onClick={handleClearConversation}
                  className="rounded-full p-1 transition-colors hover:bg-white/20"
                  title="Xóa cuộc trò chuyện"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="rounded-full p-1 transition-colors hover:bg-white/20"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 transition-colors hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            {!isMinimized && (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-800/50">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.messageId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                      <div
                        className={`flex max-w-[80%] gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                          }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                            }`}
                        >
                          {message.role === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>

                        {/* Message Bubble */}
                        <div>
                          <div
                            className={`rounded-2xl px-4 py-2 ${message.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-800 shadow-md dark:bg-gray-700 dark:text-gray-100'
                              }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                            <p
                              className={`mt-1 text-xs ${message.role === 'user'
                                  ? 'text-blue-100'
                                  : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                              {message.timestamp.toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>

                          {/* Feedback buttons for assistant messages */}
                          {message.role === 'assistant' && index > 0 && (
                            <FeedbackButtons
                              messageId={message.messageId}
                              onFeedback={handleFeedback}
                              initialFeedback={message.feedback}
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-md dark:bg-gray-700">
                        <Bot className="h-4 w-4 text-purple-500" />
                        <div className="flex gap-1">
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-purple-500"
                            style={{ animationDelay: '0ms' }}
                          ></span>
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-purple-500"
                            style={{ animationDelay: '150ms' }}
                          ></span>
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-purple-500"
                            style={{ animationDelay: '300ms' }}
                          ></span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Quick Replies */}
                  {!isLoading && quickReplies.length > 0 && (
                    <QuickReplies
                      replies={quickReplies}
                      onSelect={handleQuickReply}
                      disabled={isLoading}
                    />
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập tin nhắn..."
                      rows={1}
                      disabled={isLoading}
                      className="flex-1 resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      style={{ maxHeight: '120px' }}
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isLoading}
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white transition-all hover:shadow-lg hover:shadow-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Nhấn <kbd className="rounded bg-gray-200 px-1 dark:bg-gray-700">Enter</kbd> để
                    gửi
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default ChatBot;
