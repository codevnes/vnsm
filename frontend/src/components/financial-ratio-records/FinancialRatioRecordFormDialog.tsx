import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from 'lucide-react';
import { FinancialRatioRecord } from '@/types/financialRatioRecord';
import { format, parseISO } from 'date-fns';

interface FinancialRatioRecordFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData: FinancialRatioRecord | null;
  isSubmitting: boolean;
  formError: string | null;
}

export function FinancialRatioRecordFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting,
  formError
}: FinancialRatioRecordFormDialogProps) {
  const [formData, setFormData] = useState({
    symbol: '',
    reportDate: '',
    debtEquity: '',
    assetsEquity: '',
    debtEquityPct: ''
  });

  // Reset form when initialData changes or dialog opens/closes
  useEffect(() => {
    if (initialData) {
      setFormData({
        symbol: initialData.symbol || '',
        reportDate: initialData.reportDate 
          ? format(new Date(initialData.reportDate), 'yyyy-MM-dd')
          : '',
        debtEquity: initialData.debtEquity !== null ? initialData.debtEquity.toString() : '',
        assetsEquity: initialData.assetsEquity !== null ? initialData.assetsEquity.toString() : '',
        debtEquityPct: initialData.debtEquityPct !== null ? initialData.debtEquityPct.toString() : ''
      });
    } else {
      setFormData({
        symbol: '',
        reportDate: '',
        debtEquity: '',
        assetsEquity: '',
        debtEquityPct: ''
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string values to appropriate types for submission
    const dataToSubmit = {
      symbol: formData.symbol.toUpperCase(),
      reportDate: formData.reportDate,
      debtEquity: formData.debtEquity ? parseFloat(formData.debtEquity) : null,
      assetsEquity: formData.assetsEquity ? parseFloat(formData.assetsEquity) : null,
      debtEquityPct: formData.debtEquityPct ? parseFloat(formData.debtEquityPct) : null
    };
    
    onSubmit(dataToSubmit);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Chỉnh sửa Financial Ratio' : 'Tạo mới Financial Ratio'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? `Chỉnh sửa thông tin Financial Ratio cho ${initialData.symbol}`
              : 'Thêm mới Financial Ratio vào cơ sở dữ liệu'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="symbol" className="text-right">
                Symbol
              </Label>
              <Input
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                className="col-span-3"
                required
                placeholder="e.g., AAPL"
                maxLength={20}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reportDate" className="text-right">
                Report Date
              </Label>
              <Input
                id="reportDate"
                name="reportDate"
                type="date"
                value={formData.reportDate}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="debtEquity" className="text-right">
                Debt/Equity
              </Label>
              <Input
                id="debtEquity"
                name="debtEquity"
                type="number"
                step="0.01"
                value={formData.debtEquity}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Tỷ lệ nợ trên vốn chủ sở hữu"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assetsEquity" className="text-right">
                Assets/Equity
              </Label>
              <Input
                id="assetsEquity"
                name="assetsEquity"
                type="number"
                step="0.01"
                value={formData.assetsEquity}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Tỷ lệ tài sản trên vốn chủ sở hữu"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="debtEquityPct" className="text-right">
                Debt/Equity %
              </Label>
              <Input
                id="debtEquityPct"
                name="debtEquityPct"
                type="number"
                step="0.01"
                value={formData.debtEquityPct}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Tỷ lệ nợ trên vốn chủ sở hữu (%)"
              />
            </div>
            
            {formError && (
              <div className="text-sm text-destructive mt-2">
                {formError}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}