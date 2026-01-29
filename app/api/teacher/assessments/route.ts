import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAssessment, getResourcesByClassAndSubject } from '@/lib/db-utils';
import { ChatOpenAI } from '@langchain/openai';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, classId, subject, term, priorityTopics, difficultyLevel, questionCount } = body;

    if (!title || !classId || !subject || !priorityTopics || !difficultyLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get resources for context using Vector Search based on priority topics
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { searchSimilarDocuments } = require('@/lib/vector-store');

    // Construct a query from priority topics
    const query = priorityTopics.join(' ');

    const relevantDocs = await searchSimilarDocuments(query, {
      classId,
      subject,
    }, 10); // Check top 10 chunks to get good coverage

    if (relevantDocs.length === 0) {
      return NextResponse.json(
        { error: 'No learning materials available for these topics' },
        { status: 400 }
      );
    }

    // Combine resources for context
    const resourceContext = relevantDocs
      .map((r: any) => `[${r.metadata.title}]\n${r.content}`)
      .join('\n\n');

    // Generate assessment using AI
    const model = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4-turbo',
    });

    const generationPrompt = `Generate a ${difficultyLevel} difficulty assessment with ${questionCount || 10} questions for students studying "${subject}" in class ${classId}.

Priority topics to emphasize: ${priorityTopics.join(', ')}

Use ONLY information from these materials:
${resourceContext}

Format your response as a JSON array of questions with this structure:
[
  {
    "type": "multiple_choice",
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A"
  },
  {
    "type": "short_answer",
    "question": "Question text",
    "correctAnswer": "Expected answer"
  },
  {
    "type": "theory",
    "question": "Question text",
    "correctAnswer": "Model answer"
  }
]`;

    const response = await model.invoke([
      {
        role: 'user' as const,
        content: generationPrompt,
      },
    ]);

    const responseText = typeof response === 'string'
      ? response
      : typeof response.content === 'string' // Fallback if it is a message
        ? response.content
        : '';

    // Parse JSON from response
    let questions = [];
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error('Failed to parse questions JSON');
      return NextResponse.json(
        { error: 'Failed to generate valid assessment' },
        { status: 500 }
      );
    }

    // Calculate total marks (optional now)
    const totalMarks = 0;

    // Create assessment in database
    const assessmentId = await createAssessment({
      title,
      subject,
      classId,
      schoolId: user.schoolId || 'default-school',
      term: term || '1',
      generatedBy: user.userId,
      priorityTopics,
      difficultyLevel: difficultyLevel as 'easy' | 'medium' | 'hard',
      questions,
      totalMarks,
    });

    return NextResponse.json({
      message: 'Assessment created successfully',
      assessmentId,
      totalMarks,
      questionCount: questions.length,
    });
  } catch (error: any) {
    console.error('Assessment generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate assessment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subject = searchParams.get('subject');

    // Return empty assessments for now - implement database query later
    return NextResponse.json({
      assessments: [],
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}
