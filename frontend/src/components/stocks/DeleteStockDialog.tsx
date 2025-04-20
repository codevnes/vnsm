'use client';

import React from 'react';
import { StockType } from '@/types/stock';
import { Button } from "@/components/ui/button";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Loader2, AlertCircle } from 'lucide-react';

interface DeleteStockDialogProps {
    stock: StockType | null; // The stock being deleted
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<void>; // Async confirm
    isDeleting: boolean;
    deleteError: string | null;
}

export const DeleteStockDialog: React.FC<DeleteStockDialogProps> = ({
    stock,
    isOpen,
    onOpenChange,
    onConfirm,
    isDeleting,
    deleteError,
}) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the stock
                        <strong className="px-1">{stock?.symbol} ({stock?.name})</strong>.
                    </AlertDialogDescription>
                    {deleteError && (
                        <div className="p-3 mt-2 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0"/>
                            <span>{deleteError}</span>
                        </div>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : 'Delete Stock'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}; 