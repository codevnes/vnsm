'use client';

import React, { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EpsRecord } from '@/types/epsRecord';
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from 'lucide-react';

// EPS Record form schema
const epsRecordFormSchema = z.object({
    symbol: z.string().min(1, "Symbol is required").max(20, "Symbol cannot exceed 20 characters"),
    reportDate: z.string().min(1, "Report date is required"),
    eps: z.number().nullable().optional(),
    epsNganh: z.number().nullable().optional(),
    epsRate: z.number().nullable().optional(),
});

type EpsRecordFormValues = z.infer<typeof epsRecordFormSchema>;

interface EpsRecordFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: EpsRecordFormValues) => Promise<void>;
    initialData: EpsRecord | null; // null for create, EpsRecord for edit
    isSubmitting: boolean;
    formError: string | null;
}

export const EpsRecordFormDialog: React.FC<EpsRecordFormDialogProps> = ({
    isOpen,
    onOpenChange,
    onSubmit,
    initialData,
    isSubmitting,
    formError,
}) => {
    const form = useForm<EpsRecordFormValues>({
        resolver: zodResolver(epsRecordFormSchema),
        defaultValues: initialData
            ? { // Pre-fill form for editing
                symbol: initialData.symbol,
                reportDate: initialData.reportDate.split('T')[0], // Format date for input
                eps: initialData.eps,
                epsNganh: initialData.epsNganh,
                epsRate: initialData.epsRate,
            }
            : { // Default values for creating
                symbol: "",
                reportDate: "",
                eps: null,
                epsNganh: null,
                epsRate: null,
            },
    });

    // Reset form when initialData changes (dialog opens for different item or create)
    // or when the dialog closes
    useEffect(() => {
        if (isOpen) {
            form.reset(initialData
                ? { 
                    symbol: initialData.symbol,
                    reportDate: initialData.reportDate.split('T')[0], // Format date for input
                    eps: initialData.eps,
                    epsNganh: initialData.epsNganh,
                    epsRate: initialData.epsRate,
                }
                : { symbol: "", reportDate: "", eps: null, epsNganh: null, epsRate: null }
            );
        } else {
            // Reset fully on close
            form.reset({ symbol: "", reportDate: "", eps: null, epsNganh: null, epsRate: null });
        }
    }, [initialData, isOpen, form]);

    const handleSubmit = form.handleSubmit(async (data) => {
        // Convert string values to numbers for numerical fields
        const formattedData = {
            ...data,
            eps: data.eps !== null && data.eps !== undefined ? Number(data.eps) : null,
            epsNganh: data.epsNganh !== null && data.epsNganh !== undefined ? Number(data.epsNganh) : null,
            epsRate: data.epsRate !== null && data.epsRate !== undefined ? Number(data.epsRate) : null,
        };
        
        await onSubmit(formattedData);
    });

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit EPS Record' : 'Add New EPS Record'}</DialogTitle>
                    <DialogDescription>
                        {initialData
                            ? `Update the EPS record for ${initialData.symbol}.`
                            : "Enter the details for the new EPS record."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        {formError && (
                            <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0"/>
                                <span>{formError}</span>
                            </div>
                        )}
                        <FormField
                            control={form.control}
                            name="symbol"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Symbol*</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., AAPL" {...field} disabled={isSubmitting || !!initialData} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="reportDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Report Date*</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} disabled={isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="eps"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>EPS</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            placeholder="e.g., 2.45" 
                                            value={value === null ? '' : value} 
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                                onChange(val);
                                            }}
                                            step="0.01"
                                            {...fieldProps}
                                            disabled={isSubmitting} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="epsNganh"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>EPS Nganh</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            placeholder="e.g., 2.10" 
                                            value={value === null ? '' : value} 
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                                onChange(val);
                                            }}
                                            step="0.01"
                                            {...fieldProps}
                                            disabled={isSubmitting} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="epsRate"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>EPS Rate (%)</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            placeholder="e.g., 15.2" 
                                            value={value === null ? '' : value} 
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                                onChange(val);
                                            }}
                                            step="0.01"
                                            {...fieldProps}
                                            disabled={isSubmitting} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="mt-2">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Record'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}; 