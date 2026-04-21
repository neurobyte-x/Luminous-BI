import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Upload, Check, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DataTableView } from '../components/data-table-view';
import { uploadDataset, type UploadResponse } from '../lib/api';
import { setActiveDataset } from '../lib/storage';

type PreviewRow = Record<string, string | number>;

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

async function buildPreviewRows(file: File): Promise<PreviewRow[]> {
  const content = await file.text();
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1, 11).map((line) => {
    const values = splitCsvLine(line);
    const row: PreviewRow = {};

    headers.forEach((header, headerIndex) => {
      const rawValue = values[headerIndex] ?? '';
      const numericValue = Number(rawValue);
      row[header] = Number.isFinite(numericValue) && rawValue !== '' ? numericValue : rawValue;
    });

    return row;
  });

  return rows;
}

export function UploadPage() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMeta, setUploadMeta] = useState<UploadResponse | null>(null);

  const prepareFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Only CSV files are supported.');
      return;
    }

    setUploadedFile(file);
    setUploadMeta(null);

    try {
      const previewRows = await buildPreviewRows(file);
      setPreviewData(previewRows);
      setShowPreview(true);
    } catch {
      toast.error('Unable to read this CSV file.');
      setPreviewData([]);
      setShowPreview(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      void prepareFile(file);
    }
  }, [prepareFile]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await prepareFile(file);
    }
  };

  const handleImportDataset = async () => {
    if (!uploadedFile) {
      return;
    }

    try {
      setIsUploading(true);
      const response = await uploadDataset(uploadedFile);

      setUploadMeta(response);
      setActiveDataset({
        datasetId: response.dataset_id,
        filename: response.filename,
        columns: response.columns,
        rows: response.rows,
      });

      toast.success('Dataset uploaded successfully.');
      navigate('/app/query', { state: { datasetId: response.dataset_id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Dataset upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Upload Data</h1>
        <p className="mt-2 text-muted-foreground">
          Upload your CSV files to start analyzing
        </p>
      </div>

      <Card className="glass-effect">
        <CardContent className="pt-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              isDragging
                ? 'border-primary bg-primary/5 glow-effect'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {uploadedFile ? 'File Ready' : 'Drop your CSV file here'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {uploadedFile ? uploadedFile.name : 'or click to browse'}
            </p>
            
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            
            <label htmlFor="file-upload">
              <Button asChild variant={uploadedFile ? 'outline' : 'default'}>
                <span className="gap-2">
                  {uploadedFile ? (
                    <>
                      <Check className="h-4 w-4" />
                      Change File
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Browse Files
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTableView data={previewData} />

              {uploadMeta && (
                <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">Dataset imported</p>
                  <p className="text-muted-foreground">Dataset ID: {uploadMeta.dataset_id}</p>
                  <p className="text-muted-foreground">
                    {uploadMeta.rows} rows and {uploadMeta.columns.length} columns
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  setUploadedFile(null);
                  setShowPreview(false);
                  setPreviewData([]);
                  setUploadMeta(null);
                }}>
                  Cancel
                </Button>
                <Button
                  className="glow-effect"
                  onClick={handleImportDataset}
                  disabled={!uploadedFile || isUploading}
                >
                  {isUploading ? 'Importing...' : 'Import Dataset'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
