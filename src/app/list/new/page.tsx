"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Item, ItemGroup, ItemContent, ItemTitle, ItemDescription, ItemActions, ItemHeader } from "@/components/ui/item"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, Plus, Eye, ExternalLink } from "lucide-react"

interface ListItem {
  title: string
  description: string
  url: string
}

const NewListPage = () => {
  const router = useRouter()
  const [items, setItems] = useState<ListItem[]>([{ title: "", description: "", url: "" }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(0)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      // Filter out empty items
      const validItems = items.filter((item) => item.title.trim() !== "")

      if (validItems.length === 0) {
        toast.error("Please add at least one item with a title")
        return
      }

      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: validItems }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create list")
      }

      toast.success("List created successfully!")
      router.push("/")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create list")
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    setDeleteIndex(null)
    if (editingIndex === index) {
      setEditingIndex(null)
    }
  }

  const confirmDelete = (index: number) => {
    setDeleteIndex(index)
  }

  const updateItem = (index: number, field: keyof ListItem, value: string) => {
    const newItems = items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { title: "", description: "", url: "" }])
    setEditingIndex(items.length)
  }

  const hasValidItems = items.some((item) => item.title.trim() !== "")

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create a New List</h1>
          <p className="text-muted-foreground">Add items with titles, descriptions, and optional links</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Items List */}
          <div className="space-y-3">
            {items.length === 0 ? (
              <Empty className="border-dashed">
                <EmptyHeader>
                  <EmptyTitle>No items yet</EmptyTitle>
                  <EmptyDescription>Add your first item to get started</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ItemGroup>
                {items.map((item, index) => (
                  <Card
                    key={index}
                    className={`transition-all cursor-pointer ${editingIndex === index ? "ring-2 ring-primary/50" : ""}`}
                    onClick={() => editingIndex !== index && setEditingIndex(index)}
                  >
                    {editingIndex === index ? (
                      <>
                        <CardContent className="pt-6 space-y-4">
                          <div>
                            <label htmlFor={`title-${index}`} className="text-xs font-medium mb-2 block">
                              Title *
                            </label>
                            <Input
                              type="text"
                              id={`title-${index}`}
                              value={item.title}
                              onChange={(e) => updateItem(index, "title", e.target.value)}
                              placeholder="What is this item about?"
                              autoFocus
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor={`description-${index}`} className="text-xs font-medium mb-2 block">
                              Description
                            </label>
                            <textarea
                              id={`description-${index}`}
                              value={item.description}
                              onChange={(e) => updateItem(index, "description", e.target.value)}
                              placeholder="Add details about this item..."
                              rows={3}
                              className="w-full px-3 py-2 border rounded-md resize-none text-sm bg-background"
                            />
                          </div>
                          <div>
                            <label htmlFor={`url-${index}`} className="text-xs font-medium mb-2 block">
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
                        <CardFooter className="border-t pt-4 flex justify-between gap-2">
                          <Button type="button" variant="outline" onClick={() => setEditingIndex(null)}>
                            Done
                          </Button>
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => confirmDelete(index)}
                              className="gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </Button>
                          )}
                        </CardFooter>
                      </>
                    ) : (
                      <Item className="hover:bg-muted/30 transition-colors">
                        <ItemContent>
                          <ItemHeader>
                            <ItemTitle>
                              {item.title || <span className="text-muted-foreground italic">Untitled</span>}
                            </ItemTitle>
                          </ItemHeader>
                          {item.description && <ItemDescription>{item.description}</ItemDescription>}
                          {item.url && (
                            <div className="flex items-center gap-1 text-xs text-primary mt-2">
                              <ExternalLink className="w-3 h-4" />
                              <span className="truncate">{item.url}</span>
                            </div>
                          )}
                        </ItemContent>
                        <ItemActions>
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                confirmDelete(index)
                              }}
                              className="gap-1 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </ItemActions>
                      </Item>
                    )}
                  </Card>
                ))}
              </ItemGroup>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={addItem} className="gap-2 flex-1 bg-transparent">
              <Plus className="w-4 h-4" />
              Add Another Item
            </Button>
            <Button type="submit" disabled={isSubmitting || !hasValidItems} className="gap-2 flex-1">
              <Eye className="w-4 h-4" />
              Preview & Submit
            </Button>
          </div>
        </form>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this item from your list. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteIndex !== null && removeItem(deleteIndex)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default NewListPage
