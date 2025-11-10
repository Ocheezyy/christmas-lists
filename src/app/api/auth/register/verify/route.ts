import { NextResponse } from 'next/server';
import { verifyReg } from '@/lib/webauthn';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

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

    const { userId, inviteToken } = JSON.parse(registrationCookie.value);
    const response = await req.json();

    // Verify the registration
    const verification = await verifyReg(userId, response);
    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Registration verification failed' },
        { status: 400 }
      );
    }

    // The user was already created by verifyReg in webauthn.ts
    // Now just clear the invite token from the placeholder user if it exists
    const placeholderUser = await prisma.user.findUnique({
      where: { inviteToken },
    });

    if (placeholderUser && placeholderUser.credentialId.startsWith('placeholder-')) {
      // Delete the placeholder user since we created a real one
      await prisma.user.delete({
        where: { id: placeholderUser.id },
      });
    }

    // Clear registration cookie
    cookieStore.delete('registration');

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to verify registration' },
      { status: 500 }
    );
  }
}