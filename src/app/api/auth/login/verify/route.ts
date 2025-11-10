import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/webauthn';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const credential = await req.json();

    // Verify the authentication response
    const { verification, user } = await verifyAuth(credential);

    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Authentication verification failed' },
        { status: 400 }
      );
    }

    // Create session for the user
    await createSession(user.id);

    return NextResponse.json({ verified: true, userId: user.id });
  } catch (error) {
    console.error('Login verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify login' },
      { status: 500 }
    );
  }
}
