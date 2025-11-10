import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/webauthn';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const challenge = cookieStore.get('auth-challenge')?.value;
    
    if (!challenge) {
      return NextResponse.json(
        { error: 'Authentication session expired' },
        { status: 400 }
      );
    }
    
    const credential = await req.json();

    // Verify the authentication response
    const { verification, user } = await verifyAuth(credential, challenge);

    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Authentication verification failed' },
        { status: 400 }
      );
    }

    // Create session for the user
    await createSession(user.id);
    
    // Clear the challenge cookie
    cookieStore.delete('auth-challenge');

    return NextResponse.json({ verified: true, userId: user.id });
  } catch (error) {
    console.error('Login verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify login' },
      { status: 500 }
    );
  }
}
