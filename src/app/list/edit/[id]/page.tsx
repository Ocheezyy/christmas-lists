"use client"

import type React from "react"
import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
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
import { Trash2, Plus, Save, ExternalLink, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ListItem {
  id?: string
  title: string
  description: string
  url: string
  priority: number // 0 = none, 1 = low, 2 = medium, 3 = high
}

export default function EditListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [listName, setListName] = useState("")
  const [items, setItems] = useState<ListItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  useEffect(() => {
    const fetchList = async () => {
      try {
        const response = await fetch(`/api/lists/${id}`)
        if (!response.ok) {
          throw new Error("Failed to load list")
        }
        const data = await response.json()
        
        // Set list name
        setListName(data.list.name || "")
        
        // Convert list items to editable format
        const editableItems = data.list.items.map((item: { id: string; title: string; description?: string; url?: string; priority?: number }) => ({
          id: item.id,
          title: item.title,
          description: item.description || "",
          url: item.url || "",
          priority: item.priority || 0,
        }))
        
        setItems(editableItems.length > 0 ? editableItems : [{ title: "", description: "", url: "", priority: 0 }])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load list")
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    fetchList()
  }, [id, router])

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

      const response = await fetch(`/api/lists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: listName.trim() || null,
          items: validItems 
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update list")
      }

      toast.success("List updated successfully!")
      router.push("/")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update list")
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

  const updateItem = (index: number, field: keyof ListItem, value: string | number) => {
    const newItems = items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { title: "", description: "", url: "", priority: 0 }])
    setEditingIndex(items.length)
  }

  const hasValidItems = items.some((item) => item.title.trim() !== "")

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 flex items-center justify-center">
        <div className="text-muted-foreground">Loading list...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit List</h1>
              <p className="text-muted-foreground">Update your items, descriptions, and links</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* List Name */}
          <Card>
            <CardContent className="pt-6">
              <div>
                <label htmlFor="list-name" className="text-sm font-medium mb-2 block">
                  List Name (optional)
                </label>
                <Input
                  type="text"
                  id="list-name"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="e.g., Christmas 2025, Birthday Wishes..."
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Give your list a name to help identify it
                </p>
              </div>
            </CardContent>
          </Card>

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
                        <CardHeader className="pb-4">
                          <h3 className="text-sm font-semibold text-muted-foreground">
                            Item #{index + 1}
                          </h3>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                          <div>
                            <label htmlFor={`title-${index}`} className="text-xs font-medium mb-2 block">
                              Title *
                            </label>
                            <Input
                              type="text"
                              id={`title-${index}`}
                              value={item.title}
                              onChange={(e) => updateItem(index, "title", e.target.value)}
                              placeholder="What is this item?"
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
                          <div>
                            <label className="text-xs font-medium mb-2 block">Priority</label>
                            <div className="flex gap-2">
                              {[
                                { value: 0, label: "None", color: "outline" },
                                { value: 1, label: "Low", color: "secondary" },
                                { value: 2, label: "Medium", color: "default" },
                                { value: 3, label: "High", color: "destructive" },
                              ].map((priority) => (
                                <button
                                  key={priority.value}
                                  type="button"
                                  onClick={() => updateItem(index, "priority", priority.value)}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                                    item.priority === priority.value
                                      ? priority.value === 0
                                        ? "bg-muted text-foreground border-border"
                                        : priority.value === 1
                                        ? "bg-secondary text-secondary-foreground border-transparent"
                                        : priority.value === 2
                                        ? "bg-primary text-primary-foreground border-transparent"
                                        : "bg-destructive text-white border-transparent"
                                      : "bg-transparent border-border hover:bg-muted"
                                  }`}
                                >
                                  {priority.label}
                                </button>
                              ))}
                            </div>
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
                            {item.priority > 0 && (
                              <span
                                className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-md ${
                                  item.priority === 1
                                    ? "bg-secondary text-secondary-foreground"
                                    : item.priority === 2
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-destructive text-white"
                                }`}
                              >
                                {item.priority === 1 ? "Low" : item.priority === 2 ? "Medium" : "High"}
                              </span>
                            )}
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
              <Save className="w-4 h-4" />
              Save Changes
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
