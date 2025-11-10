import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthOptions } from '@/lib/webauthn';

export async function POST() {
  try {
    // Generate authentication options (allow any registered credential)
    const options = await getAuthOptions();
    
    // Store challenge in a cookie since we don't know the user ID yet
    const cookieStore = await cookies();
    cookieStore.set('auth-challenge', options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 5 * 60, // 5 minutes
    });
    
    return NextResponse.json(options);
  } catch (error) {
    console.error('Login options error:', error);
    return NextResponse.json(
      { error: 'Failed to generate login options' },
      { status: 500 }
    );
  }
}
