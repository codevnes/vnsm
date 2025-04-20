'use client';

import React, { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import "react-datepicker/dist/react-datepicker.css";

export interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className,
  disabled = false,
  minDate,
  maxDate,
  ...props
}: DatePickerProps) {

  // Custom Input component for the DatePicker
  const CustomInput = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
    ({ value, onClick }, ref) => (
      <Button
        ref={ref}
        variant="outline"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value || placeholder}
      </Button>
    )
  );
  
  CustomInput.displayName = "DatePickerCustomInput";

  return (
    <ReactDatePicker
      selected={value}
      onChange={onChange}
      customInput={<CustomInput />}
      dateFormat="yyyy-MM-dd"
      minDate={minDate}
      maxDate={maxDate}
      disabled={disabled}
      placeholderText={placeholder}
      className="w-full"
      {...props}
    />
  );
}

export interface DatePickerInputProps {
  value: Date | null | string;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'Select date',
  className,
  disabled = false,
  minDate,
  maxDate,
  ...props
}: DatePickerInputProps) {
  // Convert string date to Date object if needed
  const dateValue = typeof value === 'string' && value 
    ? new Date(value) 
    : (value instanceof Date ? value : null);

  // Custom Input component for the DatePicker
  const CustomInput = forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<'input'>>(
    ({ value, onChange, onFocus, ...props }, ref) => (
      <div className="relative">
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={ref}
          value={value as string}
          onChange={onChange}
          onFocus={onFocus}
          className={cn("pl-10", className)}
          {...props}
        />
      </div>
    )
  );
  
  CustomInput.displayName = "DatePickerInputCustomInput";

  return (
    <ReactDatePicker
      selected={dateValue}
      onChange={onChange}
      customInput={<CustomInput />}
      dateFormat="yyyy-MM-dd"
      minDate={minDate}
      maxDate={maxDate}
      disabled={disabled}
      placeholderText={placeholder}
      className="w-full"
      {...props}
    />
  );
} 