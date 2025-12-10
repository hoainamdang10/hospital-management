/**
 * Quick Replies Component
 * Hiển thị các gợi ý follow-up sau khi AI trả lời
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

'use client';

import { motion } from 'framer-motion';
import type { QuickReply } from './quickRepliesConfig';

interface QuickRepliesProps {
    replies: QuickReply[];
    onSelect: (message: string) => void;
    disabled?: boolean;
}

export function QuickReplies({ replies, onSelect, disabled }: QuickRepliesProps) {
    if (!replies || replies.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 flex flex-wrap justify-start gap-2"
        >
            {replies.map((reply, index) => (
                <motion.button
                    key={reply.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect(reply.message)}
                    disabled={disabled}
                    className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-all hover:border-blue-400 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/50"
                >
                    {reply.icon && <span>{reply.icon}</span>}
                    <span>{reply.label}</span>
                </motion.button>
            ))}
        </motion.div>
    );
}

export default QuickReplies;
