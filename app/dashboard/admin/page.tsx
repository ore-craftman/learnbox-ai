'use client';

import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Users, School, Plus, Search, Link as LinkIcon, LogIn, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string;
  createdAt: string;
}

interface School {
  _id: string;
  name: string;
  slug: string;
  address?: string;
  contactEmail?: string;
  createdAt: string;
}

interface Class {
  _id: string;
  name: string;
  level: string;
}

interface SchoolSettings {
  schoolId: string;
  voiceEnabled: boolean;
  textToSpeechEnabled: boolean;
  classesWithVoiceAccess: string[];
}

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Classes state
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  // Schools state
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [isCreatingSchool, setIsCreatingSchool] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [slugSuccess, setSlugSuccess] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Filters
  const [userFilters, setUserFilters] = useState({
    school: 'all',
    role: 'all'
  });

  // New School Form
  const [newSchoolData, setNewSchoolData] = useState({
    name: '',
    slug: '',
    address: '',
    contactEmail: ''
  });
  const [isAddSchoolOpen, setIsAddSchoolOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
      fetchSettings();
      fetchClasses();
      fetchSchools();
    }
  }, [user, userFilters]); // Refetch users when filters change

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const queryParams = new URLSearchParams({
        school: userFilters.school,
        role: userFilters.role
      });
      const response = await fetch(`/api/admin/users?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const fetchClasses = async () => {
    setIsLoadingClasses(true);
    try {
      const response = await fetch('/api/admin/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Failed to load classes', error);
      // Optional: don't toast error to avoid noise
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const fetchSchools = async () => {
    setIsLoadingSchools(true);
    try {
      const response = await fetch('/api/admin/schools');
      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools);
      }
    } catch (error) {
     console.error('Failed to load schools', error);
    } finally {
      setIsLoadingSchools(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug) {
      setSlugError('');
      setSlugSuccess(false);
      return;
    }

    setIsCheckingSlug(true);
    setSlugError('');
    setSlugSuccess(false);

    try {
      const response = await fetch(`/api/schools/validate?slug=${slug}`);
      const data = await response.json();

      if (data.exists) {
        setSlugError('Slug is already taken');
      } else {
        setSlugSuccess(true);
      }
    } catch (error) {
      console.error('Error checking slug:', error);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = generateSlug(name);

    setNewSchoolData(prev => ({ ...prev, name, slug }));

    // Debounce slug check
    if (typingTimeout) clearTimeout(typingTimeout);

    if (slug) {
      const timeout = setTimeout(() => {
        checkSlugAvailability(slug);
      }, 500);
      setTypingTimeout(timeout);
    } else {
       setSlugError('');
       setSlugSuccess(false);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value.toLowerCase().replace(/\s+/g, '-');
    setNewSchoolData(prev => ({ ...prev, slug }));

    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => {
      checkSlugAvailability(slug);
    }, 500);
    setTypingTimeout(timeout);
  };

  const handleCreateSchool = async () => {
    if (!newSchoolData.name || !newSchoolData.slug) {
      toast({
        title: 'Error',
        description: 'Name and Slug are required',
        variant: 'destructive',
      });
      return;
    }

    if (slugError) {
       toast({
        title: 'Error',
        description: 'School URL slug is not available',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingSchool(true);
    try {
      const response = await fetch('/api/admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchoolData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'School created successfully',
        });
        setIsAddSchoolOpen(false);
        setNewSchoolData({ name: '', slug: '', address: '', contactEmail: '' });
        setSlugSuccess(false);
        setSlugError('');
        fetchSchools();
      } else {
        throw new Error(data.error || 'Failed to create school');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingSchool(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({
            title: "Copied!",
            description: `${label} copied to clipboard`,
        });
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });
        fetchUsers();
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setIsSavingSettings(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Settings saved successfully',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

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

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your school settings and users</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="schools">Schools</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="border-border">
              <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 pb-4">
                <div>
                  <CardTitle>Manage Users</CardTitle>
                  <CardDescription>View and manage all school users</CardDescription>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <Select
                    value={userFilters.school}
                    onValueChange={(val) => setUserFilters(prev => ({ ...prev, school: val }))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by School" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Schools</SelectItem>
                      {schools.map(s => (
                        <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={userFilters.role}
                    onValueChange={(val) => setUserFilters(prev => ({ ...prev, role: val }))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        fetchUsers();
                        fetchSchools();
                    }}
                    disabled={isLoadingUsers}
                  >
                    {isLoadingUsers && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">School</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Role</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Joined</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4 text-foreground">{u.name}</td>
                            <td className="py-3 px-4 text-foreground text-sm">{u.email}</td>
                            <td className="py-3 px-4 text-foreground text-sm">
                              {schools.find(s => s.slug === u.schoolId)?.name || u.schoolId || 'Unknown'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                u.role === 'student' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' :
                                u.role === 'teacher' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                                'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(u.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {users.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No users found
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">User Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                    <p className="text-2xl font-bold text-foreground">{users.length}</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Teachers</p>
                    <p className="text-2xl font-bold text-foreground">{users.filter(u => u.role === 'teacher').length}</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Students</p>
                    <p className="text-2xl font-bold text-foreground">{users.filter(u => u.role === 'student').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schools Tab */}
          <TabsContent value="schools" className="space-y-6">
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Manage Schools</CardTitle>
                  <CardDescription>Create and manage schools</CardDescription>
                </div>
                <Dialog open={isAddSchoolOpen} onOpenChange={setIsAddSchoolOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add School
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New School</DialogTitle>
                      <DialogDescription>
                        Create a new school. This will generate a unique URL slug for student registration.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>School Name</Label>
                        <Input
                          placeholder="e.g. Springfield High"
                          value={newSchoolData.name}
                          onChange={handleNameChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL Slug (Unique ID)</Label>
                        <Input
                          placeholder="e.g. springfield-high"
                          value={newSchoolData.slug}
                          onChange={handleSlugChange}
                          className={cn(
                            slugError ? "border-destructive focus-visible:ring-destructive" :
                            slugSuccess ? "border-green-500 focus-visible:ring-green-500" : ""
                          )}
                        />
                         <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              Signup URL: learnbox/signup?school=
                              <span className={slugError ? "text-destructive" : "font-medium"}>
                                {newSchoolData.slug || '...'}
                              </span>
                            </p>
                            {isCheckingSlug && <Loader2 className="h-3 w-3 animate-spin" />}
                            {!isCheckingSlug && slugError && <span className="text-xs text-destructive font-medium">{slugError}</span>}
                            {!isCheckingSlug && slugSuccess && <span className="text-xs text-green-600 font-medium">Available</span>}
                         </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Email (Optional)</Label>
                        <Input
                           placeholder="admin@school.com"
                           value={newSchoolData.contactEmail}
                           onChange={(e) => setNewSchoolData(prev => ({ ...prev, contactEmail: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddSchoolOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateSchool} disabled={isCreatingSchool || isCheckingSlug || !!slugError || !newSchoolData.slug}>
                        {isCreatingSchool && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create School
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingSchools ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Slug</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Contact</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Created</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schools.map((s) => (
                          <tr key={s._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4 text-foreground font-medium">{s.name}</td>
                            <td className="py-3 px-4 text-muted-foreground">
                              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{s.slug}</code>
                            </td>
                            <td className="py-3 px-4 text-foreground">{s.contactEmail || '-'}</td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">
                              {new Date(s.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(`${window.location.origin}/signup?school=${s.slug}`, 'Signup Link')}
                                    title="Copy Signup Link"
                                >
                                    <LinkIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(`${window.location.origin}/login?school=${s.slug}`, 'Signin Link')}
                                    title="Copy Signin Link"
                                >
                                    <LogIn className="h-4 w-4" />
                                </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {schools.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No schools found. Create one to get started.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {isLoadingSettings ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : settings ? (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>School Settings</CardTitle>
                  <CardDescription>Configure features for your school</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-semibold">Enable Voice Features</Label>
                      <p className="text-sm text-muted-foreground">Allow students to interact with AI using voice</p>
                    </div>
                    <Switch
                      checked={settings.voiceEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, voiceEnabled: checked })
                      }
                    />
                  </div>

                  {settings.voiceEnabled && (
                    <div className="flex flex-col gap-4 pl-4 border-l-2 border-primary">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-semibold">Enable Text-to-Speech</Label>
                          <p className="text-sm text-muted-foreground">AI can read responses aloud for students</p>
                        </div>
                        <Switch
                          checked={settings.textToSpeechEnabled}
                          onCheckedChange={(checked) =>
                            setSettings({ ...settings, textToSpeechEnabled: checked })
                          }
                        />
                      </div>

                      <div className="pt-4 border-t border-border/50">
                        <Label className="text-base font-semibold mb-3 block">Class Voice Access</Label>
                        <p className="text-sm text-muted-foreground mb-4">Select which classes have access to voice features</p>

                        {isLoadingClasses ? (
                           <p className="text-sm text-muted-foreground">Loading classes...</p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {classes.map((cls) => (
                              <div key={cls._id} className="flex items-center space-x-2">
                                <Switch
                                  id={`class-${cls._id}`}
                                  checked={settings.classesWithVoiceAccess.includes(cls._id!)}
                                  onCheckedChange={(checked) => {
                                    const current = settings.classesWithVoiceAccess;
                                    const updated = checked
                                      ? [...current, cls._id!]
                                      : current.filter(id => id !== cls._id);
                                    setSettings({ ...settings, classesWithVoiceAccess: updated });
                                  }}
                                />
                                <Label htmlFor={`class-${cls._id}`}>{cls.name}</Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-border">
                    <Button
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleSaveSettings}
                      disabled={isSavingSettings}
                    >
                      {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
