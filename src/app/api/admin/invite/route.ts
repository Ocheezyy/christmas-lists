import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const token = nanoid(12);
    const userId = nanoid();

    // Create a placeholder user with invite token
    // The actual credentials will be added during registration
    await prisma.user.create({
      data: {
        id: userId,
        name,
        credentialId: `placeholder-${userId}`, // Temporary placeholder
        publicKey: Buffer.from([]), // Empty buffer, will be replaced on registration
        inviteToken: token,
        inviteExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    const url = `${process.env.NEXT_PUBLIC_ORIGIN}/invite/${token}`;
    
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Failed to create invite:', error);
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    );
  }
}
