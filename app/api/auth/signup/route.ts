import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db-utils';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';
import { UserRole } from '@/lib/db-schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, schoolId, classId } = body;

    // Validate input
    if (!email || !password || !name || !role || !schoolId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if role is valid
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = await createUser({
      email,
      password: hashedPassword,
      name,
      role: role as UserRole,
      schoolId,
      classId: role === UserRole.STUDENT ? classId : undefined,
    });

    // Create token
    const token = await createToken(userId, email, role);

    // Set cookie
    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: 'User created successfully',
        userId,
        role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
