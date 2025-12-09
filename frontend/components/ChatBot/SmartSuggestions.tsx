/**
 * SmartSuggestions Component
 * Hiển thị gợi ý thông minh dựa trên context của trang
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { getSuggestionsForPage } from './suggestionsConfig';
import type { Suggestion } from './types';

interface SmartSuggestionsProps {
    /** Đường dẫn trang hiện tại */
    pagePath: string;
    /** Dữ liệu context của trang */
    contextData?: Record<string, any>;
    /** Callback khi click vào gợi ý mở chatbot */
    onOpenChat?: (message: string) => void;
    /** Callback khi thực hiện function */
    onCallFunction?: (functionName: string, data?: any) => void;
    /** Custom class cho container */
    className?: string;
    /** Tiêu đề section */
    title?: string;
    /** Compact mode - hiển thị ít hơn */
    compact?: boolean;
}

/**
 * Variant colors cho từng loại suggestion
 */
const variantStyles: Record<string, string> = {
    primary:
        'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/20',
    success:
        'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20',
    warning:
        'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/20',
    danger:
        'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-lg shadow-red-500/20',
    neutral:
        'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm',
};

/**
 * SmartSuggestions Component
 * Hiển thị 2-4 gợi ý dựa trên trang hiện tại
 */
export function SmartSuggestions({
    pagePath,
    contextData,
    onOpenChat,
    onCallFunction,
    className = '',
    title = 'AI gợi ý cho bạn',
    compact = false,
}: SmartSuggestionsProps) {
    const router = useRouter();
    const suggestions = getSuggestionsForPage(pagePath, contextData);

    // Không hiển thị nếu không có suggestions
    if (!suggestions || suggestions.length === 0) {
        return null;
    }

    // Compact mode: chỉ hiển thị 2 suggestions
    const displaySuggestions = compact ? suggestions.slice(0, 2) : suggestions;

    /**
     * Xử lý click vào suggestion
     */
    const handleClick = (suggestion: Suggestion) => {
        switch (suggestion.actionType) {
            case 'redirect':
                if (suggestion.target) {
                    router.push(suggestion.target);
                }
                break;

            case 'openChat':
                if (onOpenChat && suggestion.target) {
                    onOpenChat(suggestion.target);
                }
                break;

            case 'callFunction':
                if (onCallFunction && suggestion.target) {
                    onCallFunction(suggestion.target, contextData);
                }
                break;

            case 'external':
                if (suggestion.target) {
                    window.open(suggestion.target, '_blank');
                }
                break;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50/80 to-white p-4 ${className}`}
        >
            {/* Header */}
            <div className="mb-3 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
            </div>

            {/* Suggestions Grid */}
            <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
                {displaySuggestions.map((suggestion, index) => (
                    <motion.button
                        key={suggestion.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleClick(suggestion)}
                        className={`flex flex-col items-center justify-center rounded-xl p-3 text-center transition-all ${variantStyles[suggestion.variant || 'neutral']
                            }`}
                    >
                        <span className="text-2xl">{suggestion.icon}</span>
                        <span className="mt-1.5 text-xs font-medium leading-tight">{suggestion.label}</span>
                        {!compact && suggestion.description && (
                            <span
                                className={`mt-0.5 text-[10px] leading-tight ${suggestion.variant === 'neutral' ? 'text-gray-500' : 'text-white/80'
                                    }`}
                            >
                                {suggestion.description}
                            </span>
                        )}
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}

export default SmartSuggestions;
