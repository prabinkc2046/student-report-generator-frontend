'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle, Sparkles, User, BookOpen, Target, FileText, Save, Edit, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { attributeCategories } from '@/lib/data';
import { STORAGE_KEYS } from '@/lib/data';

interface SavedReport {
  id: string;
  studentName: string;
  report: string;
  timestamp: string;
  attributes: string[];
}

interface Student {
  id: string;
  name: string;
  pronoun: string;
}

// Dummy student data
const STUDENTS: Student[] = [
  { id: '1', name: 'Emma Chen', pronoun: 'she/her' },
  { id: '2', name: 'Marcus Lee', pronoun: 'he/him' },
  { id: '3', name: 'Sophia Rodriguez', pronoun: 'she/her' },
  { id: '4', name: 'Oliver Smith', pronoun: 'he/him' },
  { id: '5', name: 'Aisha Khan', pronoun: 'she/her' },
  { id: '6', name: 'Liam Brown', pronoun: 'he/him' },
  { id: '7', name: 'Zara Patel', pronoun: 'she/her' },
];

export default function Home() {
  const router = useRouter();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [customAttributes, setCustomAttributes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [error, setError] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load saved state from localStorage on initial load
  useEffect(() => {
    const savedSelectedStudentId = localStorage.getItem(STORAGE_KEYS.SELECTED_STUDENT_ID);
    const savedSelectedAttributes = localStorage.getItem(STORAGE_KEYS.SELECTED_ATTRIBUTES);
    const savedCustomAttributes = localStorage.getItem(STORAGE_KEYS.CUSTOM_ATTRIBUTES);
    const savedReport = localStorage.getItem(STORAGE_KEYS.REPORT);
    const savedCharCount = localStorage.getItem(STORAGE_KEYS.CHAR_COUNT);

    if (savedSelectedStudentId) {
      const student = STUDENTS.find(s => s.id === savedSelectedStudentId);
      if (student) setSelectedStudent(student);
    }
    if (savedSelectedAttributes) setSelectedAttributes(JSON.parse(savedSelectedAttributes));
    if (savedCustomAttributes) setCustomAttributes(savedCustomAttributes);
    if (savedReport) setReport(savedReport);
    if (savedCharCount) setCharCount(parseInt(savedCharCount));
    
    setIsInitialLoad(false);
  }, []);

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
      return;
    }

    const allAttributes = [...selectedAttributes];
    if (customAttributes.trim()) {
      const customItems = customAttributes.split(',').map(item => item.trim()).filter(item => item);
      allAttributes.push(...customItems);
    }

    if (allAttributes.length === 0) {
      setError('Please select at least one student characteristic.');
      return;
    }

    setIsLoading(true);
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
      } else {
        setError(data.error || 'Failed to generate report');
      }
    } catch (err) {
      setError('Network Error: Could not connect to backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setSelectedStudent(null);
    setSelectedAttributes([]);
    setCustomAttributes('');
    setReport('');
    setCharCount(0);
    setError('');
    
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Save clicked');
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit clicked');
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

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-3">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Student Report Generator
        </h1>
        <p className="text-muted-foreground">
          Create professional primary school reports in seconds
        </p>
      </div>

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
                Choose a student from the list
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="flex gap-3 pb-2 min-w-min">
                  {STUDENTS.map((student) => (
                    <Button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      variant={selectedStudent?.id === student.id ? "default" : "outline"}
                      className="flex-shrink-0 h-auto py-2 px-3 flex flex-col items-center gap-1 min-w-[90px]"
                    >
                      <User className="h-4 w-4" />
                      <span className="font-medium text-sm">{student.name.split(' ')[0]}</span>
                      <span className="text-xs opacity-70">{student.name.split(' ')[1]}</span>
                    </Button>
                  ))}
                </div>
              </div>
              
              {selectedStudent && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <p className="text-xs font-medium">Selected Student:</p>
                  <p className="text-base font-semibold text-primary">{selectedStudent.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Characteristics Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-primary" />
                Student Characteristics
              </CardTitle>
              <CardDescription>
                Select characteristics that describe the student
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  placeholder="Add custom characteristics separated by commas..."
                  value={customAttributes}
                  onChange={(e) => setCustomAttributes(e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
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
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-[100px] max-h-[180px]">
                {allAttributes.length === 0 ? (
                  <div className="flex items-center justify-center h-[100px]">
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
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Generated Report
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={generateReport}
                    disabled={isLoading || !canGenerate}
                    size="sm"
                  >
                    {isLoading ? (
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
                    size="sm"
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

              <div className="bg-muted/30 rounded-lg p-5 min-h-[350px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Generating your report...
                    </p>
                  </div>
                ) : report ? (
                  <>
                    <div className="mb-3 flex justify-between items-center">
                      <Badge variant="outline" className="text-xs">
                        {selectedStudent?.name}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {charCount} / 850 chars
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

              {/* Footer buttons */}
              <div className="flex gap-2 mt-4 pt-2 border-t">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleSave}
                  className="gap-1"
                  disabled={!report}
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Report
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}