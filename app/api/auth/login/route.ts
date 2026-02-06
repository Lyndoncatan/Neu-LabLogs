import { NextRequest, NextResponse } from 'next/server';

// Mock user database
const USERS = {
  'prof@lab.edu': { id: '1', role: 'professor', name: 'Dr. Smith' },
  'admin@lab.edu': { id: '2', role: 'admin', name: 'Admin User' },
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Basic demo authentication (all correct emails accept password "password")
    if (password !== 'password') {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const user = USERS[email as keyof typeof USERS];
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({ ...user, email });
  } catch (error) {
    console.error('[v0] Login error:', error);
    return NextResponse.json({ message: 'Login failed' }, { status: 500 });
  }
}
