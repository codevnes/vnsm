'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, FileUp, Check, FileQuestion, FilePlus } from 'lucide-react';
import { StockQIndexBulkImportResponse } from '@/types/stockQIndex';
import { Stock } from '@/types/stock';
import { cn } from '@/lib/utils';

interface ImportQIndexSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File) => Promise<void>;
  isImporting: boolean;
  importError?: string | null;
  importResult?: StockQIndexBulkImportResponse | null;
  stock: Stock;
}

export const ImportQIndexSheet: React.FC<ImportQIndexSheetProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  isImporting,
  importError,
  importResult,
  stock
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    await onSubmit(file);
  };

  // Reset file when closing the sheet
  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      setFile(null);
    }
    onOpenChange(open);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Import Q-Indices for {stock?.symbol}</SheetTitle>
          <SheetDescription>
            Upload a CSV file with Q-Index data. The file should contain columns for date, open, high, low, trend_q, fq, qv1, band_down, and band_up.
          </SheetDescription>
        </SheetHeader>

        {/* Error message display */}
        {importError && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 mt-4">
            <AlertCircle className="h-4 w-4" />
            <p>{importError}</p>
          </div>
        )}

        {/* Success message display */}
        {importResult && importResult.success && (
          <div className="bg-green-100 text-green-800 text-sm p-3 rounded-md flex items-center gap-2 mt-4">
            <Check className="h-4 w-4" />
            <p>
              Successfully imported {importResult.imported} records. 
              {importResult.failed > 0 && ` Failed to import ${importResult.failed} records.`}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <div
              className={cn(
                "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
                dragActive ? "border-primary bg-muted" : "border-muted-foreground/25",
                file ? "border-primary/50" : ""
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csv-file')?.click()}
            >
              {file ? (
                <>
                  <FilePlus className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                </>
              ) : (
                <>
                  <FileQuestion className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">Drag & drop your CSV file here or click to browse</p>
                  <p className="text-xs text-muted-foreground">Supports CSV files up to 5MB</p>
                </>
              )}
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
                disabled={isImporting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              type="submit"
              disabled={!file || isImporting}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  {file ? `Import ${file.name}` : 'Import CSV File'}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isImporting}
              className="w-full"
            >
              Cancel
            </Button>
          </div>

          {/* Sample Template Link */}
          <div className="mt-2 text-center">
            <a 
              href="#" 
              className="text-xs text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Add logic to download a sample template
                alert('Sample template download will be implemented here');
              }}
            >
              Download sample template
            </a>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}; 