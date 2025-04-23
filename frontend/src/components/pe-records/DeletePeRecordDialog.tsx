'use client';

import React from 'react';
import { PeRecord } from '@/types/peRecord';
import { Button } from "@/components/ui/button";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Loader2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface DeletePeRecordDialogProps {
    record: PeRecord | null; // The record being deleted
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<void>; // Async confirm
    isDeleting: boolean;
    deleteError: string | null;
}

export const DeletePeRecordDialog: React.FC<DeletePeRecordDialogProps> = ({
    record,
    isOpen,
    onOpenChange,
    onConfirm,
    isDeleting,
    deleteError,
}) => {
    // Format date for display
    const formatDate = (dateString: string) => {
        try {
            return format(parseISO(dateString), 'dd/MM/yyyy');
        } catch (e) {
            return dateString;
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the PE record for
                        <strong className="px-1">{record?.symbol}</strong> from 
                        <strong className="px-1">{record ? formatDate(record.reportDate) : ''}</strong>.
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
                        {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : 'Delete Record'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}; 