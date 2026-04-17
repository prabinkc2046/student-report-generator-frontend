'use client';

import { useState } from 'react';
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
import { Loader2, AlertCircle, X } from 'lucide-react';

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

  const toggleAttribute = (attribute: string) => {
    setSelectedAttributes(prev =>
      prev.includes(attribute)
        ? prev.filter(a => a !== attribute)
        : [...prev, attribute]
    );
  };

  const selectAllInCategory = (categoryAttributes: string[]) => {
    const allSelected = categoryAttributes.every(attr => selectedAttributes.includes(attr));
    if (allSelected) {
      setSelectedAttributes(prev => prev.filter(attr => !categoryAttributes.includes(attr)));
    } else {
      const newAttributes = categoryAttributes.filter(attr => !selectedAttributes.includes(attr));
      setSelectedAttributes(prev => [...prev, ...newAttributes]);
    }
  };

  const removeAttribute = (attribute: string) => {
    setSelectedAttributes(prev => prev.filter(a => a !== attribute));
    if (customAttributes.includes(attribute)) {
      const customItems = customAttributes.split(',').map(item => item.trim());
      const filtered = customItems.filter(item => item !== attribute);
      setCustomAttributes(filtered.join(', '));
    }
  };

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
      setError('Network Error: Could not connect to backend server. Make sure the Flask server is running on port 5001.');
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

  const allAttributes = [...selectedAttributes];
  if (customAttributes.trim()) {
    const customItems = customAttributes.split(',').map(item => item.trim()).filter(item => item);
    allAttributes.push(...customItems);
  }

  // Fixed: Handle both string and null values
  const handleGenderChange = (value: string | null) => {
    if (value) {
      setGender(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 p-4">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">📝 Student Report Generator</h1>
          <p className="text-lg opacity-90">Professional Primary School Teacher Reports - Exactly 850 Characters</p>
        </div>

        {/* Warning Banner */}
        <Alert className="mb-6 bg-yellow-100 border-yellow-400 text-yellow-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ Reports use ONLY the characteristics you select. No additional qualities or ideas will be added.
          </AlertDescription>
        </Alert>

        {/* Main Card */}
        <Card className="shadow-2xl">
          {/* Input Section */}
          <CardContent className="p-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium mb-2">👤 Student Name</label>
                <Input
                  placeholder="Enter student's full name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">⚥ Gender</label>
                <Select value={gender} onValueChange={handleGenderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Attributes Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-3">📋 Select Student Characteristics</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(attributeCategories).map(([category, attributes]) => (
                  <Card key={category} className="border-2 hover:border-purple-500 transition-all">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-purple-600">{category}</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => selectAllInCategory(attributes)}
                      >
                        Select All
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {attributes.map((attr) => (
                            <div key={attr} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg">
                              <Checkbox
                                id={attr}
                                checked={selectedAttributes.includes(attr)}
                                onCheckedChange={() => toggleAttribute(attr)}
                              />
                              <label
                                htmlFor={attr}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {attr}
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Custom Attributes */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-purple-600">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span>✏️</span> Custom Characteristics (Optional)
              </h4>
              <Textarea
                placeholder="Enter additional characteristics, separated by commas (e.g., loves singing, good at sports, plays musical instrument)"
                value={customAttributes}
                onChange={(e) => setCustomAttributes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Selected Attributes Display */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-purple-600">
              <h4 className="font-semibold mb-3">📌 Selected Characteristics (Report will use ONLY these):</h4>
              <div className="flex flex-wrap gap-2">
                {allAttributes.length === 0 ? (
                  <span className="text-gray-500">None selected</span>
                ) : (
                  allAttributes.map((attr) => (
                    <Badge key={attr} variant="secondary" className="text-sm py-1 px-3">
                      {attr}
                      <X
                        className="ml-2 h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => removeAttribute(attr)}
                      />
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={generateReport}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  '✨ Generate Professional Report'
                )}
              </Button>
              <Button onClick={clearForm} variant="outline" className="flex-1">
                🗑️ Clear All
              </Button>
            </div>
          </CardContent>

          {/* Output Section */}
          <Separator />
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">📄 Generated Report</h2>
              <Badge className={`text-sm ${charCount === 850 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                Characters: {charCount}/850
              </Badge>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-purple-600 min-h-[200px] whitespace-pre-wrap">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Generating professional report... This may take a few moments.</p>
                </div>
              ) : report ? (
                report
              ) : (
                <em className="text-gray-500">
                  Select student characteristics and click "Generate Professional Report" to create a teacher report.
                </em>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}