import { getCurrentUser } from '@/lib/auth';
import { getAssessmentById } from '@/lib/db-utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, Printer, Download, FileText } from 'lucide-react';
import Link from 'next/link';
import PrintButton from '../print-button';

export default async function AssessmentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await getCurrentUser();

  const id = params.id;

  if (!user || user.role !== 'teacher') {
    redirect('/login');
  }

  let assessment = null;
  try {
     assessment = await getAssessmentById(id);
  } catch (err) {
      console.error('Error fetching assessment:', err);
  }

  if (!assessment) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header - Hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/teacher/assessments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assessment Details</h1>
            <p className="text-muted-foreground">
              View and print this assessment
            </p>
          </div>
        </div>
        <div className="flex gap-2">
            <PrintButton />
        </div>
      </div>

      {/* Assessment Content - This is what gets printed */}
      <div className="bg-white p-8 rounded-lg shadow-sm border print:shadow-none print:border-0 print:p-0">
        <div className="text-center border-b pb-6 mb-6">
          <h1 className="text-3xl font-bold mb-2 uppercase tracking-wider">{assessment.title}</h1>
          <div className="flex justify-center gap-8 text-sm font-medium text-gray-600">
            <span>Subject: {assessment.subject}</span>
            <span>Class: {assessment.classId}</span>
            <span>Term: {assessment.term}</span>
          </div>
          <div className="flex justify-center gap-8 text-sm font-medium text-gray-600 mt-2">
            <span>Duration: _______ Minutes</span>
            {assessment.totalMarks > 0 && <span>Total Marks: {assessment.totalMarks}</span>}
          </div>
          <div className="mt-4 text-left">
             <span className="font-bold">Name: __________________________________________________</span>
             <span className="float-right font-bold">Date: __________________</span>
          </div>
        </div>

        <div className="space-y-8">
          {assessment.questions.map((question: any, index: number) => (
            <div key={index} className="break-inside-avoid">
              <div className="flex gap-4">
                <span className="font-bold text-lg min-w-[2rem]">{index + 1}.</span>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                     <p className="text-lg font-medium leading-relaxed mb-3">{question.question}</p>
                     {question.marks > 0 && (
                       <span className="text-sm font-bold bg-gray-100 px-2 py-1 rounded ml-4 whitespace-nowrap print:border print:border-gray-300">
                         [{question.marks} Marks]
                       </span>
                     )}
                  </div>

                  {question.type === 'multiple_choice' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 pl-2">
                      {question.options?.map((option: string, optIndex: number) => (
                         <div key={optIndex} className="flex items-center gap-3">
                           <span className="h-5 w-5 rounded-full border border-gray-400 flex items-center justify-center text-xs font-bold text-gray-500">
                             {String.fromCharCode(65 + optIndex)}
                           </span>
                           <span>{option}</span>
                         </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'short_answer' && (
                    <div className="mt-4 h-12 border-b border-gray-300 border-dashed w-full opacity-50"></div>
                  )}

                  {question.type === 'theory' && (
                    <div className="mt-2 space-y-6 opacity-30">
                       <div className="border-b border-gray-400 h-8"></div>
                       <div className="border-b border-gray-400 h-8"></div>
                       <div className="border-b border-gray-400 h-8"></div>
                       <div className="border-b border-gray-400 h-8"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-gray-400 print:block hidden">
          Generated by LearnBox AI - Empowering Education
        </div>

        {/* Answer Sheet - Printed on a new page */}
        <div className="mt-12 print:mt-0 print:block page-break-before-always" style={{ pageBreakBefore: 'always' }}>
           <div className="text-center border-b pb-6 mb-8 pt-8 border-t-2 border-gray-100 print:border-t-0">
            <h1 className="text-2xl font-bold mb-2 uppercase tracking-wider">Answer Key</h1>
            <p className="text-sm text-gray-600">{assessment.title} - {assessment.classId} - {assessment.subject}</p>
          </div>

          <div className="space-y-4">
            {assessment.questions.map((question: any, index: number) => (
              <div key={index} className="flex gap-4 p-2 border-b border-gray-100 break-inside-avoid">
                 <span className="font-bold min-w-[2rem]">{index + 1}.</span>
                 <div>
                    <p className="text-sm text-gray-500 mb-1">{question.question}</p>
                    <p className="font-medium text-gray-900">
                      Answer: <span className="font-bold">{question.correctAnswer || 'N/A'}</span>
                    </p>
                 </div>
              </div>
            ))}
          </div>
           <div className="mt-12 pt-8 border-t text-center text-sm text-gray-400">
            Teacher Reference Only
          </div>
        </div>
      </div>
    </div>
  );
}
