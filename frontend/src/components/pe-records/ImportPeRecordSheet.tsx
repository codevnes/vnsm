import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2, Upload, AlertCircle, FileText, Download, HelpCircle, Table as TableIcon, X, FileSpreadsheet } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ImportPeRecordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<void>;
  isImporting: boolean;
  importError: string | null;
  importResult: any | null;
}

export function ImportPeRecordSheet({
  open,
  onOpenChange,
  onImport,
  isImporting,
  importError,
  importResult
}: ImportPeRecordSheetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");

  // Sample CSV data as a string
  const sampleCsvContent = `Symbol,ReportDate,PE,PENganh,PERate
AAPL,31/12/2023,25.6,22.3,14.8
AAPL,30/09/2023,24.8,22.1,12.2
MSFT,31/12/2023,35.2,28.7,22.6`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      setFileError('Please select a file');
      return;
    }

    // Check file extension for both CSV and Excel
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    const isValidCsv = selectedFile.type === 'text/csv' || fileExtension === 'csv';
    const isValidExcel = 
      selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
      selectedFile.type === 'application/vnd.ms-excel' ||
      fileExtension === 'xlsx' || 
      fileExtension === 'xls';

    if (!isValidCsv && !isValidExcel) {
      setFile(null);
      setFileError('Only CSV and Excel (.xlsx, .xls) files are supported');
      return;
    }

    setFile(selectedFile);
    setFileError(null);
  };

  const handleImport = async () => {
    if (!file) {
      setFileError('Please select a file');
      return;
    }

    try {
      await onImport(file);
      // File input gets cleared after successful import
      const fileInput = document.getElementById('importFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setFile(null);
      // Switch to the results tab after import
      setActiveTab("results");
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const downloadSampleCsv = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'pe_record_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg p-2 lg:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <TableIcon className="mr-2 h-5 w-5" />
            Import PE Records
          </SheetTitle>
          <SheetDescription>
            Upload your CSV or Excel file to import PE (Price to Earnings) records.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="p-3 mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="guide" className="flex items-center">
              <HelpCircle className="mr-2 h-4 w-4" />
              Guide
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center" disabled={!importResult && !importError}>
              <FileText className="mr-2 h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="importFile" className="text-base">Import File</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSampleCsv}
                  className="flex items-center text-xs"
                >
                  <Download className="mr-1 h-3 w-3" />
                  Download Template
                </Button>
              </div>
              <Input
                id="importFile"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isImporting}
                className="border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors"
              />
              {fileError && (
                <p className="text-sm text-destructive flex items-center">
                  <X className="h-4 w-4 mr-1" />
                  {fileError}
                </p>
              )}
              {file && (
                <p className="text-sm text-green-600 flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  File selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Format Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <ul className="list-disc list-inside space-y-1">
                  <li>File must be in CSV format or Excel format (.xlsx, .xls)</li>
                  <li>First row should contain column headers</li>
                  <li>Required columns: Symbol, ReportDate, PE, PENganh, PERate</li>
                  <li>Date format should be DD/MM/YYYY (e.g., 31/12/2023 for Dec 31, 2023)</li>
                  <li>Decimal values should use dot (.) as decimal separator</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guide" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">File Structure Guide</CardTitle>
                <CardDescription>Your CSV or Excel file should follow this structure:</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="flex items-center">
                    <FileText className="h-3 w-3 mr-1" />
                    CSV
                  </Badge>
                  <Badge variant="outline" className="flex items-center">
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    Excel (.xlsx, .xls)
                  </Badge>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Example</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Symbol</TableCell>
                      <TableCell>Text</TableCell>
                      <TableCell>Stock symbol</TableCell>
                      <TableCell>AAPL</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">ReportDate</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>DD/MM/YYYY</TableCell>
                      <TableCell>31/12/2023</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">PE</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>Price to Earnings ratio</TableCell>
                      <TableCell>25.6</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">PENganh</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>Industry PE</TableCell>
                      <TableCell>22.3</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">PERate</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>PE percentage</TableCell>
                      <TableCell>14.8</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="text-xs">
                  <p className="font-medium">Notes:</p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>Symbol should match your stock database</li>
                    <li>All decimal values can have up to 6 decimal places</li>
                    <li>PE, PENganh, and PERate fields can be left empty if data is not available</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4 mt-4">
            {importError ? (
              <Alert variant="destructive" className="border border-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {importError}
                </AlertDescription>
              </Alert>
            ) : importResult ? (
              <>
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Import completed successfully!</span>
                </div>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Import Results</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-md">
                      <p className="text-3xl font-bold">{importResult.imported || 0}</p>
                      <p className="text-xs text-muted-foreground">Records Imported</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-md">
                      <p className="text-3xl font-bold">{importResult.total || 0}</p>
                      <p className="text-xs text-muted-foreground">Errors</p>
                    </div>

                    {importResult.message && (
                      <div className="col-span-2 text-sm">
                        <Separator className="my-2" />
                        <p className="font-medium">Message:</p>
                        <p className="text-muted-foreground">{importResult.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No import has been performed yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <SheetFooter className="pt-2">
          <div className="flex w-full justify-between">
            <SheetClose asChild>
              <Button variant="outline" disabled={isImporting}>Cancel</Button>
            </SheetClose>
            {activeTab === "upload" && (
              <Button onClick={handleImport} disabled={!file || isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import File
                  </>
                )}
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 