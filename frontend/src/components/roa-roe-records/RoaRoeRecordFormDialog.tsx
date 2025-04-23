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
import { RoaRoeRecord } from '@/types/roaRoeRecord';
import { format, parseISO } from 'date-fns';

interface RoaRoeRecordFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData: RoaRoeRecord | null;
  isSubmitting: boolean;
  formError: string | null;
}

export function RoaRoeRecordFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting,
  formError
}: RoaRoeRecordFormDialogProps) {
  const [formData, setFormData] = useState({
    symbol: '',
    reportDate: '',
    roa: '',
    roe: '',
    roeNganh: '',
    roaNganh: ''
  });

  // Reset form when initialData changes or dialog opens/closes
  useEffect(() => {
    if (initialData) {
      setFormData({
        symbol: initialData.symbol || '',
        reportDate: initialData.reportDate 
          ? format(new Date(initialData.reportDate), 'yyyy-MM-dd')
          : '',
        roa: initialData.roa !== null ? initialData.roa.toString() : '',
        roe: initialData.roe !== null ? initialData.roe.toString() : '',
        roeNganh: initialData.roeNganh !== null ? initialData.roeNganh.toString() : '',
        roaNganh: initialData.roaNganh !== null ? initialData.roaNganh.toString() : ''
      });
    } else {
      setFormData({
        symbol: '',
        reportDate: '',
        roa: '',
        roe: '',
        roeNganh: '',
        roaNganh: ''
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
      roa: formData.roa ? parseFloat(formData.roa) : null,
      roe: formData.roe ? parseFloat(formData.roe) : null,
      roeNganh: formData.roeNganh ? parseFloat(formData.roeNganh) : null,
      roaNganh: formData.roaNganh ? parseFloat(formData.roaNganh) : null
    };
    
    onSubmit(dataToSubmit);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit ROA/ROE Record' : 'Create ROA/ROE Record'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? `Edit ROA/ROE record details for ${initialData.symbol}`
              : 'Add a new ROA/ROE record to the database'}
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
              <Label htmlFor="roa" className="text-right">
                ROA
              </Label>
              <Input
                id="roa"
                name="roa"
                type="number"
                step="0.01"
                value={formData.roa}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Return on Assets"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roe" className="text-right">
                ROE
              </Label>
              <Input
                id="roe"
                name="roe"
                type="number"
                step="0.01"
                value={formData.roe}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Return on Equity"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roeNganh" className="text-right">
                ROE Nganh
              </Label>
              <Input
                id="roeNganh"
                name="roeNganh"
                type="number"
                step="0.01"
                value={formData.roeNganh}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Industry ROE"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roaNganh" className="text-right">
                ROA Nganh
              </Label>
              <Input
                id="roaNganh"
                name="roaNganh"
                type="number"
                step="0.01"
                value={formData.roaNganh}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Industry ROA"
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
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Save Changes' : 'Create Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 