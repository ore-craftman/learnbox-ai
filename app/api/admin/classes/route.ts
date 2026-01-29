import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getClassesBySchool } from '@/lib/db-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In a real app, user.schoolId would guide this.
    // Defaults to 'default-school' if not present or passed via context.
    const schoolId = user.schoolId || 'default-school';

    const classes = await getClassesBySchool(schoolId);

    return NextResponse.json({
      classes,
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}
