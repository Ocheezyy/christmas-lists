'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

interface Item {
  title: string;
  description: string;
  url?: string;
}

interface DeleteConfirmationModalProps {
  itemTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmationModal({ itemTitle, onConfirm, onCancel }: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Delete Item?</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete &quot;{itemTitle}&quot;? This cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

interface PreviewModalProps {
  items: Item[];
  onClose: () => void;
  onConfirm: () => void;
}

function PreviewModal({ items, onClose, onConfirm }: PreviewModalProps) {
  const [editableItems, setEditableItems] = useState(items);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ index: number; title: string } | null>(null);
  const validItems = editableItems.filter(item => item.title.trim() !== '');

  const handleEdit = (index: number, field: keyof Item, value: string) => {
    const newItems = [...editableItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditableItems(newItems);
  };

  const handleSave = () => {
    // Update the parent's items before confirming
    items.splice(0, items.length, ...editableItems);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {deletingItem && (
          <DeleteConfirmationModal
            itemTitle={deletingItem.title}
            onConfirm={() => {
              const newItems = editableItems.filter((_, i) => i !== deletingItem.index);
              setEditableItems(newItems);
              setDeletingItem(null);
            }}
            onCancel={() => setDeletingItem(null)}
          />
        )}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Preview Your List</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {validItems.length === 0 ? (
            <p className="text-gray-500">No items in your list yet.</p>
          ) : (
            <div className="space-y-6">
              {validItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 transition-all">
                  {editingIndex === index ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleEdit(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={item.description}
                          onChange={(e) => handleEdit(index, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL (optional)
                        </label>
                        <input
                          type="url"
                          value={item.url || ''}
                          onChange={(e) => handleEdit(index, 'url', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative">
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingIndex(index)}
                          className="p-2 text-gray-500 hover:text-gray-700"
                        >
                          Edit
                        </button>
                        {validItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setDeletingItem({ 
                              index: editableItems.indexOf(item),
                              title: item.title
                            })}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                      {item.description && (
                        <p className="text-gray-600 mb-2">{item.description}</p>
                      )}
                      {item.url && (
                        <Link
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Item →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-6 border-t bg-gray-50 flex justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={validItems.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            Submit List
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewListPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([{ title: '', description: '', url: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const addItem = () => {
    setItems([...items, { title: '', description: '', url: '' }]);
  };

  const updateItem = (index: number, field: keyof Item, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Filter out empty items
      const validItems = items.filter(item => item.title.trim() !== '');
      
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validItems }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create list');
      }

      router.push('/'); // Redirect to home page
      router.refresh(); // Refresh the page data
    } catch (error) {
      console.error('Failed to create list:', error);
      alert('Failed to create list. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Christmas List</h1>
      <form onSubmit={handlePreview}>
        {showPreview && (
          <PreviewModal
            items={items}
            onClose={() => setShowPreview(false)}
            onConfirm={handleSubmit}
          />
        )}
        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Item {index + 1}</h3>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor={`title-${index}`} className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    id={`title-${index}`}
                    value={item.title}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`description-${index}`} className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id={`description-${index}`}
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`url-${index}`} className="block text-sm font-medium text-gray-700">
                    URL (optional)
                  </label>
                  <input
                    type="url"
                    id={`url-${index}`}
                    value={item.url}
                    onChange={(e) => updateItem(index, 'url', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-4">
          <button
            type="button"
            onClick={addItem}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Add Another Item
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !items.some(item => item.title.trim() !== '')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isSubmitting ? 'Creating...' : 'Preview List'}
          </button>
        </div>
      </form>
    </div>
  );
}