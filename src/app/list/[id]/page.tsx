'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Item {
  id: string;
  title: string;
  description: string;
  url?: string;
  purchased: boolean;
  purchasedBy?: string;
}

interface List {
  id: string;
  userId: string;
  user: {
    name: string;
  };
  items: Item[];
}

export default function ListPage({ params }: { params: { id: string } }) {
  const [list, setList] = useState<List | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    // Fetch list data
    const fetchList = async () => {
      try {
        const response = await fetch(`/api/lists/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to load list');
        }
        const data = await response.json();
        setList(data.list);
        setCurrentUserId(data.currentUserId);
      } catch (err) {
        setError('Failed to load the list. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [params.id]);

  const handlePurchaseToggle = async (itemId: string, currentlyPurchased: boolean) => {
    try {
      const response = await fetch(`/api/lists/${params.id}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchased: !currentlyPurchased }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      // Update the local state
      // @ts-expect-error type wont match
      setList(prevList => {
        if (!prevList) return null;
        return {
          ...prevList,
          items: prevList.items.map(item =>
            item.id === itemId
              ? {
                  ...item,
                  purchased: !currentlyPurchased,
                  purchasedBy: !currentlyPurchased ? currentUserId : undefined,
                }
              : item
          ),
        };
      });
    } catch (err) {
      alert('Failed to update item. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-red-600">{error || 'List not found'}</p>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  const isOwnList = currentUserId === list.userId;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Lists
          </Link>
          <h1 className="text-3xl font-bold">{list.user.name}&apos;s List</h1>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={async () => {
              if (shareLoading) return;
              setShareLoading(true);
              try {
                const res = await fetch(`/api/lists/${params.id}/share`, { method: 'POST' });
                if (!res.ok) {
                  const json = await res.json();
                  throw new Error(json?.error || 'Failed to create share link');
                }
                const { token } = await res.json();
                const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_ORIGIN || '');
                const shareUrl = `${origin}/share/${token}`;

                if (navigator.share) {
                  try {
                    await navigator.share({ title: `${list.user.name}'s list`, url: shareUrl });
                    setShareLoading(false);
                    return;
                  } catch {
                    // fallback to clipboard
                  }
                }

                await navigator.clipboard.writeText(shareUrl);
                alert('Share link copied to clipboard');
              } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to create share link');
              } finally {
                setShareLoading(false);
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            title="Create a temporary share link for this list"
          >
            {shareLoading ? 'Creating…' : 'Share List'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {list.items
          .filter(item => {
            // Show all items if it's the owner's list
            if (isOwnList) return true;
            // Show unpurchased items or items purchased by the current user
            return !item.purchased || item.purchasedBy === currentUserId;
          })
          .map(item => (
            <div
              key={item.id}
              className={`border rounded-lg p-6 bg-white shadow-sm ${
                item.purchased ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-grow">
                  <h3 className={`text-xl font-semibold ${
                    item.purchased ? 'text-gray-500' : ''
                  }`}>
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className={`${item.purchased ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.description}
                    </p>
                  )}
                  {item.url && (
                    <Link
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm inline-block mt-2"
                    >
                      View Item →
                    </Link>
                  )}
                </div>
                {!isOwnList && (
                  <button
                    onClick={() => handlePurchaseToggle(item.id, item.purchased)}
                    className={`ml-4 px-4 py-2 rounded-md ${
                      item.purchased
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {item.purchasedBy === currentUserId
                      ? 'Unpurchase'
                      : item.purchased
                      ? 'Already Purchased'
                      : 'Mark as Purchased'}
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      {list.items.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No items in this list yet.</p>
      )}
    </div>
  );
}