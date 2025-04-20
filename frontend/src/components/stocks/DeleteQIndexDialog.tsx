'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertCircle } from 'lucide-react';
import { StockQIndex } from '@/types/stockQIndex';
import { format } from 'date-fns';

interface DeleteQIndexDialogProps {
  qIndex: StockQIndex | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  deleteError?: string | null;
}

export const DeleteQIndexDialog: React.FC<DeleteQIndexDialogProps> = ({
  qIndex,
  isOpen,
  onOpenChange,
  onConfirm,
  isDeleting,
  deleteError
}) => {
  if (!qIndex) return null; // Don't render if no qIndex is selected for deletion

  // Format date for display
  const formattedDate = qIndex.date ? format(new Date(qIndex.date), 'MMMM do, yyyy') : 'Unknown date';

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Q-Index Record</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the Q-Index record for {formattedDate}?
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {deleteError && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 mt-2">
            <AlertCircle className="h-4 w-4" />
            <p>{deleteError}</p>
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}; 