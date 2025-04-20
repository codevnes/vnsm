'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Loader2, AlertCircle } from 'lucide-react';

interface DeleteAlertDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<void>; // Async confirm
    isDeleting: boolean;
    deleteError: string | null;
}

export const DeleteAlertDialog: React.FC<DeleteAlertDialogProps> = ({
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
                        This action cannot be undone. This will permanently delete the image record and the associated file from the server.
                    </AlertDialogDescription>
                    {deleteError && (
                        <div className="p-3 mt-2 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0"/>
                            {deleteError}
                        </div>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm} // Call the passed confirm handler
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}; 