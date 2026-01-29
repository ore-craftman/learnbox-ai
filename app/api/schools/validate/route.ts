import { NextRequest, NextResponse } from 'next/server';
import { getSchoolBySlug } from '@/lib/db-utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'School slug is required' }, { status: 400 });
  }

  try {
    const school = await getSchoolBySlug(slug);

    if (!school) {
        return NextResponse.json({ exists: false }, { status: 404 });
    }

    return NextResponse.json({ exists: true });
  } catch (error) {
    console.error('Error validating school:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
