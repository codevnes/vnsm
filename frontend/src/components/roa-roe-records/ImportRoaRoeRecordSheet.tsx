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

interface ImportRoaRoeRecordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<void>;
  isImporting: boolean;
  importError: string | null;
  importResult: any | null;
}

export function ImportRoaRoeRecordSheet({
  open,
  onOpenChange,
  onImport,
  isImporting,
  importError,
  importResult
}: ImportRoaRoeRecordSheetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");

  // Sample CSV data as a string
  const sampleCsvContent = `Symbol,ReportDate,ROA,ROE,ROENganh,ROENganhRate
AAPL,31/12/2023,15.7,23.8,19.5,22.05
AAPL,30/09/2023,14.9,22.6,19.2,17.71
MSFT,31/12/2023,18.2,29.6,22.3,32.74`;

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
    link.setAttribute('download', 'roa_roe_record_template.csv');
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
            Import ROA/ROE Records
          </SheetTitle>
          <SheetDescription>
            Upload your CSV or Excel file to import ROA (Return on Assets) and ROE (Return on Equity) records.
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
                  <li>Required columns: Symbol, ReportDate, ROA, ROE, ROENganh, ROENganhRate</li>
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
                      <TableCell className="font-medium">ROA</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>Return on Assets</TableCell>
                      <TableCell>15.7</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">ROE</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>Return on Equity</TableCell>
                      <TableCell>23.8</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">ROENganh</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>Industry ROE</TableCell>
                      <TableCell>19.5</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">ROENganhRate</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>Industry ROE Rate (%)</TableCell>
                      <TableCell>22.05</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Alert>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    <span className="font-medium">Note:</span> Make sure your data is properly formatted to avoid import errors.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4 mt-4">
            {importError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            {importResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Import Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {importResult.success ? (
                    <div className="space-y-2">
                      <div className="flex items-center text-green-600">
                        <Check className="h-5 w-5 mr-2" />
                        <span className="font-medium">Import completed successfully</span>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Records imported:</span>
                          <span className="font-medium">{importResult.imported}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Total records in file:</span>
                          <span className="font-medium">{importResult.total}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-destructive">
                      <X className="h-5 w-5 mr-2" />
                      <span className="font-medium">Import failed</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <SheetFooter className="pt-4">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button 
            onClick={handleImport}
            disabled={!file || isImporting || activeTab !== "upload"}
            className="flex items-center"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 