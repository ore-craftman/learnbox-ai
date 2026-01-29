import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSchoolSettings, updateSchoolSettings } from '@/lib/db-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await getSchoolSettings('default-school');
    
    return NextResponse.json({
      settings: settings || {
        schoolId: 'default-school',
        voiceEnabled: false,
        textToSpeechEnabled: false,
        classesWithVoiceAccess: [],
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    await updateSchoolSettings('default-school', {
      voiceEnabled: body.voiceEnabled || false,
      textToSpeechEnabled: body.textToSpeechEnabled || false,
      classesWithVoiceAccess: body.classesWithVoiceAccess || [],
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
