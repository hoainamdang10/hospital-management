/**
 * Feedback Buttons Component
 * Nút 👍/👎 để thu thập phản hồi từ user về response của AI
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';

interface FeedbackButtonsProps {
    messageId: string;
    onFeedback: (messageId: string, feedback: 'positive' | 'negative') => void;
    initialFeedback?: 'positive' | 'negative';
}

export function FeedbackButtons({
    messageId,
    onFeedback,
    initialFeedback,
}: FeedbackButtonsProps) {
    const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(
        initialFeedback || null
    );
    const [showThanks, setShowThanks] = useState(false);

    const handleFeedback = (type: 'positive' | 'negative') => {
        if (feedback) return; // Already submitted

        setFeedback(type);
        onFeedback(messageId, type);
        setShowThanks(true);

        // Hide thanks message after 2 seconds
        setTimeout(() => {
            setShowThanks(false);
        }, 2000);
    };

    return (
        <div className="mt-2 flex items-center gap-1">
            <AnimatePresence mode="wait">
                {showThanks ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"
                    >
                        <Check className="h-3 w-3" />
                        <span>Cảm ơn phản hồi!</span>
                    </motion.div>
                ) : feedback ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1"
                    >
                        <span
                            className={`rounded-full p-1 ${feedback === 'positive'
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                }`}
                        >
                            {feedback === 'positive' ? (
                                <ThumbsUp className="h-3 w-3" />
                            ) : (
                                <ThumbsDown className="h-3 w-3" />
                            )}
                        </span>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1"
                    >
                        <button
                            onClick={() => handleFeedback('positive')}
                            className="group rounded-full p-1 text-gray-400 transition-all hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400"
                            title="Phản hồi hữu ích"
                        >
                            <ThumbsUp className="h-3 w-3 transition-transform group-hover:scale-110" />
                        </button>
                        <button
                            onClick={() => handleFeedback('negative')}
                            className="group rounded-full p-1 text-gray-400 transition-all hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                            title="Phản hồi chưa hữu ích"
                        >
                            <ThumbsDown className="h-3 w-3 transition-transform group-hover:scale-110" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default FeedbackButtons;
