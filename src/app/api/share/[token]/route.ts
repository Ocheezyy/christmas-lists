import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { token: string } }) {
  try {
    const token = params.token;
    const share = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        list: {
          include: {
            user: true,
            items: true,
          },
        },
      },
    });

    if (!share) return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    if (share.expiresAt < new Date()) return NextResponse.json({ error: 'Share link expired' }, { status: 410 });

    return NextResponse.json({ list: share.list });
  } catch (error) {
    console.error('Failed to fetch shared list:', error);
    return NextResponse.json({ error: 'Failed to fetch shared list' }, { status: 500 });
  }
}
