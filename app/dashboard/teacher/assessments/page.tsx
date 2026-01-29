import { getCurrentUser } from '@/lib/auth';
import { getAssessmentsByTeacher } from '@/lib/db-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, BookOpen, Layers, ArrowRight } from 'lucide-react';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AssessmentsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'teacher') {
    redirect('/login');
  }

  const assessments = await getAssessmentsByTeacher(user.userId);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground">
            Manage and view your generated assessments
          </p>
        </div>
        <Link href="/dashboard/teacher">
          <Button variant="outline">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assessments.map((assessment: any) => (
          <Card key={assessment._id.toString()} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg line-clamp-1">{assessment.title}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {assessment.subject}
                  </CardDescription>
                </div>
                <Badge variant={
                  assessment.difficultyLevel === 'hard' ? 'destructive' :
                  assessment.difficultyLevel === 'medium' ? 'default' : 'secondary'
                }>
                  {assessment.difficultyLevel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Layers className="h-4 w-4 mr-2" />
                  Class: {assessment.classId}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created: {new Date(assessment.createdAt).toLocaleDateString()}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="font-medium text-foreground">
                    {assessment.questions.length} Questions
                  </span>
                  <Link href={`/dashboard/teacher/assessments/${assessment._id.toString()}`}>
                    <Button variant="outline" size="sm">
                      View Details <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {assessments.length === 0 && (
          <div className="col-span-full text-center py-12 border rounded-lg bg-muted/20">
            <h3 className="text-lg font-medium text-muted-foreground">No assessments yet</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Generate your first assessment from the dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
