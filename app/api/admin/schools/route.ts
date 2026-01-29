
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSchool, getAllSchools, updateSchoolSettings } from '@/lib/db-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schools = await getAllSchools();
    return NextResponse.json({ schools });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, address, contactEmail } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and Slug are required' }, { status: 400 });
    }

    const schoolId = await createSchool({
      name,
      slug,
      address,
      contactEmail,
    });

    // Initialize default school settings
    await updateSchoolSettings(slug, {
        schoolId: slug,
        voiceEnabled: false,
        textToSpeechEnabled: false,
        classesWithVoiceAccess: []
    });

    return NextResponse.json({ success: true, schoolId });
  } catch (error: any) {
    console.error('Error creating school:', error);
    return NextResponse.json({ error: error.message || 'Failed to create school' }, { status: 500 });
  }
}
