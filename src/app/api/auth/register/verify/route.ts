import { NextResponse } from 'next/server';
import { verifyReg } from '@/lib/webauthn';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const registrationCookie = cookieStore.get('registration');
    if (!registrationCookie) {
      return NextResponse.json(
        { error: 'Registration session expired' },
        { status: 400 }
      );
    }

    const { userId, name, inviteToken } = JSON.parse(registrationCookie.value);
    const response = await req.json();

    // Verify the registration
    const verification = await verifyReg(userId, name, response);
    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Registration verification failed' },
        { status: 400 }
      );
    }

    // The user was already created by verifyReg in webauthn.ts
    // Clear the invite token from the user
    await prisma.user.update({
      where: { inviteToken },
      data: { 
        inviteToken: null,
        inviteExpires: null,
      },
    });

    // Create session for the newly registered user
    await createSession(userId);

    // Clear registration cookie
    cookieStore.delete('registration');

    return NextResponse.json({ verified: true, userId });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to verify registration' },
      { status: 500 }
    );
  }
}