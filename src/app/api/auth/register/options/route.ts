import { NextResponse } from 'next/server';
import { getRegOptions } from '@/lib/webauthn';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(req: Request) {
  try {
    const { name, inviteToken } = await req.json();

    // Verify invite token
    const invite = await prisma.user.findUnique({
      where: { inviteToken },
      select: { inviteExpires: true }
    });

    if (!invite || !invite.inviteExpires || invite.inviteExpires < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired invite link' },
        { status: 403 }
      );
    }

    // Generate a new user ID
    const userId = randomBytes(32).toString('hex');
    
    // Get registration options
    const options = await getRegOptions(userId, name);
    
    // Store registration data in cookies
    const cookieStore = await cookies();
    cookieStore.set('registration', JSON.stringify({
      userId,
      name,
      inviteToken
    }), { httpOnly: true, secure: true, maxAge: 300 }); // 5 minutes

    return NextResponse.json(options);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to start registration' },
      { status: 500 }
    );
  }
}