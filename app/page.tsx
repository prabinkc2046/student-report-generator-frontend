'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle, Sparkles, User, BookOpen, Target, FileText } from 'lucide-react';

// Attribute categories (same as your original)
const attributeCategories = {
  'Reading Skills': [
    'reads fluently at grade level',
    'reads above grade level with comprehension',
    'struggles with decoding words',
    'needs support with phonics',
    'has difficulty with reading comprehension',
    'reads with good expression and pacing',
    'reads slowly and hesitantly',
    'enjoys reading independently',
    'needs encouragement to read at home'
  ],
  'Writing Skills': [
    'writes creative and imaginative stories',
    'struggles with organizing ideas in writing',
    'has neat and legible handwriting',
    'needs improvement in handwriting legibility',
    'uses rich vocabulary in writing',
    'struggles with spelling and punctuation',
    'writes complete sentences with proper grammar',
    'needs support with sentence structure'
  ],
  'Mathematics Skills': [
    'excels in mental math calculations',
    'struggles with basic addition and subtraction',
    'understands multiplication and division concepts',
    'needs support with multiplication tables',
    'has difficulty with word problems',
    'good at problem-solving and logical reasoning',
    'struggles with fractions and decimals',
    'understands geometry and measurement concepts',
    'applies math skills to real-life situations'
  ],
  'Science & Social Studies': [
    'curious and asks thoughtful questions',
    'enjoys hands-on experiments and investigations',
    'demonstrates good understanding of scientific concepts',
    'struggles with understanding cause and effect',
    'shows interest in how things work',
    'understands basic historical timelines and events',
    'demonstrates awareness of different cultures'
  ],
  'Attention & Focus': [
    'sustains attention during whole group instruction',
    'easily distracted by surroundings or peers',
    'fidgets frequently during seat work',
    'needs reminders to stay on task',
    'able to refocus after redirection',
    'difficulty transitioning between activities',
    'demonstrates good concentration during tests',
    'often daydreams or seems lost in thought'
  ],
  'Social Skills': [
    'works cooperatively in group settings',
    'shares materials and takes turns',
    'respects peers and listens to their ideas',
    'sometimes struggles to share or wait for turn',
    'shy and hesitant to participate in groups',
    'confident speaking in front of class',
    'shows empathy towards classmates',
    'resolves conflicts appropriately',
    'needs support with social boundaries'
  ],
  'Behavior & Conduct': [
    'follows classroom rules consistently',
    'respectful towards teachers and staff',
    'kind and helpful to classmates',
    'sometimes disrupts class with off-task behavior',
    'responds well to positive reinforcement',
    'needs clear expectations and structure',
    'accepts responsibility for actions',
    'demonstrates good self-control and impulse management'
  ],
  'Emotional Regulation': [
    'manages emotions appropriately',
    'becomes anxious during tests or assessments',
    'easily frustrated when facing challenges',
    'stresses when there is too much priority',
    'seeks help when feeling overwhelmed',
    'persists through difficult tasks',
    'needs encouragement to build confidence',
    'shows resilience after setbacks',
    'expresses feelings appropriately'
  ],
  'Work Habits': [
    'completes homework on time consistently',
    'organized and keeps materials tidy',
    'often forgets to bring supplies to class',
    'takes pride in work and produces quality output',
    'needs improvement in focus during independent work',
    'works well independently with minimal supervision',
    'routinely checks work for errors',
    'uses class time efficiently'
  ],
  'Participation & Engagement': [
    'actively participates in class discussions',
    'raises hand before speaking',
    'reluctant to volunteer answers',
    'contributes meaningful ideas during group work',
    'listens attentively when others speak',
    'needs encouragement to share thoughts',
    'enthusiastic and eager to learn'
  ],
  'Motivation & Attitude': [
    'highly motivated and self-directed learner',
    'shows initiative in learning new topics',
    'needs external motivation to complete tasks',
    'displays positive attitude towards school',
    'sometimes lacks effort in assignments',
    'sets goals and works towards achieving them',
    'celebrates others\' successes'
  ],
  'Communication Skills': [
    'expresses ideas clearly and logically',
    'uses appropriate language for different situations',
    'asks relevant and thoughtful questions',
    'difficulty articulating thoughts verbally',
    'listens and follows multi-step directions',
    'needs reminders to follow instructions'
  ]
};

