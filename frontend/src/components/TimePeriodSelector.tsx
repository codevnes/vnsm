'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

type TimePeriod = '1m' | '3m' | '6m' | '1y' | '3y' | '5y' | 'all';

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  selectedPeriod,
  onChange,
}) => {
  const periods: { value: TimePeriod; label: string }[] = [
    { value: '1m', label: '1 tháng' },
    { value: '3m', label: '3 tháng' },
    { value: '6m', label: '6 tháng' },
    { value: '1y', label: '1 năm' },
    { value: '3y', label: '3 năm' },
    { value: '5y', label: '5 năm' },
    { value: 'all', label: 'Tất cả' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Khoảng thời gian:</span>
      <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
        {periods.map((period) => (
          <button
            key={period.value}
            className={`px-2 py-1 text-xs ${
              selectedPeriod === period.value
                ? 'bg-primary text-white'
                : 'bg-background hover:bg-muted'
            }`}
            onClick={() => onChange(period.value)}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimePeriodSelector;