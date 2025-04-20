'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BulkImportResponse } from '@/types/stock';
import { Button } from "@/components/ui/button";
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area"; // For error list
import { Loader2, AlertCircle, UploadCloud, CheckCircle } from 'lucide-react';

interface ImportStockSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (formData: FormData) => Promise<void>; // Submit handler from hook
    isImporting: boolean;
    importError: string | null;
    importResult: BulkImportResponse | null; // Result from the backend
}

export const ImportStockSheet: React.FC<ImportStockSheetProps> = ({
    isOpen,
    onOpenChange,
    onSubmit,
    isImporting,
    importError,
    importResult
}) => {
    const [importFile, setImportFile] = useState<File | null>(null);
    const [internalError, setInternalError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setInternalError(null);
        if (file) {
            if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
                setInternalError('Invalid file type. Please select a .csv file.');
                setImportFile(null);
                if(fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            // Optional: Add size check if needed
            setImportFile(file);
        } else {
            setImportFile(null);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setInternalError(null);
        if (!importFile) {
            setInternalError("Please select a CSV file to import.");
            return;
        }

        const formData = new FormData();
        formData.append('file', importFile); // Backend expects field named 'file'

        await onSubmit(formData);
        // Hook handles loading state and results/errors
        // Reset local file state only if submit was successful (sheet might close)
    };

    // Reset local state when sheet closes
    useEffect(() => {
        if (!isOpen) {
            setImportFile(null);
            setInternalError(null);
            // Note: importResult and importError are managed by the hook, no need to reset here
             if(fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [isOpen]);

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-lg flex flex-col">
                <SheetHeader>
                    <SheetTitle>Bulk Import Stocks</SheetTitle>
                    <SheetDescription>
                        Upload a CSV file with columns: `symbol`, `name`, `exchange`, `industry`.
                        `symbol` and `name` are required.
                    </SheetDescription>
                </SheetHeader>

                {/* Show results/errors *after* import attempt, otherwise show form */}
                {importResult || importError ? (
                    <div className="flex-1 overflow-y-auto py-4 px-1 space-y-4">
                        {importError && (
                            <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600"/>
                                <div>
                                    <h4 className="font-semibold">Import Failed</h4>
                                    <p>{importError}</p>
                                </div>
                            </div>
                        )}
                        {importResult && (
                            <div className="p-3 text-sm text-green-800 bg-green-100 border border-green-200 rounded-md flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600"/>
                                 <div>
                                    <h4 className="font-semibold">Import Complete</h4>
                                    <p>{importResult.message}</p>
                                    <ul className="list-disc list-inside mt-1 text-xs">
                                        <li>Processed Rows: {importResult.summary.totalCsvRows}</li>
                                        <li>Successful: {importResult.summary.successful}</li>
                                        <li>Skipped: {importResult.summary.skipped}</li>
                                    </ul>
                                 </div>
                            </div>
                        )}
                         {importResult?.errors && importResult.errors.length > 0 && (
                            <div className="space-y-2">
                                 <h5 className="font-semibold text-destructive">Skipped Row Details:</h5>
                                <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/30">
                                    <ul className="space-y-1 text-xs">
                                        {importResult.errors.map((err, index) => (
                                            <li key={index} className="border-b pb-1 last:border-b-0">
                                                <strong>Row ~{err.row}:</strong> {err.message}
                                                {err.data && <pre className="mt-1 text-[10px] bg-background p-1 rounded overflow-x-auto">{JSON.stringify(err.data)}</pre>}
                                            </li>
                                        ))}
                                    </ul>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                 ) : ( 
                    /* Initial Form View */
                     <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden pt-4">
                        <div className="flex-1 space-y-4 overflow-y-auto px-1 py-2">
                            {internalError && (
                                <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0"/>
                                    <span>{internalError}</span>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="csv-file-input">CSV File</Label>
                                <div
                                    className="flex justify-center items-center w-full h-32 border-2 border-dashed border-muted-foreground/50 rounded-md bg-muted/40 cursor-pointer hover:border-primary transition-colors"
                                    onClick={triggerFileInput}
                                >
                                    <div className="text-center text-muted-foreground">
                                         <UploadCloud className="mx-auto h-8 w-8" />
                                         <p className="mt-1 text-sm">
                                            {importFile ? "File selected:" : "Click or drag to upload"}
                                         </p>
                                          {importFile && <p className="text-xs mt-0.5 font-medium truncate max-w-xs px-2" title={importFile.name}>{importFile.name}</p>}
                                    </div>
                                </div>
                                <Input
                                    ref={fileInputRef}
                                    id="csv-file-input"
                                    type="file"
                                    accept=".csv,text/csv"
                                    onChange={handleFileChange}
                                    className="sr-only"
                                    disabled={isImporting}
                                />
                            </div>
                         </div>
                        <SheetFooter className="mt-auto pt-4 border-t bg-background">
                            <SheetClose asChild>
                                <Button type="button" variant="outline" disabled={isImporting}>Cancel</Button>
                            </SheetClose>
                            <Button type="submit" disabled={isImporting || !importFile}>
                                {isImporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</> : 'Start Import'}
                            </Button>
                        </SheetFooter>
                    </form>
                 )}

                 {/* Footer when showing results */} 
                 {(importResult || importError) && (
                     <SheetFooter className="mt-auto pt-4 border-t bg-background">
                        <SheetClose asChild>
                            <Button type="button" variant="outline">Close</Button>
                        </SheetClose>
                    </SheetFooter>
                 )}

            </SheetContent>
        </Sheet>
    );
}; 