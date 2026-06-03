'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertCircle, Sparkles, BookOpen, Target, FileText, Save, Edit, Users, History, CheckCircle2, Settings, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS } from '@/lib/data';
import { toast } from 'sonner';
import { 
  getStudentsWithoutReports,
  getStudentWithCharacteristics, 
  saveStudentCharacteristics, 
  saveReportToDatabase, 
  getStudentReports 
} from './actions/student-action';
import { getEnabledAttributes } from './actions/attribute-action';

interface Student {
  id: string;
  name: string;
  pronoun: string;
  hasSavedReport?: boolean;
}

interface SavedReport {
  id: string;
  studentId: string;
  report: string;
  attributes: string;
  charCount: number;
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [customAttributes, setCustomAttributes] = useState('');
  const [attributeCategories, setAttributeCategories] = useState<Record<string, string[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(true);
  const [isLoadingCharacteristics, setIsLoadingCharacteristics] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [report, setReport] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [error, setError] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasLoadedCharacteristics, setHasLoadedCharacteristics] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch students without saved reports only
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoadingStudents(true);
        const result = await getStudentsWithoutReports();
        
        if (result.success && result.students) {
          const formattedStudents = result.students.map((student: any) => ({
            id: student.id,
            name: student.name,
            pronoun: student.pronoun,
            hasSavedReport: student.hasSavedReport || false
          }));
          setStudents(formattedStudents);
        } else {
          console.error('Failed to fetch students:', result.error);
          if (result.error?.includes('Student')) {
            toast.error('No students found. Please upload students first.');
          } else {
            toast.error('Failed to load students from database');
          }
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Error loading students');
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  // Fetch enabled attributes from database
  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        setIsLoadingAttributes(true);
        const result = await getEnabledAttributes();
        if (result.success && Object.keys(result.attributes).length > 0) {
          setAttributeCategories(result.attributes);
        } else {
          console.error('No attributes found or failed to fetch:', result.error);
        }
      } catch (error) {
        console.error('Error fetching attributes:', error);
      } finally {
        setIsLoadingAttributes(false);
      }
    };

    fetchAttributes();
  }, []);

  // Fetch characteristics when student is selected
  useEffect(() => {
    const fetchStudentCharacteristics = async () => {
      if (!selectedStudent) {
        setHasLoadedCharacteristics(false);
        return;
      }

      const savedCharacteristicsKey = `student_${selectedStudent.id}_characteristics_loaded`;
      const alreadyLoaded = sessionStorage.getItem(savedCharacteristicsKey);
      
      if (alreadyLoaded === 'true' && hasLoadedCharacteristics) {
        return;
      }

      setIsLoadingCharacteristics(true);
      try {
        const result = await getStudentWithCharacteristics(selectedStudent.id);
        
        if (result.success && result.student) {
          const savedCharacteristics = result.student.characteristics || [];
          
          if (savedCharacteristics.length > 0) {
            const allPredefinedAttributes = Object.values(attributeCategories).flat();
            const predefinedChars = savedCharacteristics.filter((char: string) => 
              allPredefinedAttributes.includes(char)
            );
            const customChars = savedCharacteristics.filter((char: string) => 
              !allPredefinedAttributes.includes(char)
            );
            
            if (predefinedChars.length > 0 || customChars.length > 0) {
              setSelectedAttributes(predefinedChars);
              setCustomAttributes(customChars.join(', '));
              toast.success(`Loaded saved characteristics for ${selectedStudent.name}`);
              
              sessionStorage.setItem(savedCharacteristicsKey, 'true');
              setHasLoadedCharacteristics(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching student characteristics:', error);
      } finally {
        setIsLoadingCharacteristics(false);
      }
    };

    fetchStudentCharacteristics();
  }, [selectedStudent, attributeCategories]);

  // Fetch saved reports when student is selected
  useEffect(() => {
    const fetchReports = async () => {
      if (!selectedStudent) return;
      
      try {
        const result = await getStudentReports(selectedStudent.id);
        if (result.success && result.reports) {
          // Ensure createdAt is a string
          const formattedReports = result.reports.map((report: any) => ({
            ...report,
            createdAt: typeof report.createdAt === 'string' 
              ? report.createdAt 
              : new Date(report.createdAt).toISOString()
          }));
          setSavedReports(formattedReports);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };
    
    fetchReports();
  }, [selectedStudent]);

  // Save characteristics when they change (debounced)
  useEffect(() => {
    if (!selectedStudent || isInitialLoad || !hasLoadedCharacteristics) return;
    
    const saveCharacteristics = async () => {
      const allAttributes = [...selectedAttributes];
      if (customAttributes.trim()) {
        const customItems = customAttributes.split(',').map(item => item.trim()).filter(item => item);
        allAttributes.push(...customItems);
      }
      
      if (allAttributes.length > 0) {
        try {
          await saveStudentCharacteristics(selectedStudent.id, allAttributes);
        } catch (error) {
          console.error('Error auto-saving characteristics:', error);
        }
      }
    };
    
    const debounceTimer = setTimeout(saveCharacteristics, 1000);
    return () => clearTimeout(debounceTimer);
  }, [selectedAttributes, customAttributes, selectedStudent, isInitialLoad, hasLoadedCharacteristics]);

  // Load saved state from localStorage on initial load
  useEffect(() => {
    const savedSelectedStudentId = localStorage.getItem(STORAGE_KEYS.SELECTED_STUDENT_ID);
    const savedSelectedAttributes = localStorage.getItem(STORAGE_KEYS.SELECTED_ATTRIBUTES);
    const savedCustomAttributes = localStorage.getItem(STORAGE_KEYS.CUSTOM_ATTRIBUTES);
    const savedReport = localStorage.getItem(STORAGE_KEYS.REPORT);
    const savedCharCount = localStorage.getItem(STORAGE_KEYS.CHAR_COUNT);

    if (savedSelectedStudentId && students.length > 0) {
      const student = students.find(s => s.id === savedSelectedStudentId);
      if (student) setSelectedStudent(student);
    }
    if (savedSelectedAttributes) setSelectedAttributes(JSON.parse(savedSelectedAttributes));
    if (savedCustomAttributes) setCustomAttributes(savedCustomAttributes);
    if (savedReport) setReport(savedReport);
    if (savedCharCount) setCharCount(parseInt(savedCharCount));
    
    setIsInitialLoad(false);
  }, [students]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_STUDENT_ID, selectedStudent?.id || '');
      localStorage.setItem(STORAGE_KEYS.SELECTED_ATTRIBUTES, JSON.stringify(selectedAttributes));
      localStorage.setItem(STORAGE_KEYS.CUSTOM_ATTRIBUTES, customAttributes);
      localStorage.setItem(STORAGE_KEYS.REPORT, report);
      localStorage.setItem(STORAGE_KEYS.CHAR_COUNT, charCount.toString());
    }
  }, [selectedStudent, selectedAttributes, customAttributes, report, charCount, isInitialLoad]);

  const toggleAttribute = useCallback((attribute: string) => {
    setSelectedAttributes(prev =>
      prev.includes(attribute)
        ? prev.filter(a => a !== attribute)
        : [...prev, attribute]
    );
  }, []);

  const selectAllInCategory = useCallback((categoryAttributes: string[]) => {
    setSelectedAttributes(prev => {
      const allSelected = categoryAttributes.every(attr => prev.includes(attr));
      if (allSelected) {
        return prev.filter(attr => !categoryAttributes.includes(attr));
      } else {
        const newAttributes = categoryAttributes.filter(attr => !prev.includes(attr));
        return [...prev, ...newAttributes];
      }
    });
  }, []);

  const removeAttribute = useCallback((attribute: string) => {
    setSelectedAttributes(prev => prev.filter(a => a !== attribute));
    if (customAttributes.includes(attribute)) {
      const customItems = customAttributes.split(',').map(item => item.trim());
      const filtered = customItems.filter(item => item !== attribute);
      setCustomAttributes(filtered.join(', '));
    }
  }, [customAttributes]);

  const generateReport = async () => {
    if (!selectedStudent) {
      setError('Please select a student.');
      toast.error('Please select a student');
      return;
    }

    const allAttributes = [...selectedAttributes];
    if (customAttributes.trim()) {
      const customItems = customAttributes.split(',').map(item => item.trim()).filter(item => item);
      allAttributes.push(...customItems);
    }

    if (allAttributes.length === 0) {
      setError('Please select at least one student characteristic.');
      toast.error('Please select at least one student characteristic');
      return;
    }

    setIsGenerating(true);
    setError('');
    setReport('');

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_name: selectedStudent.name,
          pronoun: selectedStudent.pronoun,
          attributes: allAttributes.join(', ')
        })
      });

      const data = await response.json();

      if (data.success) {
        setReport(data.report);
        setCharCount(data.char_count);
        toast.success('Report generated successfully');
      } else {
        setError(data.error || 'Failed to generate report');
        toast.error(data.error || 'Failed to generate report');
      }
    } catch (err) {
      setError('Network Error: Could not connect to backend server.');
      toast.error('Network Error: Could not connect to backend server.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveReport = async () => {
    if (!report || !selectedStudent) {
      toast.error('No report to save');
      return;
    }
    
    setIsSavingReport(true);
    
    const allAttributes = [...selectedAttributes];
    if (customAttributes.trim()) {
      const customItems = customAttributes.split(',').map(item => item.trim()).filter(item => item);
      allAttributes.push(...customItems);
    }
    
    try {
      const result = await saveReportToDatabase({
        studentId: selectedStudent.id,
        report: report,
        attributes: allAttributes,
        charCount: charCount,
      });
      
      if (result.success) {
        toast.success(`Report saved successfully for ${selectedStudent.name}!`);
        
        setStudents(prevStudents => prevStudents.filter(s => s.id !== selectedStudent.id));
        
        clearForm();
        
        if (students.length === 1) {
          toast.success('🎉 Congratulations! You have completed reports for all students!');
        } else {
          toast.info(`${students.length - 1} student(s) remaining to complete`);
        }
        
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to save report');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('An unexpected error occurred while saving the report');
    } finally {
      setIsSavingReport(false);
    }
  };

  const loadSavedReport = (savedReport: SavedReport) => {
    setReport(savedReport.report);
    setCharCount(savedReport.charCount);
    const attrs = savedReport.attributes.split(', ').filter(a => a);
    const allPredefinedAttributes = Object.values(attributeCategories).flat();
    const predefinedChars = attrs.filter((char: string) => 
      allPredefinedAttributes.includes(char)
    );
    const customChars = attrs.filter((char: string) => 
      !allPredefinedAttributes.includes(char)
    );
    setSelectedAttributes(predefinedChars);
    setCustomAttributes(customChars.join(', '));
    
    const displayDate = new Date(savedReport.createdAt);
    toast.success(`Loaded report from ${displayDate.toLocaleDateString()}`);
    setShowHistory(false);
  };

  const clearForm = () => {
    setSelectedStudent(null);
    setSelectedAttributes([]);
    setCustomAttributes('');
    setReport('');
    setCharCount(0);
    setError('');
    setHasLoadedCharacteristics(false);
    setShowHistory(false);
    
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    toast.info('Form cleared');
  };

  const handleEdit = () => {
    if (!report) {
      toast.error('No report to edit');
      return;
    }
    
    toast.info('You can edit the report text above');
  };

  const allAttributes = useMemo(() => {
    const attrs = [...selectedAttributes];
    if (customAttributes.trim()) {
      const customItems = customAttributes.split(',').map(item => item.trim()).filter(item => item);
      attrs.push(...customItems);
    }
    return attrs;
  }, [selectedAttributes, customAttributes]);

  const canGenerate = selectedStudent && allAttributes.length > 0;
  const hasNoAttributes = !isLoadingAttributes && Object.keys(attributeCategories).length === 0;
  const hasNoStudents = !isLoadingStudents && students.length === 0;
  const showEmptyState = !isLoadingStudents && !isLoadingAttributes && (hasNoStudents || hasNoAttributes);

  if (isLoadingStudents || isLoadingAttributes) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-full">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-full">
      {/* Empty State - No Students and No Attributes */}
      {showEmptyState && (
        <div className="space-y-6">
          {hasNoStudents && (
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <AlertTriangle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                No students found. Please upload student data first.
                <Button 
                  variant="link" 
                  className="text-blue-700 dark:text-blue-300 p-0 h-auto ml-2"
                  onClick={() => router.push('/students/upload')}
                >
                  Upload Students
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {hasNoAttributes && (
            <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
              <Settings className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                No characteristics found. Please initialize attributes in settings.
                <Button 
                  variant="link" 
                  className="text-yellow-700 dark:text-yellow-300 p-0 h-auto ml-2"
                  onClick={() => router.push('/settings')}
                >
                  Go to Settings
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {hasNoStudents && hasNoAttributes && (
            <Card className="mt-6">
              <CardContent className="py-12 text-center">
                <div className="rounded-full bg-muted p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  To start generating reports, you need to upload students and initialize characteristics.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button onClick={() => router.push('/students/upload')}>
                    Upload Students
                  </Button>
                  <Button onClick={() => router.push('/settings')} variant="outline">
                    Configure Characteristics
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main Content - Only show when data is available */}
      {!showEmptyState && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Student Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Select Student
                </CardTitle>
                <CardDescription>
                  {students.length === 0 
                    ? "No students remaining! All reports completed 🎉" 
                    : `${students.length} student(s) remaining. Choose a student to generate their report.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3 w-fit mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-muted-foreground mb-4">All reports have been generated!</p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => router.push('/saved-reports')} variant="default">
                        View Saved Reports
                      </Button>
                      <Button onClick={() => router.push('/students/upload')} variant="outline">
                        Upload More Students
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <div className="flex gap-3 pb-2 min-w-min">
                        {students.map((student) => (
                          <Button
                            key={student.id}
                            onClick={() => {
                              setSelectedStudent(student);
                              setHasLoadedCharacteristics(false);
                              if (selectedStudent) {
                                sessionStorage.removeItem(`student_${selectedStudent.id}_characteristics_loaded`);
                              }
                            }}
                            variant={selectedStudent?.id === student.id ? "default" : "outline"}
                            className="flex-shrink-0 h-auto py-2 px-3 flex flex-col items-center gap-1 min-w-[90px]"
                          >
                            <span className="font-medium text-sm">{student.name.split(' ')[0]}</span>
                            <span className="text-xs opacity-70">{student.name.split(' ')[1] || student.name}</span>
                            <span className="text-xs text-muted-foreground">{student.pronoun}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {selectedStudent && (
                      <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                        <p className="text-base font-semibold text-primary">{selectedStudent.name}</p>
                        <p className="text-sm text-muted-foreground">Pronouns: {selectedStudent.pronoun}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {students.findIndex(s => s.id === selectedStudent.id) + 1} of {students.length} remaining
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Characteristics Selection - Only show if students exist */}
            {students.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Select Student Characteristics
                  </CardTitle>
                  <CardDescription>
                    Choose characteristics that describe the student
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingCharacteristics && selectedStudent ? (
                    <div className="mb-4 p-2 bg-primary/5 rounded-lg flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Loading saved characteristics...</span>
                    </div>
                  ) : Object.keys(attributeCategories).length === 0 ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                      <p className="text-muted-foreground mb-4">No characteristics configured</p>
                      <Button onClick={() => router.push('/settings')} variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure Characteristics
                      </Button>
                    </div>
                  ) : (
                    <>
                      <ScrollArea className="h-[380px] pr-4">
                        <div className="space-y-5">
                          {Object.entries(attributeCategories).map(([category, attributes]) => (
                            <div key={category} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm text-primary">{category}</h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => selectAllInCategory(attributes)}
                                  className="h-6 text-xs"
                                >
                                  Select All
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 gap-1.5">
                                {attributes.map((attr) => (
                                  <div
                                    key={attr}
                                    className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                                    onClick={() => toggleAttribute(attr)}
                                  >
                                    <Checkbox
                                      checked={selectedAttributes.includes(attr)}
                                      onCheckedChange={() => toggleAttribute(attr)}
                                      className="h-3.5 w-3.5"
                                    />
                                    <label className="text-sm cursor-pointer flex-1 truncate">
                                      {attr}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <Separator />
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="mt-4">
                        <label className="text-sm font-medium mb-1.5 block">Custom Characteristics</label>
                        <Textarea
                          placeholder="Add custom characteristics separated by commas (e.g., creative thinker, problem solver)..."
                          value={customAttributes}
                          onChange={(e) => setCustomAttributes(e.target.value)}
                          rows={2}
                          className="resize-none text-sm"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Only show if students exist */}
          {students.length > 0 && Object.keys(attributeCategories).length > 0 && (
            <div className="space-y-6">
              {/* Selected Characteristics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-primary" />
                    Selected Characteristics
                  </CardTitle>
                  <CardDescription>
                    {allAttributes.length} characteristic(s) selected
                    {selectedStudent && hasLoadedCharacteristics && allAttributes.length > 0 && (
                      <span className="text-xs text-green-600 ml-2">✓ Saved to database</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[100px] max-h-[180px]">
                    {allAttributes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[100px]">
                        <h3 className='font-bold text-secondary-foreground'>Your selection will appear here</h3>
                        <p className="text-muted-foreground text-sm text-center">
                          No characteristics selected
                        </p>
                      </div>
                    ) : (
                      <ScrollArea className="h-full max-h-[180px]">
                        <div className="flex flex-wrap gap-2 pb-2">
                          {allAttributes.map((attr) => (
                            <Badge key={attr} variant="secondary" className="text-xs inline-flex items-center gap-1">
                              <span className="truncate max-w-[180px]">{attr}</span>
                              <button
                                onClick={() => removeAttribute(attr)}
                                className="hover:text-destructive transition-colors ml-1 flex-shrink-0"
                                aria-label={`Remove ${attr}`}
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Generated Report Card */}
              <Card>
                <CardHeader className='pb-3'>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className='flex items-center gap-4 flex-wrap'>
                      <Button
                        onClick={generateReport}
                        disabled={isGenerating || !canGenerate}
                        size={"lg"}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                            Generate Report
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={clearForm} 
                        variant="secondary"
                        size={"lg"}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="bg-muted/30 rounded-lg min-h-[300px]">
                    {isGenerating ? (
                      <div className="flex flex-col items-center justify-center h-[300px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                        <p className="text-muted-foreground text-sm">
                          Generating your report...
                        </p>
                      </div>
                    ) : report ? (
                      <>
                        <div className="mb-3 flex gap-2 items-center flex-wrap">
                          <Badge variant="outline" className="text-xs text-primary">
                            {selectedStudent?.name}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-primary">
                            {charCount} / 850 chars
                          </Badge>
                          <Badge variant="outline" className="text-xs text-primary">
                            {selectedStudent?.pronoun}
                          </Badge>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          {report.split('\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-2 text-foreground text-sm">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[300px] text-center">
                        <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">
                          Select a student and their characteristics, then click Generate Report
                        </p>
                      </div>
                    )}
                  </div>

                  <CardFooter className="gap-2 mt-4 px-0">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={handleSaveReport}
                      className="gap-1"
                      disabled={!report || isSavingReport}
                    >
                      {isSavingReport ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          Save Report
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleEdit}
                      className="gap-1"
                      disabled={!report}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit Report
                    </Button>
                    {savedReports.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowHistory(!showHistory)}
                        className="gap-1"
                      >
                        <History className="h-3.5 w-3.5" />
                        History ({savedReports.length})
                      </Button>
                    )}
                  </CardFooter>
                </CardContent>
              </Card>

              {/* Report History Modal/Card */}
              {showHistory && savedReports.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Saved Reports History</CardTitle>
                    <CardDescription>
                      Previously saved reports for {selectedStudent?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-3">
                        {savedReports.map((savedReport) => (
                          <div
                            key={savedReport.id}
                            className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => loadSavedReport(savedReport)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-sm font-medium">
                                {new Date(savedReport.createdAt).toLocaleDateString()} at{' '}
                                {new Date(savedReport.createdAt).toLocaleTimeString()}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {savedReport.charCount} chars
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {savedReport.report.substring(0, 150)}...
                            </p>
                            <div className="mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {savedReport.attributes.split(', ').length} characteristics
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}