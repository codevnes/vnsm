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

interface ImportCurrencyPriceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<void>;
  isImporting: boolean;
  importError: string | null;
  importResult: any | null;
}

export function ImportCurrencyPriceSheet({
  open,
  onOpenChange,
  onImport,
  isImporting,
  importError,
  importResult
}: ImportCurrencyPriceSheetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");

  // Sample CSV data as a string
  const sampleCsvContent = `Symbol,Date,Open,High,Low,Close,TrendQ,FQ
XAUUSD,10/01/2022,1795.15,1802.32,1790.04,1801.40,0.008160972,0.210501255
XAUUSD,11/01/2022,1801.31,1822.91,1799.71,1822.01,0.108202665,0.215744101
EURUSD,10/01/2022,1.1328,1.1361,1.1318,1.1355,0.023892450,0.156782341`;

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
    link.setAttribute('download', 'currency_price_template.csv');
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
            Import Currency Prices
          </SheetTitle>
          <SheetDescription>
            Upload your CSV or Excel file to import currency price data.
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
                  <li>Required columns: Symbol, Date, Open, High, Low, Close, TrendQ, FQ</li>
                  <li>Date format should be DD/MM/YYYY (e.g., 10/01/2022 for Jan 10, 2022)</li>
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
                      <TableCell>Currency pair</TableCell>
                      <TableCell>XAUUSD</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Date</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>DD/MM/YYYY</TableCell>
                      <TableCell>10/01/2022</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Open</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>Price value</TableCell>
                      <TableCell>1795.15</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">High</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>Price value</TableCell>
                      <TableCell>1802.32</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Low</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>Price value</TableCell>
                      <TableCell>1790.04</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Close</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>Price value</TableCell>
                      <TableCell>1801.40</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">TrendQ</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>Index value</TableCell>
                      <TableCell>0.008160972</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">FQ</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>Index value</TableCell>
                      <TableCell>0.210501255</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="flex justify-center mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadSampleCsv}
                    className="flex items-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Sample Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="mt-4">
            {importError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription className="flex flex-col">
                  <span className="font-medium">Import failed</span>
                  <span className="text-sm mt-1">{importError}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("guide")}
                    className="mt-2 w-fit text-xs"
                  >
                    <HelpCircle className="mr-1 h-3 w-3" /> View format guide
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {importResult && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center">
                      <Check className="h-5 w-5 mr-2 text-green-500" />
                      Import Results
                    </CardTitle>
                    <Badge variant={importResult.failed > 0 ? "outline" : "secondary"} className={importResult.failed > 0 ? "" : "bg-green-100 text-green-800 hover:bg-green-100"}>
                      {importResult.failed > 0 ? "Partially Imported" : "Success"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Imported</span>
                        <span className="font-medium text-green-600">{importResult.imported}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Failed</span>
                        <span className={`font-medium ${importResult.failed > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                          {importResult.failed}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Total</span>
                        <span className="font-medium">{importResult.total}</span>
                      </div>
                    </div>

                    <Separator className="my-2" />

                    {importResult.errors && importResult.errors.length > 0 ? (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-1">Errors:</h4>
                        <div className="max-h-32 overflow-y-auto text-xs bg-muted p-2 rounded-md">
                          <ul className="list-disc list-inside space-y-1">
                            {importResult.errors.map((error: any, index: number) => (
                              <li key={index} className="text-red-600">
                                {error.error}
                              </li>
                            ))}
                          </ul>
                          {importResult.errors.length > 10 && (
                            <p className="mt-1 text-muted-foreground">
                              ...and more errors (showing first 10 only)
                            </p>
                          )}
                        </div>
                      </div>
                    ) : importResult.failed > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Some records failed to import. Common causes include duplicate entries or invalid data formats.
                      </p>
                    ) : (
                      <p className="text-xs text-green-600 flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        All records imported successfully.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {!importResult && !importError && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No import results to display yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-6">
          <div className="grid grid-cols-2 gap-2">
            <SheetClose asChild>
              <Button variant="outline" disabled={isImporting}>
                Close
              </Button>
            </SheetClose>
            {activeTab === "upload" && (
              <Button
                onClick={handleImport}
                disabled={!file || isImporting}
                className="min-w-[100px]"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </>
                )}
              </Button>
            )}
            {activeTab === "guide" && (
              <Button onClick={() => setActiveTab("upload")}>
                Continue to Upload
              </Button>
            )}
            {activeTab === "results" && importResult?.imported > 0 && (
              <Button variant="outline" onClick={() => {
                setActiveTab("upload");
                onOpenChange(false);
              }}>
                Done
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 