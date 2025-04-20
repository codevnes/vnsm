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
import { cn } from '@/lib/utils';

interface ImportQIndicesBySymbolSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File) => Promise<void>;
  isImporting: boolean;
  importError?: string | null;
  importResult?: StockQIndexBulkImportResponse | null;
}

export const ImportQIndicesBySymbolSheet: React.FC<ImportQIndicesBySymbolSheetProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  isImporting,
  importError,
  importResult,
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
          <SheetTitle>Import Q-Indices by Symbol</SheetTitle>
          <SheetDescription>
            Upload a CSV file with Q-Index data. The file should contain columns for Symbol, Date, Open, High, Low, Close, Trend_Q, FQ, QV1.
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

        {/* Details of import results */}
        {importResult && importResult.details && importResult.details.length > 0 && (
          <div className="mt-4 max-h-40 overflow-y-auto text-sm">
            <h4 className="font-medium mb-2">Import Details:</h4>
            <ul className="space-y-1">
              {importResult.details.map((detail, index) => (
                <li key={index} className={cn(
                  "px-2 py-1 rounded",
                  detail.imported > 0 ? "bg-green-50" : "bg-amber-50"
                )}>
                  <span className="font-medium">{detail.symbol}</span>:
                  {detail.imported > 0 ? (
                    <span className="text-green-700"> Imported {detail.imported} records</span>
                  ) : (
                    <span className="text-amber-700"> No records imported</span>
                  )}
                  {detail.failed > 0 && <span className="text-red-600"> (Failed: {detail.failed})</span>}
                </li>
              ))}
            </ul>
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
                  <p className="text-xs text-muted-foreground">Supports CSV files up to 50MB</p>
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
                // Create a sample CSV content
                const sampleContent =
                  "Symbol,Date,Open,High,Low,Close,Trend_Q,FQ,QV1\n" +
                  "AAPL,2023-01-01,150.25,152.30,149.80,151.75,UP,0.8,0.6\n" +
                  "AAPL,2023-01-02,151.75,153.50,151.20,153.25,UP,0.9,0.7\n" +
                  "GOOGL,2023-01-01,120.50,122.75,119.80,122.25,UP,0.7,0.5";

                // Create a blob and download link
                const blob = new Blob([sampleContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sample_qindices_by_symbol.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
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
