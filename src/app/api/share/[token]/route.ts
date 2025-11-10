import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
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

    // Remove purchase data from items to prevent spoilers
    const itemsWithoutPurchaseData = share.list.items.map((item: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { purchased, purchasedBy, purchaserName, ...itemWithoutPurchaseInfo } = item;
      return itemWithoutPurchaseInfo;
    });

    // Serialize the response to handle BigInt fields
    const serializedList = JSON.parse(
      JSON.stringify({
        ...share.list,
        items: itemsWithoutPurchaseData,
      }, (_, value) => 
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json({ 
      list: serializedList
    });
  } catch (error) {
    console.error('Failed to fetch shared list:', error);
    return NextResponse.json({ error: 'Failed to fetch shared list' }, { status: 500 });
  }
}
