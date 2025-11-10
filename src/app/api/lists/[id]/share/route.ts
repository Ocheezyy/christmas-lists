import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUserId = user.id;

    // Verify list exists and current user is the owner
    const list = await prisma.list.findUnique({ where: { id } });
    if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 });
    if (list.userId !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create a token and a ShareLink record
    const token = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const share = await prisma.shareLink.create({
      data: {
        token,
        listId: id,
        createdBy: currentUserId,
        expiresAt,
      },
    });

    return NextResponse.json({ token: share.token, expiresAt: share.expiresAt });
  } catch (error) {
    console.error('Failed to create share link:', error);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}
