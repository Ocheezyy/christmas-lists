import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all items purchased by the current user
    const purchases = await prisma.item.findMany({
      where: {
        purchasedBy: user.id,
        purchased: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        priority: true,
        list: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        list: {
          updatedAt: 'desc',
        },
      },
    });

    return NextResponse.json({
      purchases,
      userName: user.name,
    });
  } catch (error) {
    console.error('Failed to fetch purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}
