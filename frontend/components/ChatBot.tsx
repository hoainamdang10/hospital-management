'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Minimize2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatBot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Xin chào! Tôi là AI Assistant của bệnh viện. Tôi có thể giúp bạn đặt lịch khám, tìm bác sĩ, hoặc xem lịch hẹn. Bạn cần hỗ trợ gì?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Hide chatbot on appointment detail pages where there is a doctor-patient chat
  // We want to keep it on the booking page (/patient/appointments/book)
  const isAppointmentDetail =
    pathname?.startsWith('/patient/appointments/') && !pathname.includes('/book');

  if (isAppointmentDetail) {
    return null;
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
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
          userId: user?.id || null,
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
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Xin lỗi, đã có lỗi xảy ra: ${error instanceof Error ? error.message : 'Unknown error'}. Vui lòng kiểm tra console để biết chi tiết.`,
        timestamp: new Date(),
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
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`flex max-w-[80%] gap-2 ${
                          message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                            message.role === 'user'
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
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-gray-800 shadow-md dark:bg-gray-700 dark:text-gray-100'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                          <p
                            className={`mt-1 text-xs ${
                              message.role === 'user'
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

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-end gap-2">
                    <textarea
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
                      onClick={handleSend}
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
}
