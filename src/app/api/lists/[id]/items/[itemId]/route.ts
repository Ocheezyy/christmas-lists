import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get('session')?.value;
    
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const list = await prisma.list.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        items: true,
      },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json({ list, currentUserId });
  } catch (error) {
    console.error('Failed to fetch list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch list' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get('session')?.value;
    
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { purchased } = await request.json();

    // Find the list and check if the current user owns it
    const list = await prisma.list.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Don't allow list owners to mark their own items as purchased
    if (list.userId === currentUserId) {
      return NextResponse.json(
        { error: 'Cannot mark your own items as purchased' },
        { status: 403 }
      );
    }

    // Update the item
    const item = await prisma.item.update({
      where: { id: itemId },
      data: {
        purchased,
        purchasedBy: purchased ? currentUserId : null,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to update item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}