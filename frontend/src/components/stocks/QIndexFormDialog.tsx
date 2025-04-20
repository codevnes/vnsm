'use client';

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from 'lucide-react';
import { StockQIndex, StockQIndexInput } from '@/types/stockQIndex';
import { Stock } from '@/types/stock';

// Define the form schema with validation
const qIndexSchema = z.object({
  date: z.string().min(1, { message: "Date is required" }),
  open: z.string().optional().nullable(),
  high: z.string().optional().nullable(),
  low: z.string().optional().nullable(),
  close: z.string().optional().nullable(),
  trend_q: z.string().optional().nullable(),
  fq: z.string().optional().nullable(),
  qv1: z.string().optional().nullable(),
  band_down: z.string().optional().nullable(),
  band_up: z.string().optional().nullable()
});

type QIndexFormValues = z.infer<typeof qIndexSchema>;

interface QIndexFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StockQIndexInput) => Promise<void>;
  initialData?: StockQIndex | null;
  stock: Stock;
  isSubmitting: boolean;
  formError?: string | null;
}

export const QIndexFormDialog: React.FC<QIndexFormDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  stock,
  isSubmitting,
  formError
}) => {
  // Format date to YYYY-MM-DD for input
  const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  // Convert string values to form values
  const getInitialValues = (): QIndexFormValues => {
    return {
      date: initialData ? formatDateForInput(initialData.date) : formatDateForInput(new Date().toISOString()),
      open: initialData?.open ?? '',
      high: initialData?.high ?? '',
      low: initialData?.low ?? '',
      close: initialData?.close ?? '',
      trend_q: initialData?.trend_q ?? '',
      fq: initialData?.fq ?? '',
      qv1: initialData?.qv1 ?? '',
      band_down: initialData?.band_down ?? '',
      band_up: initialData?.band_up ?? '',
    };
  };

  const form = useForm<QIndexFormValues>({
    resolver: zodResolver(qIndexSchema),
    defaultValues: getInitialValues(),
    values: getInitialValues(), // Re-initialize whenever initialData changes
  });

  const handleSubmit = async (data: QIndexFormValues) => {
    // Convert form values to API input with proper type conversions
    const qIndexData: StockQIndexInput = {
      stock_id: stock.id,
      date: data.date,
      open: data.open ? parseFloat(data.open) : null,
      high: data.high ? parseFloat(data.high) : null,
      low: data.low ? parseFloat(data.low) : null,
      close: data.close ? parseFloat(data.close) : null,
      trend_q: data.trend_q,
      fq: data.fq,
      qv1: data.qv1,
      band_down: data.band_down ? parseFloat(data.band_down) : null,
      band_up: data.band_up ? parseFloat(data.band_up) : null,
    };

    await onSubmit(qIndexData);
  };

  const isEditing = !!initialData;
  const title = isEditing ? "Edit Q-Index" : "Add Q-Index";
  const description = isEditing
    ? `Update Q-Index data for ${stock.symbol} on ${formatDateForInput(initialData?.date)}`
    : `Add new Q-Index data for ${stock.symbol}`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Error message display */}
        {formError && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p>{formError}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date*</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="open"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Open</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="high"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>High</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="low"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="close"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Close</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trend_q"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trend Q</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fq"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FQ</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="qv1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QV1</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="band_down"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Band Down</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="band_up"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Band Up</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};