// app/saved-reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, Calendar, User, BookOpen, Target, Trash2, Eye, Download, AlertCircle, Search, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteReport, getAllStudents, getStudentReports, publishReport, getPublishedReports } from '../actions/student-action';

interface Student {
  id: string;
  name: string;
  pronoun: string;
}

interface Report {
  id: string;
  studentId: string;
  report: string;
  attributes: string;
  charCount: number;
  createdAt: string;
  student?: Student;
}

interface PublishedReport {
  id: string;
  studentId: string;
  studentName: string;
  studentPronoun: string;
  report: string;
  attributes: string;
  charCount: number;
  publishedBy: string;
  publishedAt: string;
  status: string;
}

export default function SavedReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [publishedReports, setPublishedReports] = useState<PublishedReport[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filterStudentId, setFilterStudentId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState('draft');
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [reportToPublish, setReportToPublish] = useState<Report | null>(null);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all students
        const studentsResult = await getAllStudents(true);
        if (studentsResult.success && studentsResult.students) {
          setStudents(studentsResult.students);
        }

        // Fetch reports for all students
        const reportsPromises = studentsResult.students?.map(async (student: Student) => {
          const reportsResult = await getStudentReports(student.id);
          if (reportsResult.success && reportsResult.reports) {
            return reportsResult.reports.map((report: any) => ({
              ...report,
              createdAt: typeof report.createdAt === 'string' 
                ? report.createdAt 
                : new Date(report.createdAt).toISOString(),
              student: student
            }));
          }
          return [];
        }) || [];

        const allReports = (await Promise.all(reportsPromises)).flat();
        allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReports(allReports);

        // Fetch published reports
        const publishedResult = await getPublishedReports();
        if (publishedResult.success && publishedResult.reports) {
          // Serialize the published reports
          const serializedPublished = publishedResult.reports.map((report: any) => ({
            ...report,
            publishedAt: typeof report.publishedAt === 'string' 
              ? report.publishedAt 
              : new Date(report.publishedAt).toISOString(),
            publishedBy: report.publishedBy || 'teacher'
          }));
          setPublishedReports(serializedPublished);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load saved reports');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter reports based on student and search term
  const filteredReports = reports.filter(report => {
    const matchesStudent = filterStudentId === 'all' || report.studentId === filterStudentId;
    const matchesSearch = searchTerm === '' || 
      report.report.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.attributes.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStudent && matchesSearch;
  });

  // Filter published reports
  const filteredPublished = publishedReports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.report.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.attributes.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDeleteReport = async (reportId: string, reportStudentName: string) => {
    if (confirm(`Are you sure you want to delete this report for ${reportStudentName}?`)) {
      setIsDeleting(true);
      try {
        const result = await deleteReport(reportId);
        if (result.success) {
          setReports(reports.filter(r => r.id !== reportId));
          toast.success('Report deleted successfully');
          if (selectedReport?.id === reportId) {
            setSelectedReport(null);
          }
        } else {
          toast.error(result.error || 'Failed to delete report');
        }
      } catch (error) {
        console.error('Error deleting report:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handlePublishReport = async () => {
    if (!reportToPublish) return;
    
    setIsPublishing(true);
    try {
      const result = await publishReport(reportToPublish.id);
      if (result.success && result.publishedReport) {
        // Remove from draft reports
        setReports(reports.filter(r => r.id !== reportToPublish.id));
        // Add to published reports with serialized date
        const serializedPublished = {
          ...result.publishedReport,
          publishedAt: typeof result.publishedReport.publishedAt === 'string' 
            ? result.publishedReport.publishedAt 
            : new Date(result.publishedReport.publishedAt).toISOString(),
          publishedBy: result.publishedReport.publishedBy || 'teacher'
        };
        setPublishedReports([serializedPublished, ...publishedReports]);
        toast.success(`Report published successfully for ${reportToPublish.student?.name}`);
        setShowPublishConfirm(false);
        setReportToPublish(null);
      } else {
        toast.error(result.error || 'Failed to publish report');
      }
    } catch (error) {
      console.error('Error publishing report:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsPublishing(false);
    }
  };

  const downloadReport = (report: Report | PublishedReport, isPublished: boolean = false) => {
    const content = `
Student Report
${isPublished ? 'Published' : 'Generated'}: ${new Date(isPublished ? (report as PublishedReport).publishedAt : (report as Report).createdAt).toLocaleString()}
Student Name: ${isPublished ? (report as PublishedReport).studentName : (report as Report).student?.name || 'N/A'}
Pronouns: ${isPublished ? (report as PublishedReport).studentPronoun : (report as Report).student?.pronoun || 'N/A'}
Characteristics: ${report.attributes}
Character Count: ${report.charCount}

REPORT CONTENT:
${report.report}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const studentName = isPublished ? (report as PublishedReport).studentName : (report as Report).student?.name;
    a.download = `report_${studentName?.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto py-12 px-4 max-w-6xl">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading saved reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Report Management
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage draft reports and publish them for lead teachers and team leaders to access
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Draft Reports</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Published</p>
                <p className="text-2xl font-bold text-green-600">{publishedReports.length}</p>
              </div>
              <Send className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <User className="h-8 w-8 text-primary opacity-50" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Reports/Student</p>
                <p className="text-2xl font-bold">
                  {students.length > 0 ? (reports.length / students.length).toFixed(1) : '0'}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-primary opacity-50" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-8 border shadow-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Student</label>
                <Select value={filterStudentId} onValueChange={(value) => setFilterStudentId(value || 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students ({reports.length} reports)</SelectItem>
                    {students.map((student) => {
                      const reportCount = reports.filter(r => r.studentId === student.id).length;
                      return (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({reportCount} reports)
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, content, or characteristics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Draft and Published Reports */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="draft" className="gap-2">
              <FileText className="h-4 w-4" />
              Draft Reports
              {reports.length > 0 && (
                <Badge variant="secondary" className="ml-2">{reports.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="published" className="gap-2">
              <Send className="h-4 w-4" />
              Published Reports
              {publishedReports.length > 0 && (
                <Badge variant="secondary" className="ml-2">{publishedReports.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Draft Reports Tab */}
          <TabsContent value="draft">
            {filteredReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No draft reports found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reports.length === 0 
                      ? "Generate reports from the home page" 
                      : "Try adjusting your filters"}
                  </p>
                  {reports.length === 0 && (
                    <Button onClick={() => router.push('/')} variant="outline" className="mt-4">
                      Generate Report
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-lg transition-all duration-200 border">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start flex-wrap gap-3">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            {report.student?.name || 'Unknown Student'}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <div className="flex items-center gap-2 text-xs flex-wrap">
                              <Calendar className="h-3 w-3" />
                              {new Date(report.createdAt).toLocaleString()}
                              <span className="mx-1">•</span>
                              <Badge variant="outline">{report.charCount} chars</Badge>
                              <span className="mx-1">•</span>
                              <Badge variant="secondary">{report.student?.pronoun || 'No pronoun'}</Badge>
                            </div>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadReport(report)}
                            className="gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => {
                              setReportToPublish(report);
                              setShowPublishConfirm(true);
                            }}
                            className="gap-1 bg-green-600 hover:bg-green-700"
                          >
                            <Send className="h-4 w-4" />
                            Publish
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteReport(report.id, report.student?.name || 'Unknown')}
                            disabled={isDeleting}
                            className="gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Characteristics:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {report.attributes.split(', ').slice(0, 5).map((attr, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {attr}
                              </Badge>
                            ))}
                            {report.attributes.split(', ').length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{report.attributes.split(', ').length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.report}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Published Reports Tab */}
          <TabsContent value="published">
            {filteredPublished.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Send className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No published reports yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Publish draft reports to make them available for lead teachers
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPublished.map((report) => (
                  <Card key={report.id} className="hover:shadow-lg transition-all duration-200 border border-green-200 dark:border-green-900">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start flex-wrap gap-3">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            {report.studentName}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <div className="flex items-center gap-2 text-xs flex-wrap">
                              <Calendar className="h-3 w-3" />
                              Published: {new Date(report.publishedAt).toLocaleString()}
                              <span className="mx-1">•</span>
                              <Badge variant="outline">{report.charCount} chars</Badge>
                              <span className="mx-1">•</span>
                              <Badge variant="secondary">{report.studentPronoun}</Badge>
                              <span className="mx-1">•</span>
                              <Badge variant="default" className="bg-green-600">Published</Badge>
                            </div>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadReport(report, true)}
                            className="gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                          <Dialog>
                            <DialogTrigger >
                              <Button variant="outline" size="sm" className="gap-1">
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Published Student Report</DialogTitle>
                                <DialogDescription>
                                  Published on {new Date(report.publishedAt).toLocaleString()}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">Student Information</h4>
                                  <div className="bg-muted/30 p-3 rounded-lg space-y-1">
                                    <p><strong>Name:</strong> {report.studentName}</p>
                                    <p><strong>Pronouns:</strong> {report.studentPronoun}</p>
                                    <p><strong>Characteristics:</strong> {report.attributes}</p>
                                    <p><strong>Character Count:</strong> {report.charCount} / 850</p>
                                    <p><strong>Published By:</strong> {report.publishedBy}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">Report Content</h4>
                                  <div className="bg-muted/30 p-4 rounded-lg">
                                    <div className="prose prose-sm max-w-none">
                                      {report.report.split('\n').map((paragraph, idx) => (
                                        <p key={idx} className="mb-2">{paragraph}</p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Characteristics:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {report.attributes.split(', ').slice(0, 5).map((attr, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {attr}
                              </Badge>
                            ))}
                            {report.attributes.split(', ').length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{report.attributes.split(', ').length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.report}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Publish Confirmation Dialog */}
        <Dialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish Report</DialogTitle>
              <DialogDescription>
                Are you sure you want to publish this report for {reportToPublish?.student?.name}?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Once published, this report will be available for lead teachers and team leaders to access. 
                The student will be able to generate a new report if needed.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPublishConfirm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePublishReport} 
                disabled={isPublishing}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Publish Report
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}