'use client';

import { useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { Activity, Heart, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for health trends
const HEALTH_DATA = [
    { date: 'T1', sys: 118, dia: 78, heartRate: 72 },
    { date: 'T2', sys: 120, dia: 80, heartRate: 75 },
    { date: 'T3', sys: 115, dia: 76, heartRate: 70 },
    { date: 'T4', sys: 122, dia: 82, heartRate: 78 },
    { date: 'T5', sys: 119, dia: 79, heartRate: 74 },
    { date: 'T6', sys: 121, dia: 81, heartRate: 76 },
];

export function HealthTrendsChart() {
    const [activeMetric, setActiveMetric] = useState<'bp' | 'hr'>('bp');

    return (
        <div className="rounded-3xl border border-white/50 bg-white/60 p-6 shadow-xl backdrop-blur-xl">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-red-100 p-2">
                        <Activity className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Chỉ số sức khỏe</h2>
                        <p className="text-sm text-gray-500">Theo dõi 6 tháng gần nhất</p>
                    </div>
                </div>

                {/* Toggle Buttons */}
                <div className="flex rounded-lg bg-gray-100 p-1">
                    <button
                        onClick={() => setActiveMetric('bp')}
                        className={cn(
                            'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                            activeMetric === 'bp'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        <TrendingUp className="h-4 w-4" />
                        Huyết áp
                    </button>
                    <button
                        onClick={() => setActiveMetric('hr')}
                        className={cn(
                            'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                            activeMetric === 'hr'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        <Heart className="h-4 w-4" />
                        Nhịp tim
                    </button>
                </div>
            </div>

            {/* Chart Area */}
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={HEALTH_DATA}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                            itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        {activeMetric === 'bp' ? (
                            <>
                                <Area
                                    type="monotone"
                                    dataKey="sys"
                                    name="Tâm thu (mmHg)"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSys)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="dia"
                                    name="Tâm trương (mmHg)"
                                    stroke="#f97316"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorDia)"
                                />
                            </>
                        ) : (
                            <Area
                                type="monotone"
                                dataKey="heartRate"
                                name="Nhịp tim (BPM)"
                                stroke="#ec4899"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorHr)"
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Footer / Insights */}
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                <div className="mt-0.5">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-900">Chỉ số ổn định</p>
                    <p className="text-xs text-gray-500">
                        {activeMetric === 'bp'
                            ? 'Huyết áp của bạn đang ở mức bình thường trong 6 tháng qua.'
                            : 'Nhịp tim trung bình 75 BPM, rất tốt cho sức khỏe tim mạch.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
