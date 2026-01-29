'use client';

import React from "react"

import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, BookOpen, Plus, Trash2 } from 'lucide-react';

import { NIGERIAN_SUBJECTS } from '@/lib/constants';

const CLASSES = Object.keys(NIGERIAN_SUBJECTS);

function TeacherDashboardContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'upload');
  }, [searchParams]);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadClass, setUploadClass] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTerm, setUploadTerm] = useState('1');
  const [isUploading, setIsUploading] = useState(false);

  // Assessment state
  const [assessTitle, setAssessTitle] = useState('');
  const [assessClass, setAssessClass] = useState('');
  const [assessSubject, setAssessSubject] = useState('');
  const [assessTerm, setAssessTerm] = useState('1');
  const [assessDifficulty, setAssessDifficulty] = useState('medium');
  const [assessTopics, setAssessTopics] = useState('');
  const [assessQuestions, setAssessQuestions] = useState('10');
  const [isGenerating, setIsGenerating] = useState(false);

  // Resources state
  const [resources, setResources] = useState<any[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isDeletingResource, setIsDeletingResource] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'teacher')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);



  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadFile || !uploadClass || !uploadSubject || !uploadTitle) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('classId', uploadClass);
      formData.append('subject', uploadSubject);
      formData.append('title', uploadTitle);
      formData.append('term', uploadTerm);

      const response = await fetch('/api/teacher/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast({
        title: 'Success',
        description: 'Material uploaded successfully!',
      });

      // Reset form
      setUploadFile(null);
      setUploadClass('');
      setUploadSubject('');
      setUploadTitle('');
      fetchResources();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload material',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assessTitle || !assessClass || !assessSubject || !assessTopics) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/teacher/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: assessTitle,
          classId: assessClass,
          subject: assessSubject,
          term: assessTerm,
          priorityTopics: assessTopics.split(',').map((t) => t.trim()),
          difficultyLevel: assessDifficulty,
          questionCount: parseInt(assessQuestions),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate assessment');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: `Assessment created with ${data.questionCount} questions!`,
      });

      // Redirect to the assessment page
      router.push(`/dashboard/teacher/assessments/${data.assessmentId}`);

      // Reset form
      setAssessTitle('');
      setAssessClass('');
      setAssessSubject('');
      setAssessTopics('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate assessment',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchResources = async () => {
    setIsLoadingResources(true);
    try {
        const response = await fetch('/api/teacher/resources');
        if (response.ok) {
            const data = await response.json();
            setResources(data.resources);
        }
    } catch (error) {
        toast({
            title: 'Error',
            description: 'Failed to load resources',
            variant: 'destructive',
        });
    } finally {
        setIsLoadingResources(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
      if (!confirm('Are you sure you want to delete this resource?')) return;

      setIsDeletingResource(id);
      try {
          const response = await fetch(`/api/teacher/resources?id=${id}`, {
              method: 'DELETE',
          });

          if (response.ok) {
              toast({
                  title: 'Success',
                  description: 'Resource deleted',
              });
              fetchResources();
          } else {
              throw new Error('Failed to delete');
          }
      } catch (error) {
          toast({
              title: 'Error',
              description: 'Failed to delete resource',
              variant: 'destructive',
          });
      } finally {
          setIsDeletingResource(null);
      }
  };

  useEffect(() => {
     if (user?.role === 'teacher') {
         fetchResources();
     }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'teacher') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Teacher Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your class materials and assessments</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            // Optional: update URL
             router.push(`/dashboard/teacher?tab=${value}`);
          }}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="upload">Upload Materials</TabsTrigger>
            <TabsTrigger value="assessment">Generate Assessment</TabsTrigger>
            <TabsTrigger value="resources">My Materials</TabsTrigger>
          </TabsList>

          {/* Upload Materials Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Upload Learning Material</CardTitle>
                <CardDescription>Upload class materials for AI to use when helping students</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class">Class *</Label>
                      <Select value={uploadClass} onValueChange={setUploadClass}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASSES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Select
                        value={uploadSubject}
                        onValueChange={setUploadSubject}
                        disabled={!uploadClass}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={uploadClass ? "Select subject" : "Select class first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {(uploadClass ? NIGERIAN_SUBJECTS[uploadClass] : []).map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="term">Term</Label>
                      <Select value={uploadTerm} onValueChange={setUploadTerm}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Term 1</SelectItem>
                          <SelectItem value="2">Term 2</SelectItem>
                          <SelectItem value="3">Term 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Material Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Chapter 3 - Algebra Basics"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">File *</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                      onClick={() => document.getElementById('file-input')?.click()}>
                      {uploadFile ? (
                        <div>
                          <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                          <p className="font-medium text-foreground">{uploadFile.name}</p>
                          <p className="text-sm text-muted-foreground">{(uploadFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="font-medium text-foreground">Click to upload or drag and drop</p>
                          <p className="text-sm text-muted-foreground">PDF, DOCX, PPT, or TXT</p>
                        </div>
                      )}
                      <input
                        id="file-input"
                        type="file"
                        className="hidden"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        accept=".pdf,.docx,.ppt,.txt"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isUploading || !uploadFile}
                  >
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isUploading ? 'Uploading...' : 'Upload Material'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessment Tab */}
          <TabsContent value="assessment" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Generate AI Assessment</CardTitle>
                <CardDescription>Create syllabus-aligned assessments using your uploaded materials</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerateAssessment} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="assess-title">Assessment Title *</Label>
                      <Input
                        id="assess-title"
                        placeholder="e.g., Algebra Chapter 3 Test"
                        value={assessTitle}
                        onChange={(e) => setAssessTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assess-class">Class *</Label>
                      <Select value={assessClass} onValueChange={setAssessClass}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASSES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assess-subject">Subject *</Label>
                      <Select
                        value={assessSubject}
                        onValueChange={setAssessSubject}
                        disabled={!assessClass}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={assessClass ? "Select subject" : "Select class first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {(assessClass ? NIGERIAN_SUBJECTS[assessClass] : []).map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assess-term">Term</Label>
                      <Select value={assessTerm} onValueChange={setAssessTerm}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Term 1</SelectItem>
                          <SelectItem value="2">Term 2</SelectItem>
                          <SelectItem value="3">Term 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assess-difficulty">Difficulty Level</Label>
                      <Select value={assessDifficulty} onValueChange={setAssessDifficulty}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assess-questions">Number of Questions</Label>
                      <Input
                        id="assess-questions"
                        type="number"
                        placeholder="10"
                        value={assessQuestions}
                        onChange={(e) => setAssessQuestions(e.target.value)}
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assess-topics">Priority Topics * (comma-separated)</Label>
                    <Input
                      id="assess-topics"
                      placeholder="e.g., Quadratic equations, Factorization, Algebraic expressions"
                      value={assessTopics}
                      onChange={(e) => setAssessTopics(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Enter topics you want AI to emphasize in the assessment</p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isGenerating}
                  >
                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isGenerating ? 'Generating Assessment...' : <><Plus className="mr-2 h-4 w-4" /> Generate Assessment</>}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Curriculum-Locked:</strong> AI will generate assessments using only materials you've uploaded for this class and subject.
              </p>
            </div>
          </TabsContent>

          {/* My Materials Tab */}
          <TabsContent value="resources" className="space-y-6">
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Uploaded Materials</CardTitle>
                  <CardDescription>View and manage your learning resources</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchResources} disabled={isLoadingResources}>
                   {isLoadingResources && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingResources ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Title</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Subject</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Class</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Term</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resources.map((r) => (
                          <tr key={r._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4 text-foreground font-medium">{r.title}</td>
                            <td className="py-3 px-4 text-muted-foreground">{r.subject}</td>
                            <td className="py-3 px-4 text-muted-foreground">{r.classId}</td>
                            <td className="py-3 px-4 text-muted-foreground">Term {r.term || '-'}</td>
                            <td className="py-3 px-4">
                                <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded uppercase">{r.fileType}</span>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteResource(r._id)}
                                disabled={isDeletingResource === r._id}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                {isDeletingResource === r._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                <span className="sr-only">Delete</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {resources.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No resources found. Upload some materials to get started.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function TeacherDashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <TeacherDashboardContent />
    </Suspense>
  );
}
