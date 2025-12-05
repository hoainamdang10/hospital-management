'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// Mini Ring/Donut Chart Component
// ============================================
interface MiniRingChartProps {
    value: number;
    maxValue: number;
    color: string;
    size?: number;
    strokeWidth?: number;
}

export function MiniRingChart({
    value,
    maxValue,
    color,
    size = 48,
    strokeWidth = 5
}: MiniRingChartProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min((value / maxValue) * 100, 100);
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="rotate-[-90deg]">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-slate-100"
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                />
            </svg>
            {/* Center value */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs font-bold text-slate-700"
                >
                    {value}
                </motion.span>
            </div>
        </div>
    );
}

// ============================================
// Mini Bar Chart Component (Sparkline style)
// ============================================
interface MiniBarChartProps {
    data: number[];
    color: string;
    height?: number;
}

export function MiniBarChart({ data, color, height = 40 }: MiniBarChartProps) {
    const maxValue = Math.max(...data, 1);
    const barWidth = 100 / data.length;

    return (
        <div className="flex items-end gap-0.5" style={{ height }}>
            {data.map((value, index) => {
                const barHeight = (value / maxValue) * 100;
                return (
                    <motion.div
                        key={index}
                        className="flex-1 rounded-t-sm"
                        style={{ backgroundColor: color }}
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeight}%` }}
                        transition={{
                            duration: 0.5,
                            delay: index * 0.05,
                            ease: 'easeOut'
                        }}
                    />
                );
            })}
        </div>
    );
}

// ============================================
// Mini Area Chart Component (Sparkline style)
// ============================================
interface MiniAreaChartProps {
    data: number[];
    color: string;
    gradientId: string;
    height?: number;
    width?: number;
}

export function MiniAreaChart({
    data,
    color,
    gradientId,
    height = 40,
    width = 100
}: MiniAreaChartProps) {
    const maxValue = Math.max(...data, 1);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - minValue) / range) * (height - 8);
        return `${x},${y}`;
    }).join(' ');

    const areaPath = `M0,${height} L${points} L${width},${height} Z`;
    const linePath = `M${points}`;

    return (
        <svg width={width} height={height} className="overflow-visible">
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                </linearGradient>
            </defs>

            {/* Area fill */}
            <motion.path
                d={areaPath}
                fill={`url(#${gradientId})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            />

            {/* Line */}
            <motion.polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
            />

            {/* End point dot */}
            <motion.circle
                cx={width}
                cy={height - ((data[data.length - 1] - minValue) / range) * (height - 8)}
                r="3"
                fill={color}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, duration: 0.3 }}
            />
        </svg>
    );
}

// ============================================
// Animated Progress Ring (for percentage)
// ============================================
interface ProgressRingProps {
    percentage: number;
    color: string;
    bgColor?: string;
    size?: number;
    strokeWidth?: number;
    showLabel?: boolean;
}

export function ProgressRing({
    percentage,
    color,
    bgColor = '#e2e8f0',
    size = 56,
    strokeWidth = 6,
    showLabel = true
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="rotate-[-90deg]">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={bgColor}
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle with gradient effect */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                />
            </svg>
            {showLabel && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-sm font-bold"
                        style={{ color }}
                    >
                        {percentage}%
                    </motion.span>
                </div>
            )}
        </div>
    );
}

// ============================================
// Enhanced Stat Card with Chart
// ============================================
interface ChartStatCardProps {
    title: string;
    subtitle?: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    chartType: 'ring' | 'bar' | 'area' | 'progress';
    chartData?: number[];
    chartValue?: number;
    chartMaxValue?: number;
    color: 'emerald' | 'teal' | 'amber' | 'cyan';
    isLoading?: boolean;
}

const colorMap = {
    emerald: {
        primary: '#10b981',
        light: '#d1fae5',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        gradient: 'from-emerald-500 to-teal-500',
    },
    teal: {
        primary: '#14b8a6',
        light: '#ccfbf1',
        bg: 'bg-teal-50',
        text: 'text-teal-600',
        gradient: 'from-teal-500 to-cyan-500',
    },
    amber: {
        primary: '#f59e0b',
        light: '#fef3c7',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        gradient: 'from-amber-500 to-orange-500',
    },
    cyan: {
        primary: '#06b6d4',
        light: '#cffafe',
        bg: 'bg-cyan-50',
        text: 'text-cyan-600',
        gradient: 'from-cyan-500 to-blue-500',
    },
};

export function ChartStatCard({
    title,
    subtitle,
    value,
    icon: Icon,
    chartType,
    chartData = [3, 5, 2, 8, 4, 6, 7],
    chartValue = 0,
    chartMaxValue = 100,
    color,
    isLoading = false,
}: ChartStatCardProps) {
    const colors = colorMap[color];

    const renderChart = () => {
        switch (chartType) {
            case 'ring':
                return (
                    <MiniRingChart
                        value={chartValue}
                        maxValue={chartMaxValue}
                        color={colors.primary}
                        size={52}
                    />
                );
            case 'bar':
                return (
                    <div className="w-20">
                        <MiniBarChart data={chartData} color={colors.primary} height={36} />
                    </div>
                );
            case 'area':
                return (
                    <MiniAreaChart
                        data={chartData}
                        color={colors.primary}
                        gradientId={`gradient-${color}`}
                        height={36}
                        width={80}
                    />
                );
            case 'progress':
                return (
                    <ProgressRing
                        percentage={chartValue}
                        color={colors.primary}
                        size={52}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.1)' }}
            className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-md transition-all cursor-pointer"
        >
            {/* Subtle gradient background on hover */}
            <div className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br',
                colors.bg
            )} />

            <div className="relative flex items-center justify-between">
                {/* Left: Text content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={cn(
                            'p-1.5 rounded-lg transition-all duration-300',
                            colors.bg,
                            'group-hover:bg-gradient-to-br',
                            colors.gradient
                        )}>
                            <Icon className={cn(
                                'h-4 w-4 transition-colors',
                                colors.text,
                                'group-hover:text-white'
                            )} />
                        </div>
                        <p className="text-sm font-medium text-slate-600 truncate">{title}</p>
                    </div>

                    {isLoading ? (
                        <Loader2 className="mt-2 h-7 w-7 animate-spin text-slate-300" />
                    ) : (
                        <>
                            <motion.h3
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-2xl font-bold tracking-tight text-slate-900"
                            >
                                {value}
                            </motion.h3>
                            {subtitle && (
                                <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
                            )}
                        </>
                    )}
                </div>

                {/* Right: Chart */}
                <div className="flex-shrink-0 ml-4">
                    {!isLoading && renderChart()}
                </div>
            </div>
        </motion.div>
    );
}
