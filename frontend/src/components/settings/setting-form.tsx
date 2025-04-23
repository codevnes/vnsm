import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settingSchema, SettingFormValues } from '@/lib/schemas/settingSchema';
import { Setting } from '@/types/setting';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SettingFormProps {
  onSubmit: (values: SettingFormValues) => void;
  isLoading: boolean;
  initialValues?: Partial<Setting>;
  submitButtonText?: string;
  isEditing?: boolean;
}

export function SettingForm({
  onSubmit,
  isLoading,
  initialValues,
  submitButtonText = 'Save Settings',
  isEditing = false,
}: SettingFormProps) {
  const form = useForm<SettingFormValues>({
    resolver: zodResolver(settingSchema),
    defaultValues: {
      key: initialValues?.key || '',
      value: initialValues?.value || '',
      description: initialValues?.description || '',
      type: initialValues?.type || 'text',
    },
  });

  // Form preset settings types
  const settingTypes = [
    { label: 'Text', value: 'text' },
    { label: 'JSON', value: 'json' },
    { label: 'HTML', value: 'html' },
    { label: 'Image', value: 'image' },
    { label: 'Link', value: 'link' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key</FormLabel>
              <FormControl>
                <Input 
                  placeholder="setting_key" 
                  {...field} 
                  disabled={isEditing} // Disable key field when editing
                />
              </FormControl>
              <FormDescription>
                A unique identifier for this setting (e.g., site_address, logo_url)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {settingTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The type of setting determines how it's displayed and validated
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value</FormLabel>
              <FormControl>
                {form.watch('type') === 'json' || form.watch('type') === 'html' ? (
                  <Textarea
                    placeholder="Enter value..."
                    className="min-h-[150px]"
                    {...field}
                  />
                ) : (
                  <Input placeholder="Enter value..." {...field} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this setting is used for..."
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : submitButtonText}
        </Button>
      </form>
    </Form>
  );
} 