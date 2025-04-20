'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

type TimePeriod = '3m' | '6m' | '1y' | '5y';

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  selectedPeriod,
  onChange
}) => {
  const periods: { value: TimePeriod; label: string }[] = [
    { value: '3m', label: '3 tháng' },
    { value: '6m', label: '6 tháng' },
    { value: '1y', label: '1 năm' },
    { value: '5y', label: '5 năm' }
  ];

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={selectedPeriod === period.value ? 'default' : 'outline'}
          size="sm"
          className={
            selectedPeriod === period.value 
              ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent' 
              : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
          onClick={() => onChange(period.value)}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
};

export default TimePeriodSelector;
