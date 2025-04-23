'use client';

import React, { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PeRecord } from '@/types/peRecord';
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from 'lucide-react';

// PE Record form schema
const peRecordFormSchema = z.object({
    symbol: z.string().min(1, "Symbol is required").max(20, "Symbol cannot exceed 20 characters"),
    reportDate: z.string().min(1, "Report date is required"),
    pe: z.number().nullable().optional(),
    peNganh: z.number().nullable().optional(),
    peRate: z.number().nullable().optional(),
});

type PeRecordFormValues = z.infer<typeof peRecordFormSchema>;

interface PeRecordFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: PeRecordFormValues) => Promise<void>;
    initialData: PeRecord | null; // null for create, PeRecord for edit
    isSubmitting: boolean;
    formError: string | null;
}

export const PeRecordFormDialog: React.FC<PeRecordFormDialogProps> = ({
    isOpen,
    onOpenChange,
    onSubmit,
    initialData,
    isSubmitting,
    formError,
}) => {
    const form = useForm<PeRecordFormValues>({
        resolver: zodResolver(peRecordFormSchema),
        defaultValues: initialData
            ? { // Pre-fill form for editing
                symbol: initialData.symbol,
                reportDate: initialData.reportDate.split('T')[0], // Format date for input
                pe: initialData.pe,
                peNganh: initialData.peNganh,
                peRate: initialData.peRate,
            }
            : { // Default values for creating
                symbol: "",
                reportDate: "",
                pe: null,
                peNganh: null,
                peRate: null,
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
                    pe: initialData.pe,
                    peNganh: initialData.peNganh,
                    peRate: initialData.peRate,
                }
                : { symbol: "", reportDate: "", pe: null, peNganh: null, peRate: null }
            );
        } else {
            // Reset fully on close
            form.reset({ symbol: "", reportDate: "", pe: null, peNganh: null, peRate: null });
        }
    }, [initialData, isOpen, form]);

    const handleSubmit = form.handleSubmit(async (data) => {
        // Convert string values to numbers for numerical fields
        const formattedData = {
            ...data,
            pe: data.pe !== null && data.pe !== undefined ? Number(data.pe) : null,
            peNganh: data.peNganh !== null && data.peNganh !== undefined ? Number(data.peNganh) : null,
            peRate: data.peRate !== null && data.peRate !== undefined ? Number(data.peRate) : null,
        };
        
        await onSubmit(formattedData);
    });

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit PE Record' : 'Add New PE Record'}</DialogTitle>
                    <DialogDescription>
                        {initialData
                            ? `Update the PE record for ${initialData.symbol}.`
                            : "Enter the details for the new PE record."}
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
                            name="pe"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>PE</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            placeholder="e.g., 20.5" 
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
                            name="peNganh"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>PE Nganh</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            placeholder="e.g., 18.2" 
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
                            name="peRate"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>PE Rate (%)</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            placeholder="e.g., 12.3" 
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