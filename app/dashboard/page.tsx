'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  console.log('[v0] User logged in:', user?.role);

  useEffect(() => {
    if (!isLoading) {
       if (!user) {
         router.push('/login');
       } else if (user.role === 'student') {
         router.push('/dashboard/tutor');
       }
    }
  }, [user, isLoading, router]);

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

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getDashboardContent = () => {
    switch (user.role) {
      case 'student':
        return null; // Students are redirected to /dashboard/tutor

      case 'teacher':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Teacher Dashboard</h2>
              <p className="text-muted-foreground mb-6">Manage your class materials and assessments</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">Upload Materials</CardTitle>
                  <CardDescription>Add learning resources</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => router.push('/dashboard/teacher?tab=upload')}
                  >
                    Upload
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">Generate Assessment</CardTitle>
                  <CardDescription>Create AI-powered tests</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => router.push('/dashboard/teacher?tab=assessment')}
                  >
                    Create
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">Manage Resources</CardTitle>
                  <CardDescription>View and manage uploaded materials</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => router.push('/dashboard/teacher?tab=resources')}
                  >
                    Manage
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">View Assessments</CardTitle>
                  <CardDescription>View generated assessments</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => router.push('/dashboard/teacher/assessments')}
                  >
                    View All
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'admin':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Admin Dashboard</h2>
              <p className="text-muted-foreground mb-6">Manage your school settings and users</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">Manage Users</CardTitle>
                  <CardDescription>Add/remove users</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => router.push('/dashboard/admin')}
                  >
                    Manage
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">School Settings</CardTitle>
                  <CardDescription>Configure school</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => router.push('/dashboard/admin')}
                  >
                    Settings
                  </Button>
                </CardContent>
              </Card>

              {/* <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">View Analytics</CardTitle>
                  <CardDescription>Monitor usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full bg-transparent">
                    View
                  </Button>
                </CardContent>
              </Card> */}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">LearnBox AI</h1>
            <p className="text-sm text-muted-foreground">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {getDashboardContent()}
      </main>
    </div>
  );
}
