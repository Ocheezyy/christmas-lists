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
          select: {
            id: true,
            name: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            items: {
              select: {
                id: true,
                title: true,
                purchased: true,
                purchasedBy: true,
                priority: true,
              },
            },
          },
        },
      },
    });

    // Remove purchase information from current user's own lists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sanitizedUsers = users.map((u: any) => ({
      ...u,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lists: u.lists.map((list: any) => ({
        ...list,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: list.items.map((item: any) => {
          if (u.id === currentUserId) {
            // Remove purchase info from own lists
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { purchased, purchasedBy, ...rest } = item;
            return rest;
          }
          return item;
        })
      }))
    }));

    return NextResponse.json({ users: sanitizedUsers, currentUserId });
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

    const { name, items } = await request.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Create a new list with items
    const list = await prisma.list.create({
      data: {
        name: name || null,
        userId,
        items: {
          create: items.map(item => ({
            title: item.title,
            description: item.description,
            url: item.url || null,
            priority: item.priority || 0,
          })),
        },
      },
      include: {
        items: {
          orderBy: { priority: 'desc' },
        },
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