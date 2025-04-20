 // frontend/src/components/stocks/StockFormDialog.tsx
'use client';

import React, { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StockType } from '@/types/stock';
import { stockFormSchema, StockFormValues } from "@/lib/schemas/stockSchema";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from 'lucide-react';

interface StockFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: StockFormValues) => Promise<void>;
    initialData: StockType | null; // null for create, StockType for edit
    isSubmitting: boolean;
    formError: string | null;
}

export const StockFormDialog: React.FC<StockFormDialogProps> = ({
    isOpen,
    onOpenChange,
    onSubmit,
    initialData,
    isSubmitting,
    formError,
}) => {
    const form = useForm<StockFormValues>({
        resolver: zodResolver(stockFormSchema),
        defaultValues: initialData
            ? { // Pre-fill form for editing
                  symbol: initialData.symbol,
                  name: initialData.name,
                  exchange: initialData.exchange ?? '', // Handle null from DB
                  industry: initialData.industry ?? '', // Handle null from DB
              }
            : { // Default values for creating
                  symbol: "",
                  name: "",
                  exchange: "",
                  industry: "",
              },
    });

    // Reset form when initialData changes (dialog opens for different item or create)
    // or when the dialog closes
    useEffect(() => {
        if (isOpen) {
             form.reset(initialData
                ? { 
                    symbol: initialData.symbol,
                    name: initialData.name,
                    exchange: initialData.exchange ?? '',
                    industry: initialData.industry ?? '' 
                  }
                : { symbol: "", name: "", exchange: "", industry: "" }
            );
        } else {
            // Reset fully on close
             form.reset({ symbol: "", name: "", exchange: "", industry: "" });
        }
    }, [initialData, isOpen, form]);

    const handleSubmit = form.handleSubmit(async (data) => {
        await onSubmit(data);
        // Hook submitting the form will close the dialog on success
    });

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Stock' : 'Add New Stock'}</DialogTitle>
                    <DialogDescription>
                        {initialData
                            ? `Update the details for ${initialData.symbol}.`
                            : "Enter the details for the new stock."}
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
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name*</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Apple Inc." {...field} disabled={isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="exchange"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Exchange</FormLabel>
                                    <FormControl>
                                         {/* Ensure null value is handled correctly */}
                                        <Input placeholder="e.g., NASDAQ" {...field} value={field.value ?? ''} disabled={isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="industry"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Industry</FormLabel>
                                    <FormControl>
                                         {/* Ensure null value is handled correctly */}
                                        <Input placeholder="e.g., Technology" {...field} value={field.value ?? ''} disabled={isSubmitting} />
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
                                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Stock'}
                            </Button>
                        </DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
    );
};
