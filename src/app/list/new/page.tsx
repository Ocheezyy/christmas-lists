"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Trash2, Eye, Gift } from "lucide-react"
import Link from "next/link"

interface Item {
  title: string
  description: string
  url?: string
}

function PreviewModal({
  items,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  items: Item[]
  onClose: () => void
  onConfirm: (items: Item[]) => void
  isSubmitting: boolean
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editableItems, setEditableItems] = useState(items)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)

  const validItems = editableItems.filter((item) => item.title.trim() !== "")

  const handleEdit = (index: number, field: keyof Item, value: string) => {
    const newItems = [...editableItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setEditableItems(newItems)
  }

  const handleSave = () => {
    onConfirm(editableItems)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Preview Your List</CardTitle>
            <CardDescription>Review and edit before submitting</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {validItems.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No items in your list yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {validItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  {editingIndex === index ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Title</label>
                        <Input
                          value={item.title}
                          onChange={(e) => handleEdit(index, "title", e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Description</label>
                        <textarea
                          value={item.description}
                          onChange={(e) => handleEdit(index, "description", e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-md resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">URL (optional)</label>
                        <Input
                          type="url"
                          value={item.url || ""}
                          onChange={(e) => handleEdit(index, "url", e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setEditingIndex(null)} className="w-full">
                        Done Editing
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      {item.description && <p className="text-sm text-muted-foreground mb-2">{item.description}</p>}
                      {item.url && (
                        <Link href={item.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="link" size="sm" className="p-0 h-auto">
                            View Item →
                          </Button>
                        </Link>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" onClick={() => setEditingIndex(index)} className="flex-1">
                          Edit
                        </Button>
                        {validItems.length > 1 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletingIndex(index)}
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {deletingIndex === index && (
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded space-y-2">
                      <p className="text-sm">Delete this item? This cannot be undone.</p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setEditableItems(editableItems.filter((_, i) => i !== index))
                            setDeletingIndex(null)
                          }}
                          className="flex-1"
                        >
                          Delete
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeletingIndex(null)} className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <div className="border-t p-6 bg-muted/50 flex justify-between gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={validItems.length === 0 || isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin">⟳</span>
                Creating...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4" />
                Submit List
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function NewListPage() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([{ title: "", description: "", url: "" }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const addItem = () => {
    setItems([...items, { title: "", description: "", url: "" }])
  }

  const updateItem = (index: number, field: keyof Item, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault()
    const hasContent = items.some((item) => item.title.trim() !== "")
    if (!hasContent) {
      alert("Please add at least one item")
      return
    }
    setShowPreview(true)
  }

  const handleSubmit = async (itemsToSubmit: Item[]) => {
    setIsSubmitting(true)

    try {
      const validItems = itemsToSubmit.filter((item) => item.title.trim() !== "")

      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: validItems }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create list")
      }

      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Failed to create list:", error)
      alert("Failed to create list. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-3">
            <ArrowLeft className="w-4 h-4" />
            Back to Lists
          </Link>
          <h1 className="text-3xl font-bold">Create New List</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {showPreview && (
          <PreviewModal
            items={items}
            onClose={() => setShowPreview(false)}
            onConfirm={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        <form onSubmit={handlePreview} className="space-y-6">
          {items.map((item, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Item {index + 1}</CardTitle>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor={`title-${index}`} className="text-sm font-medium mb-2 block">
                    Title *
                  </label>
                  <Input
                    type="text"
                    id={`title-${index}`}
                    value={item.title}
                    onChange={(e) => updateItem(index, "title", e.target.value)}
                    placeholder="What do you want?"
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`description-${index}`} className="text-sm font-medium mb-2 block">
                    Description
                  </label>
                  <textarea
                    id={`description-${index}`}
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    placeholder="Add details about this item..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md resize-none"
                  />
                </div>
                <div>
                  <label htmlFor={`url-${index}`} className="text-sm font-medium mb-2 block">
                    URL (optional)
                  </label>
                  <Input
                    type="url"
                    id={`url-${index}`}
                    value={item.url}
                    onChange={(e) => updateItem(index, "url", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={addItem} className="gap-2 flex-1 bg-transparent">
              <Plus className="w-4 h-4" />
              Add Another Item
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !items.some((item) => item.title.trim() !== "")}
              className="gap-2 flex-1"
            >
              <Eye className="w-4 h-4" />
              Preview & Submit
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
