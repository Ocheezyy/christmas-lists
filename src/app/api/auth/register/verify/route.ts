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

    // Clear the invite token
    await prisma.user.update({
      where: { inviteToken },
      data: { inviteToken: null, inviteExpires: null }
    });

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