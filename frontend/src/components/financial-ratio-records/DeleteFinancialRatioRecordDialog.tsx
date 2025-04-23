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
import { FinancialRatioRecord } from '@/types/financialRatioRecord';
import { format, parseISO } from 'date-fns';

interface DeleteFinancialRatioRecordDialogProps {
  record: FinancialRatioRecord | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
  deleteError: string | null;
}

export function DeleteFinancialRatioRecordDialog({
  record,
  isOpen,
  onOpenChange,
  onConfirm,
  isDeleting,
  deleteError
}: DeleteFinancialRatioRecordDialogProps) {
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
          <DialogTitle>Xóa Financial Ratio</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa Financial Ratio của {record.symbol} này không?
            Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="border rounded-md p-4 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Symbol:</div>
              <div className="text-sm">{record.symbol}</div>
              
              <div className="text-sm font-medium">Report Date:</div>
              <div className="text-sm">{formatDate(record.reportDate)}</div>
              
              <div className="text-sm font-medium">Debt/Equity:</div>
              <div className="text-sm">{record.debtEquity !== null ? record.debtEquity.toFixed(2) : '-'}</div>
              
              <div className="text-sm font-medium">Assets/Equity:</div>
              <div className="text-sm">{record.assetsEquity !== null ? record.assetsEquity.toFixed(2) : '-'}</div>
              
              <div className="text-sm font-medium">Debt/Equity %:</div>
              <div className="text-sm">{record.debtEquityPct !== null ? record.debtEquityPct.toFixed(2) : '-'}</div>
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
            Hủy
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}