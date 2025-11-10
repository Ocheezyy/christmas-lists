import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ token: string; itemId: string }> }) {
  try {
    const { token, itemId } = await params;

    // Require authentication for purchasing
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', requiresAuth: true }, { status: 401 });
    }

    const share = await prisma.shareLink.findUnique({ where: { token } });
    if (!share) return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    if (share.expiresAt < new Date()) return NextResponse.json({ error: 'Share link expired' }, { status: 410 });

    // Ensure item belongs to the shared list
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item || item.listId !== share.listId) {
      return NextResponse.json({ error: 'Item not found for this share link' }, { status: 404 });
    }

    const { purchased } = await request.json();

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: {
        purchased,
        purchasedBy: purchased ? user.id : null,
      },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('Failed to toggle purchase via share link:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}
