import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { LoaderCircle } from 'lucide-react';
import { RoaRoeRecord } from '@/types/roaRoeRecord';
import { format, parseISO } from 'date-fns';

interface DeleteRoaRoeRecordDialogProps {
  record: RoaRoeRecord | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
  deleteError: string | null;
}

export function DeleteRoaRoeRecordDialog({
  record,
  isOpen,
  onOpenChange,
  onConfirm,
  isDeleting,
  deleteError
}: DeleteRoaRoeRecordDialogProps) {
  if (!record) return null;

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete ROA/ROE Record</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this ROA/ROE record for {record.symbol}?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="border rounded-md p-4 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Symbol:</div>
              <div className="text-sm">{record.symbol}</div>
              
              <div className="text-sm font-medium">Report Date:</div>
              <div className="text-sm">{formatDate(record.reportDate)}</div>
              
              <div className="text-sm font-medium">ROA:</div>
              <div className="text-sm">{record.roa !== null ? record.roa.toFixed(2) : '-'}</div>
              
              <div className="text-sm font-medium">ROE:</div>
              <div className="text-sm">{record.roe !== null ? record.roe.toFixed(2) : '-'}</div>
              
              <div className="text-sm font-medium">ROE Nganh:</div>
              <div className="text-sm">{record.roeNganh !== null ? record.roeNganh.toFixed(2) : '-'}</div>
              
              <div className="text-sm font-medium">ROE Nganh Rate:</div>
              <div className="text-sm">{record.roeNganhRate !== null ? record.roeNganhRate.toFixed(2) : '-'}</div>
            </div>
          </div>
          
          {deleteError && (
            <div className="text-sm text-destructive mb-4">
              {deleteError}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 