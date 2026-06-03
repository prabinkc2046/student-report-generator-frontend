'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, FileText, RefreshCw, Brain, X, CheckCircle2, Upload, AlertCircle, User, Target } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAllReports } from '../actions/student-action';
import { getActiveBulkJob, revalidateBulkPage } from '../actions/bulk-job-actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface ExtractedStudent {
  name: string;
  pronoun: string;
  characteristics: string;
}

interface Report {
  id: string;
  report: string;
  attributes: string;
  charCount: number;
  createdAt: string;
  student: {
    name: string;
    pronoun: string;
  };
}

interface BulkJob {
  id: string;
  totalStudents: number;
  completedCount: number;
  failedCount: number;
  status: string;
  createdAt: string;
}

export default function BulkReportPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [activeJob, setActiveJob] = useState<BulkJob | null>(null);
  const [jobCompleted, setJobCompleted] = useState(false);
  const [userClosedCompleted, setUserClosedCompleted] = useState(false);

  // File upload states
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractedStudents, setExtractedStudents] = useState<ExtractedStudent[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchReports = async () => {
    const result = await getAllReports();
    if (result.success) {
      setReports(result.reports as Report[]);
    }
    setIsLoadingReports(false);
  };

  const fetchActiveJob = async () => {
    const result = await getActiveBulkJob();
    if (result.success && result.job) {
      setActiveJob(result.job);
      if (result.job.status === 'completed') {
        // Only auto-show completed if user hasn't closed it
        if (!userClosedCompleted) {
          setJobCompleted(true);
        }
        await fetchReports();
      } else {
        setJobCompleted(false);
        setUserClosedCompleted(false); // Reset when new job starts
      }
    } else {
      setActiveJob(null);
      setJobCompleted(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchActiveJob();

    let interval: NodeJS.Timeout;
    if (activeJob && activeJob.status !== 'completed') {
      interval = setInterval(() => {
        fetchActiveJob();
        fetchReports();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeJob?.status]);

  // File upload handlers
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

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.type === 'text/plain' || droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.txt'))) {
      setFile(droppedFile);
      setUploadError(null);
      setExtractedStudents([]);
      setShowPreview(false);
    } else {
      setUploadError('Please upload a CSV or TXT file');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.txt'))) {
      setFile(selectedFile);
      setUploadError(null);
      setExtractedStudents([]);
      setShowPreview(false);
    } else {
      setUploadError('Please upload a CSV or TXT file');
    }
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setUploadError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/extract-students-data', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok) {
        const students = data.extracted_students_data?.students || [];
        setExtractedStudents(students);
        setShowPreview(true);
        toast.success(`Successfully extracted ${students.length} students`);
      } else {
        const errorMsg = data.error || 'Upload failed';
        setUploadError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Failed to connect to server. Please make sure the backend is running.';
      setUploadError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateReports = async () => {
    if (extractedStudents.length === 0) {
      toast.error('Please upload a file with student data first');
      return;
    }

    setIsGenerating(true);
    setSheetOpen(false);
    // Reset completed state when generating new reports
    setJobCompleted(false);
    setUserClosedCompleted(false);

    const studentsForReport = extractedStudents.map(student => ({
      student_name: student.name,
      pronoun: student.pronoun,
      attributes: student.characteristics.split(',').map(s => s.trim())
    }));

    try {
      const response = await fetch('/api/generate-bulk-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          students: studentsForReport
        })
      });

      const data = await response.json();
      toast.success(data.message);

      setTimeout(() => {
        fetchActiveJob();
        fetchReports();
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to start report generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoadingReports(true);
    await revalidateBulkPage();
    await fetchReports();
    await fetchActiveJob();
    setIsLoadingReports(false);
    toast.success('Refreshed');
  };

  const handleCloseCompleted = () => {
    setJobCompleted(false);
    setUserClosedCompleted(true);
  };

  const progress = activeJob ? ((activeJob.completedCount + activeJob.failedCount) / activeJob.totalStudents) * 100 : 0;
  const isJobActive = activeJob && activeJob.status !== 'completed';
  const showActiveJob = isJobActive && activeJob;
  const showCompletedJob = jobCompleted && activeJob && activeJob.status === 'completed' && !userClosedCompleted;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Tracking System - Fixed Height to Prevent Jump */}
        <div className="mb-6 min-h-[100px]">
          {showActiveJob && (
            <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Generating Reports in Background
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Progress: {activeJob.completedCount + activeJob.failedCount} of {activeJob.totalStudents} completed
                    {activeJob.failedCount > 0 && ` (${activeJob.failedCount} failed)`}
                  </p>
                  <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {showCompletedJob && (
            <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 relative">
              <button
                onClick={handleCloseCompleted}
                className="absolute top-3 right-3 text-green-700 hover:text-green-900"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3 pr-6">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    ✓ All Done!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {activeJob.completedCount} of {activeJob.totalStudents} reports generated successfully
                    {activeJob.failedCount > 0 && ` (${activeJob.failedCount} failed)`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generate Bulk Report Button - Fixed Position */}
        <div className="flex justify-center mb-8">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger >
              <Button
                size="lg"
                className="gap-2 px-8"
                disabled={isJobActive}
              >
                <Sparkles className="h-5 w-5" />
                Generate Bulk Report
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg p-0">
              <div className="p-6">
                <SheetHeader className="p-0 mb-6">
                  <SheetTitle>Upload Student Data</SheetTitle>
                  <SheetDescription>
                    Upload a CSV or text file containing student information
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      border-2 border-dashed rounded-lg p-8 text-center transition-colors
                      ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                      ${file ? 'bg-muted/30' : ''}
                    `}
                  >
                    <input
                      type="file"
                      id="file-upload-sheet"
                      className="hidden"
                      accept=".csv,.txt,text/csv,text/plain"
                      onChange={handleFileSelect}
                      disabled={isUploading || isGenerating}
                    />

                    {!file ? (
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <div className="rounded-full bg-primary/10 p-4">
                            <Upload className="h-8 w-8 text-primary" />
                          </div>
                        </div>
                        <div>
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('file-upload-sheet')?.click()}
                            disabled={isUploading || isGenerating}
                          >
                            Browse Files
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          or drag and drop your CSV/TXT file here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div className="text-left">
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setFile(null);
                              setExtractedStudents([]);
                              setShowPreview(false);
                            }}
                            disabled={isUploading || isGenerating}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isUploading && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        Processing file... {uploadProgress}%
                      </p>
                    </div>
                  )}

                  {uploadError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{uploadError}</AlertDescription>
                    </Alert>
                  )}

                  {file && !showPreview && !isUploading && (
                    <Button onClick={handleUpload} disabled={isUploading || isGenerating} className="w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      Extract Student Data
                    </Button>
                  )}

                  {showPreview && extractedStudents.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">Extracted Students ({extractedStudents.length})</h3>
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-3">
                          {extractedStudents.map((student, idx) => (
                            <div key={idx} className="p-3 border rounded-lg space-y-2 bg-card">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-primary" />
                                  <span className="font-semibold text-sm">{student.name}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">{student.pronoun}</Badge>
                              </div>
                              <div className="flex items-start gap-2">
                                <Target className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-muted-foreground">{student.characteristics}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <Button
                        onClick={handleGenerateReports}
                        disabled={isGenerating || isJobActive}
                        className="w-full gap-2"
                        size="lg"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Starting...
                          </>
                        ) : isJobActive ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Job in Progress...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Generate {extractedStudents.length} Reports
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Generated Reports Section - 2 Column Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Generated Reports</h2>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isLoadingReports}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingReports ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {isLoadingReports && reports.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No reports generated yet</p>
              <p className="text-sm text-muted-foreground">Click Generate Bulk Report to start</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{report.student.name}</h3>
                        <p className="text-sm text-muted-foreground">{report.student.pronoun}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {report.charCount} chars
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {report.report}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {report.attributes.split(", ").slice(0, 3).map((attr, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {attr}
                        </Badge>
                      ))}
                      {report.attributes.split(", ").length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{report.attributes.split(", ").length - 3}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}