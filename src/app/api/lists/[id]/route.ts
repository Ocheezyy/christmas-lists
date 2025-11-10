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

    // If viewing own list, remove purchase information
    const sanitizedList = list.userId === user.id 
      ? {
          ...list,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
          items: list.items.map(({ purchased, purchasedBy, ...item }: any) => item)
        }
      : list;

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

    // Delete all existing items and create new ones
    // This is simpler than trying to diff and update individually
    await prisma.item.deleteMany({
      where: { listId: id },
    });

    const list = await prisma.list.update({
      where: { id },
      data: {
        name: name || null,
        items: {
          create: items.map((item) => ({
            title: item.title,
            description: item.description || null,
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
    console.error("Failed to update list:", error);
    return NextResponse.json(
      { error: "Failed to update list" },
      { status: 500 }
    );
  }
}
