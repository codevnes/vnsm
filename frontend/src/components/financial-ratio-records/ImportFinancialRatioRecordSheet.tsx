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

interface ImportFinancialRatioRecordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<void>;
  isImporting: boolean;
  importError: string | null;
  importResult: any | null;
}

export function ImportFinancialRatioRecordSheet({
  open,
  onOpenChange,
  onImport,
  isImporting,
  importError,
  importResult
}: ImportFinancialRatioRecordSheetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");

  // Sample CSV data as a string
  const sampleCsvContent = `Symbol,ReportDate,DebtEquity,AssetsEquity,DebtEquityPct
AAPL,31/12/2023,1.2,3.5,120.0
AAPL,30/09/2023,1.1,3.4,110.0
MSFT,31/12/2023,0.8,2.9,80.0`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      setFileError('Vui lòng chọn một file');
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
      setFileError('Chỉ hỗ trợ file CSV và Excel (.xlsx, .xls)');
      return;
    }

    setFile(selectedFile);
    setFileError(null);
  };

  const handleImport = async () => {
    if (!file) {
      setFileError('Vui lòng chọn một file');
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
    link.setAttribute('download', 'financial_ratio_record_template.csv');
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
            Import Financial Ratio Records
          </SheetTitle>
          <SheetDescription>
            Tải lên file CSV hoặc Excel để import dữ liệu Financial Ratio (Debt/Equity, Assets/Equity, Debt/Equity %).
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="p-3 mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center">
              <Upload className="mr-2 h-4 w-4" />
              Tải lên
            </TabsTrigger>
            <TabsTrigger value="guide" className="flex items-center">
              <HelpCircle className="mr-2 h-4 w-4" />
              Hướng dẫn
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center" disabled={!importResult && !importError}>
              <FileText className="mr-2 h-4 w-4" />
              Kết quả
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
                  Tải mẫu
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
                  File đã chọn: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Yêu cầu định dạng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <ul className="list-disc list-inside space-y-1">
                  <li>File phải ở định dạng CSV hoặc Excel (.xlsx, .xls)</li>
                  <li>Dòng đầu tiên phải chứa tiêu đề cột</li>
                  <li>Các cột bắt buộc: Symbol, ReportDate, DebtEquity, AssetsEquity, DebtEquityPct</li>
                  <li>Định dạng ngày phải là DD/MM/YYYY (ví dụ: 31/12/2023 cho ngày 31 tháng 12 năm 2023)</li>
                  <li>Giá trị thập phân phải sử dụng dấu chấm (.) làm dấu phân cách</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guide" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hướng dẫn cấu trúc file</CardTitle>
                <CardDescription>File CSV hoặc Excel của bạn nên tuân theo cấu trúc này:</CardDescription>
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
                      <TableHead>Cột</TableHead>
                      <TableHead>Kiểu</TableHead>
                      <TableHead>Định dạng</TableHead>
                      <TableHead>Ví dụ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Symbol</TableCell>
                      <TableCell>Text</TableCell>
                      <TableCell>Mã cổ phiếu</TableCell>
                      <TableCell>AAPL</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">ReportDate</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>DD/MM/YYYY</TableCell>
                      <TableCell>31/12/2023</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">DebtEquity</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>Tỷ lệ nợ trên vốn chủ sở hữu</TableCell>
                      <TableCell>1.2</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">AssetsEquity</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>Tỷ lệ tài sản trên vốn chủ sở hữu</TableCell>
                      <TableCell>3.5</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">DebtEquityPct</TableCell>
                      <TableCell>Decimal</TableCell>
                      <TableCell>Tỷ lệ nợ trên vốn chủ sở hữu (%)</TableCell>
                      <TableCell>120.0</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Alert>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    <span className="font-medium">Lưu ý:</span> Đảm bảo dữ liệu của bạn được định dạng đúng để tránh lỗi khi import.
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
                  <CardTitle className="text-base">Kết quả Import</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {importResult.success ? (
                    <div className="space-y-2">
                      <div className="flex items-center text-green-600">
                        <Check className="h-5 w-5 mr-2" />
                        <span className="font-medium">Import hoàn tất thành công</span>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Số bản ghi đã import:</span>
                          <span className="font-medium">{importResult.imported}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Tổng số bản ghi trong file:</span>
                          <span className="font-medium">{importResult.total}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-destructive">
                      <X className="h-5 w-5 mr-2" />
                      <span className="font-medium">Import thất bại</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <SheetFooter className="pt-4">
          <SheetClose asChild>
            <Button variant="outline">Hủy</Button>
          </SheetClose>
          <Button 
            onClick={handleImport}
            disabled={!file || isImporting || activeTab !== "upload"}
            className="flex items-center"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang import...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Dữ liệu
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}