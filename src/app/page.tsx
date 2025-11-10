import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";
import { UserWithLists } from "@/types/user";

async function getLists(): Promise<UserWithLists[] | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session')?.value;
  if (!userId) return null;

  return await prisma.user.findMany({
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
              // Only show purchasedBy if it's the current user
              purchasedBy: true,
            },
          },
        },
      },
    },
  });
}

export default async function HomePage() {
  const users = await getLists();
  const cookieStore = await cookies();
  const currentUserId = cookieStore.get('session')?.value;

  if (!users || !currentUserId) {
    return (
      <div className="text-center mt-10">
        <p>Please log in to view lists.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Family Christmas Lists</h1>
        <Link
          href="/list/new"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Create New List
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.map((user) => (
          <div
            key={user.id}
            className="border rounded-lg p-6 bg-white shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-4">{user.name}&apos;s Lists</h2>
            {user.lists.length === 0 ? (
              <p className="text-gray-500">No lists created yet.</p>
            ) : (
              <div className="space-y-4">
                {user.lists.map((list) => (
                  <div key={list.id} className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <Link
                        href={`/list/${list.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View List
                      </Link>
                      <span className="text-sm text-gray-600">
                        {list.items.filter(item => !item.purchased).length} items remaining
                      </span>
                    </div>
                    {user.id === currentUserId ? (
                      // Show all items for the current user's own list
                      <ul className="space-y-2">
                        {list.items.map((item) => (
                          <li
                            key={item.id}
                            className={`text-sm ${
                              item.purchased ? 'text-gray-400 line-through' : ''
                            }`}
                          >
                            {item.title}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      // Show only unpurchased items for other users' lists
                      <ul className="space-y-2">
                        {list.items
                          .filter(
                            (item) =>
                              !item.purchased ||
                              item.purchasedBy === currentUserId
                          )
                          .map((item) => (
                            <li
                              key={item.id}
                              className={`text-sm ${
                                item.purchasedBy === currentUserId
                                  ? 'text-green-600'
                                  : ''
                              }`}
                            >
                              {item.title}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
