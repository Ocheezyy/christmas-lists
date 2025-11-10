import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUserId = user.id;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        lists: {
          include: {
            items: {
              select: {
                id: true,
                title: true,
                purchased: true,
                purchasedBy: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ users, currentUserId });
  } catch (error) {
    console.error('Failed to fetch lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lists' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = user.id;

    const { items } = await request.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Create a new list with items
    const list = await prisma.list.create({
      data: {
        userId,
        items: {
          create: items.map(item => ({
            title: item.title,
            description: item.description,
            url: item.url || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error('Failed to create list:', error);
    return NextResponse.json(
      { error: 'Failed to create list' },
      { status: 500 }
    );
  }
}