import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSyllabus, getSyllabusByClassAndSubject } from '@/lib/db-utils';

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
    const { title, subject, classId, term, topics, content } = body;

    if (!title || !subject || !classId || !topics) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create syllabus in database
    const syllabusId = await createSyllabus({
      title,
      subject,
      classId,
      schoolId: 'default-school',
      term: term || '1',
      topics: topics || [],
      content: content || '',
      uploadedBy: user.userId,
    });

    return NextResponse.json({
      message: 'Syllabus created successfully',
      syllabusId,
    });
  } catch (error) {
    console.error('Syllabus creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create syllabus' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subject = searchParams.get('subject');

    if (!classId || !subject) {
       return NextResponse.json(
        { error: 'Missing classId or subject' },
        { status: 400 }
      );
    }

    const syllabus = await getSyllabusByClassAndSubject(classId, subject);

    return NextResponse.json({
      syllabus,
    });
  } catch (error) {
    console.error('Error fetching syllabus:', error);
    return NextResponse.json(
      { error: 'Failed to fetch syllabus' },
      { status: 500 }
    );
  }
}
