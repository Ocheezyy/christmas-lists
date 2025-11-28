import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await prisma.list.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { priority: 'desc' },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Fetch purchaser information for items
    const itemsWithPurchaserInfo = await Promise.all(
      list.items.map(async (item: { purchased: boolean; purchasedBy: string | null; [key: string]: unknown }) => {
        if (item.purchased && item.purchasedBy) {
          const purchaser = await prisma.user.findUnique({
            where: { id: item.purchasedBy },
            select: { name: true },
          });
          return {
            ...item,
            purchaserName: purchaser?.name || 'Unknown',
          };
        }
        return item;
      })
    );

    // If viewing own list, remove purchase information
    const sanitizedList = list.userId === user.id 
      ? {
          ...list,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
          items: itemsWithPurchaserInfo.map(({ purchased, purchasedBy, purchaserName, ...item }: any) => item)
        }
      : {
          ...list,
          items: itemsWithPurchaserInfo,
        };

    return NextResponse.json({
      list: sanitizedList,
      currentUserId: user.id,
    });
  } catch (error) {
    console.error("Failed to fetch list:", error);
    return NextResponse.json(
      { error: "Failed to fetch list" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the list belongs to the current user
    const existingList = await prisma.list.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingList) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    if (existingList.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own lists" },
        { status: 403 }
      );
    }

    const { name, items } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    // Validate prices
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.price && item.price.trim() !== "") {
        const parsedPrice = parseFloat(item.price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          return NextResponse.json(
            { error: `Invalid price for item "${item.title}": "${item.price}"` },
            { status: 400 }
          );
        }
      }
    }

    // Get existing items to determine what to update, create, or delete
    const existingItems = await prisma.item.findMany({
      where: { listId: id },
      select: { id: true },
    });

    const existingItemIds = existingItems.map(item => item.id);
    const incomingItemIds = items.filter(item => item.id).map(item => item.id);

    // Items to delete: existing items that are not in the incoming list
    const itemsToDelete = existingItemIds.filter(id => !incomingItemIds.includes(id));

    // Update the list and handle items
    const list = await prisma.list.update({
      where: { id },
      data: {
        name: name || null,
        items: {
          // Update existing items
          update: items
            .filter(item => item.id && existingItemIds.includes(item.id))
            .map(item => ({
              where: { id: item.id },
              data: {
                title: item.title,
                description: item.description || null,
                url: item.url || null,
                imageUrl: item.imageUrl || null,
                price: item.price && item.price.trim() !== "" ? parseFloat(item.price) : null,
                priority: item.priority || 0,
              },
            })),
          // Create new items (items without an id)
          create: items
            .filter(item => !item.id)
            .map(item => ({
              title: item.title,
              description: item.description || null,
              url: item.url || null,
              imageUrl: item.imageUrl || null,
              price: item.price && item.price.trim() !== "" ? parseFloat(item.price) : null,
              priority: item.priority || 0,
            })),
          // Delete items that are no longer in the list
          delete: itemsToDelete.map(itemId => ({ id: itemId })),
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
    console.error("Failed to update list:", error);
    return NextResponse.json(
      { error: "Failed to update list" },
      { status: 500 }
    );
  }
}
