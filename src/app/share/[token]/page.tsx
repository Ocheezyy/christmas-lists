'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';

interface Item {
  id: string;
  title: string;
  description: string;
  url?: string;
  purchased: boolean;
  purchasedBy?: string | null;
}

interface List {
  id: string;
  userId: string;
  user: { name: string };
  items: Item[];
}

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [list, setList] = useState<List | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json?.error || 'Failed to fetch');
        }
        const { list } = await res.json();
        setList(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shared list');
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [token]);

  const togglePurchase = async (itemId: string, currentlyPurchased: boolean) => {
    setProcessing(itemId);
    try {
      const res = await fetch(`/api/share/${token}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchased: !currentlyPurchased }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error || 'Failed to update');
      }

      const { item } = await res.json();
      setList((prev) => {
        if (!prev) return prev;
        return { ...prev, items: prev.items.map(i => i.id === item.id ? item : i) };
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setProcessing(null);
    }
  };

  const shareToOS = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${list?.user.name}'s list`, url });
      } catch {
        // ignore
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard');
    } catch {
      alert(url);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error || !list) return (
    <div className="p-6">
      <p className="text-red-600">{error || 'Shared list not found'}</p>
      <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">Return home</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{list.user.name}&apos;s List</h1>
          <p className="text-sm text-gray-600">Share link valid until it&apos;s expired</p>
        </div>
        <div className="flex gap-2">
          <button onClick={shareToOS} className="px-3 py-2 bg-gray-100 rounded-md">Share</button>
          <Link href="/" className="px-3 py-2 bg-white border rounded-md">Home</Link>
        </div>
      </div>

      <div className="space-y-4">
        {list.items
          .filter(item => !item.purchased || item.purchasedBy === `share:${token}`)
          .map(item => (
            <div key={item.id} className={`border rounded-lg p-4 ${item.purchased ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`font-semibold ${item.purchased ? 'text-gray-500' : ''}`}>{item.title}</h3>
                  {item.description && <p className={`text-sm ${item.purchased ? 'text-gray-400' : 'text-gray-600'}`}>{item.description}</p>}
                  {item.url && <Link href={item.url} target="_blank" className="text-blue-600 text-sm hover:underline">View Item →</Link>}
                </div>
                <div>
                  <button
                    onClick={() => togglePurchase(item.id, item.purchased)}
                    disabled={processing === item.id}
                    className={`px-3 py-2 rounded-md ${item.purchased ? 'bg-gray-100 text-gray-600' : 'bg-green-600 text-white'}`}
                  >
                    {processing === item.id ? '...' : item.purchased ? 'Unpurchase' : 'Mark as Purchased'}
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {list.items.length === 0 && <p className="text-center text-gray-500 mt-8">No items in this list yet.</p>}
    </div>
  );
}
