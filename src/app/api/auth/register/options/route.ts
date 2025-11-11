import { NextResponse } from 'next/server';
import { getRegOptions } from '@/lib/webauthn';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { name, inviteToken } = await req.json();

    // Verify invite token and get the existing user
    const invite = await prisma.user.findUnique({
      where: { inviteToken },
      select: { 
        id: true,
        inviteExpires: true 
      }
    });

    if (!invite || !invite.inviteExpires || invite.inviteExpires < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired invite link' },
        { status: 403 }
      );
    }

    // Use the existing user's ID from the invite
    const userId = invite.id;
    
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