export default function Home() {
  const [studentName, setStudentName] = useState('');
  const [gender, setGender] = useState<string>('female');
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [customAttributes, setCustomAttributes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [error, setError] = useState('');

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
    if (!studentName) {
      setError('Please enter the student name.');
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
          student_name: studentName,
          gender: gender,
          attributes: allAttributes.join(', ')
        })
      });

      const data = await response.json();

      if (data.success) {
        setReport(data.report);
        setCharCount(data.char_count);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Network Error: Could not connect to backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setStudentName('');
    setGender('female');
    setSelectedAttributes([]);
    setCustomAttributes('');
    setReport('');
    setCharCount(0);
    setError('');
  };

  const allAttributes = useMemo(() => {
    const attrs = [...selectedAttributes];
    if (customAttributes.trim()) {
      const customItems = customAttributes.split(',').map(item => item.trim()).filter(item => item);
      attrs.push(...customItems);
    }
    return attrs;
  }, [selectedAttributes, customAttributes]);

  const handleGenderChange = (value: string | null) => {
    if (value) {
      setGender(value);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Student Report Generator
        </h1>
        <p className="text-muted-foreground text-lg">
          Create professional primary school reports in seconds
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Input Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Student Name</label>
                  <Input
                    placeholder="Enter full name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Gender</label>
                  <Select value={gender} onValueChange={handleGenderChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Student Characteristics
              </CardTitle>
              <CardDescription>
                Select the characteristics that describe the student
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {Object.entries(attributeCategories).map(([category, attributes]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-primary">{category}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectAllInCategory(attributes)}
                          className="h-7 text-xs"
                        >
                          Select All
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {attributes.map((attr) => (
                          <div
                            key={attr}
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                            onClick={() => toggleAttribute(attr)}
                          >
                            <Checkbox
                              checked={selectedAttributes.includes(attr)}
                              onCheckedChange={() => toggleAttribute(attr)}
                              // Prevent UI jumping by fixing checkbox size
                              className="h-4 w-4 shrink-0"
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

              <div className="mt-6">
                <label className="text-sm font-medium mb-2 block">Custom Characteristics</label>
                <Textarea
                  placeholder="Add custom characteristics separated by commas..."
                  value={customAttributes}
                  onChange={(e) => setCustomAttributes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Selected Characteristics
              </CardTitle>
              <CardDescription>
                {allAttributes.length} characteristic(s) selected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allAttributes.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No characteristics selected
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {allAttributes.map((attr) => (
                    <Badge key={attr} variant="secondary" className="text-xs shrink-0">
                      {attr}
                      <button
                        onClick={() => removeAttribute(attr)}
                        className="ml-1 hover:text-destructive transition-colors"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={generateReport}
              disabled={isLoading || allAttributes.length === 0}
              className="flex-1"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
            <Button onClick={clearForm} variant="outline" size="lg">
              Clear All
            </Button>
          </div>
        </div>

        {/* Right Column - Output */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Generated Report
              </CardTitle>
              <CardDescription>
                Professional end-of-term report
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="bg-muted/30 rounded-lg p-6 min-h-[400px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground text-sm">
                      Generating your report...
                    </p>
                  </div>
                ) : report ? (
                  <>
                    <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">
                        Student: {studentName}
                      </Badge>
                      <Badge 
                        className={`text-xs shrink-0 ${
                          charCount === 850 
                            ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200' 
                            : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200'
                        }`}
                        variant="outline"
                      >
                        {charCount} / 850 characters
                      </Badge>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      {report.split('\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-3 text-foreground">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground text-sm">
                      Select student characteristics and click "Generate Report" to create a professional report.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}