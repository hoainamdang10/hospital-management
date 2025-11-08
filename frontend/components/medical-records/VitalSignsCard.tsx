'use client';

import { Activity, Heart, Thermometer, Weight, Ruler, Wind } from 'lucide-react';
import { VitalSigns } from '@/lib/types/medical-records';
import { calculateBMI, getBMIStatus, getVitalSignStatus } from '@/lib/api/medical-records.service';

interface VitalSignsCardProps {
  vitalSigns?: VitalSigns;
}

export function VitalSignsCard({ vitalSigns }: VitalSignsCardProps) {
  if (!vitalSigns) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
        Chưa có dữ liệu chỉ số sinh tồn
      </div>
    );
  }

  const bmi = vitalSigns.bmi || calculateBMI(vitalSigns.weight, vitalSigns.height);
  const bmiStatus = getBMIStatus(bmi);

  const vitalSignItems = [
    {
      icon: Heart,
      label: 'Huyết áp',
      value: vitalSigns.bloodPressure,
      unit: 'mmHg',
      status: getVitalSignStatus('bloodPressure', vitalSigns.bloodPressure),
    },
    {
      icon: Activity,
      label: 'Nhịp tim',
      value: vitalSigns.heartRate,
      unit: 'bpm',
      status: getVitalSignStatus('heartRate', vitalSigns.heartRate),
    },
    {
      icon: Thermometer,
      label: 'Nhiệt độ',
      value: vitalSigns.temperature,
      unit: '°C',
      status: getVitalSignStatus('temperature', vitalSigns.temperature),
    },
    {
      icon: Weight,
      label: 'Cân nặng',
      value: vitalSigns.weight,
      unit: 'kg',
      status: 'normal' as const,
    },
    {
      icon: Ruler,
      label: 'Chiều cao',
      value: vitalSigns.height,
      unit: 'cm',
      status: 'normal' as const,
    },
    {
      icon: Wind,
      label: 'SpO₂',
      value: vitalSigns.oxygenSaturation,
      unit: '%',
      status: getVitalSignStatus('oxygenSaturation', vitalSigns.oxygenSaturation),
    },
  ];

  const statusColors = {
    normal: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    critical: 'text-red-600 bg-red-50 border-red-200',
    unknown: 'text-gray-600 bg-gray-50 border-gray-200',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {vitalSignItems.map((item, index) => {
          if (!item.value) return null;

          const Icon = item.icon;
          const colorClass = statusColors[item.status];

          return (
            <div
              key={index}
              className={`border-2 rounded-xl p-4 ${colorClass} transition-all hover:shadow-md`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium opacity-80">{item.label}</p>
                  <p className="text-lg font-bold truncate">
                    {item.value} <span className="text-sm font-normal">{item.unit}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* BMI Card */}
      {bmi && (
        <div className={`border-2 rounded-xl p-4 ${
          bmiStatus.color === 'green' ? 'bg-green-50 border-green-200 text-green-800' :
          bmiStatus.color === 'yellow' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
          bmiStatus.color === 'red' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Chỉ số BMI</p>
              <p className="text-2xl font-bold">{bmi}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{bmiStatus.label}</p>
              <p className="text-xs opacity-80">
                {vitalSigns.weight}kg / {vitalSigns.height}cm
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
