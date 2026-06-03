// app/students/upload/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Users, User, Target } from 'lucide-react';
import { toast } from 'sonner'; // Optional: for toast notifications
import { saveStudentsToDatabase } from '@/app/actions/student-action';

interface Student {
  name: string;
  pronoun: string;
  characteristics: string;
}

export default function UploadStudentsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [extractedStudents, setExtractedStudents] = useState<Student[]>([]);
  const [showPreview, setShowPreview] = useState(false);

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
      setError(null);
      setSuccess(null);
      setExtractedStudents([]);
      setShowPreview(false);
    } else {
      setError('Please upload a CSV or TXT file');
      toast.error('Please upload a CSV or TXT file');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.txt'))) {
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
      setExtractedStudents([]);
      setShowPreview(false);
    } else {
      setError('Please upload a CSV or TXT file');
      toast.error('Please upload a CSV or TXT file');
    }
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    setExtractedStudents([]);
    setShowPreview(false);
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    setExtractedStudents([]);

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

      // Call Next.js API route instead of directly calling Flask
      const response = await fetch('/api/extract-students-data', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok) {
        // Extract students from the response
        const students = data.extracted_students_data?.students || [];
        setExtractedStudents(students);
        setShowPreview(true);
        setSuccess(`Successfully extracted ${students.length} students from ${file.name}`);
        toast.success(`Successfully extracted ${students.length} students`);
      } else {
        const errorMsg = data.error || 'Upload failed';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Failed to connect to server. Please make sure the backend is running.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmUpload = useCallback(async () => {
    if (extractedStudents.length === 0) {
      const errorMsg = 'No students to save';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      // Call the server action to save students
      const result = await saveStudentsToDatabase(extractedStudents);
      
      if (result.success) {
        const successMsg = `Successfully saved ${result.savedCount} student(s) to database`;
        setSuccess(successMsg);
        toast.success(successMsg);
        
        // Clear the form after successful save
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        const errorMsg = result.error || 'Failed to save students to database';
        setError(errorMsg);
        toast.error(errorMsg);
        setShowPreview(true); // Keep preview visible so user can see the data
      }
    } catch (err) {
      const errorMsg = 'An unexpected error occurred while saving students';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [extractedStudents, router]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Upload Student Data
        </h1>
        <p className="text-muted-foreground">
          Upload a CSV or text file containing student information. The system will automatically extract names, pronouns, and characteristics.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Upload Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                File Upload
              </CardTitle>
              <CardDescription>
                Drag and drop your file here, or click to browse. Supported formats: CSV, TXT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drop Zone */}
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
                  id="file-upload"
                  className="hidden"
                  accept=".csv,.txt,text/csv,text/plain"
                  onChange={handleFileSelect}
                  disabled={isUploading || isSaving}
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
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={isUploading || isSaving}
                      >
                        Browse Files
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      or drag and drop your file here
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
                        onClick={removeFile}
                        disabled={isUploading || isSaving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Processing file with AI... {uploadProgress}%
                  </p>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && !showPreview && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Upload Button */}
              <div className="flex gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading || isSaving}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload and Extract
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => router.push('/students')}
                  disabled={isUploading || isSaving}
                >
                  Cancel
                </Button>
              </div>

              {/* Example Format */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-2">Example CSV Format:</p>
                <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
                  {`name,pronoun,characteristics
Prabin,he/him,good listener, active participant, strong in math
Emma,she/her,creative writer, loves art, quiet in class
Marcus,he/him,energetic, great at group work, math whiz`}
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  The system accepts both CSV and plain text formats and will intelligently extract student data.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview Extracted Data */}
        <div className="space-y-6">
          {showPreview && extractedStudents.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Extracted Students
                  </CardTitle>
                  <CardDescription>
                    {extractedStudents.length} student(s) found in your file
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {extractedStudents.map((student, idx) => (
                        <div key={idx} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-primary" />
                              <span className="font-semibold">{student.name}</span>
                            </div>
                            <Badge variant="outline">{student.pronoun}</Badge>
                          </div>
                          <div className="flex items-start gap-2">
                            <Target className="h-4 w-4 text-primary mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              {student.characteristics}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {/* Save Status Alerts */}
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {success && (
                      <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-700 dark:text-green-300">
                          {success}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleConfirmUpload} 
                        className="flex-1"
                        disabled={isSaving || isUploading}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving to Database...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirm & Save {extractedStudents.length} Students
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPreview(false);
                          setExtractedStudents([]);
                          setError(null);
                          setSuccess(null);
                          removeFile();
                        }}
                        disabled={isSaving || isUploading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* No Data Preview State */}
          {!showPreview && extractedStudents.length === 0 && !isUploading && (
            <Card className="h-[400px] flex items-center justify-center">
              <CardContent className="text-center">
                <div className="rounded-full bg-muted p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Upload a file to see extracted student data here
                </p>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isUploading && !showPreview && (
            <Card className="h-[400px] flex items-center justify-center">
              <CardContent className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Processing your file...
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}