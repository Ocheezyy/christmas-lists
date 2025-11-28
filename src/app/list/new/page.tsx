"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Trash2, Plus, Eye, ExternalLink, ArrowLeft, Sparkles } from "lucide-react"

interface ListItem {
  title: string
  description: string
  url: string
  price: string
  priority: number // 0 = none, 1 = low, 2 = medium, 3 = high
  imageUrl?: string
}

const NewListPage = () => {
  const router = useRouter()
  const [listName, setListName] = useState("")
  const [items, setItems] = useState<ListItem[]>([{ title: "", description: "", url: "", price: "", priority: 0 }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(0)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [fetchingUrl, setFetchingUrl] = useState<number | null>(null)
  const [overwriteDialog, setOverwriteDialog] = useState<{
    index: number
    data: { title: string; description: string; image?: string }
    hasTitle: boolean
    hasDescription: boolean
  } | null>(null)
  const [updateTitle, setUpdateTitle] = useState(true)
  const [updateDescription, setUpdateDescription] = useState(true)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate list name
      if (!listName.trim()) {
        toast.error("Please enter a list name")
        return
      }

      // Filter out empty items
      const validItems = items.filter((item) => item.title.trim() !== "")

      if (validItems.length === 0) {
        toast.error("Please add at least one item with a title")
        return
      }

      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: listName.trim(),
          items: validItems 
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Your session has expired. Please log in again.")
          router.push("/login")
          return
        }
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

  const updateItem = (index: number, field: keyof ListItem, value: string | number) => {
    const newItems = items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    setItems(newItems)
  }

  const fetchUrlDetails = async (index: number) => {
    const item = items[index]
    if (!item.url.trim()) {
      toast.error("Please enter a URL first")
      return
    }

    setFetchingUrl(index)
    try {
      const response = await fetch("/api/url-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch URL details")
      }

      const data = await response.json()
      
      // Check if title or description would be overwritten
      const hasExistingTitle = item.title.trim() !== ""
      const hasExistingDescription = item.description.trim() !== ""
      
      if (hasExistingTitle || hasExistingDescription) {
        // Show confirmation dialog
        setOverwriteDialog({
          index,
          data,
          hasTitle: hasExistingTitle,
          hasDescription: hasExistingDescription,
        })
        setUpdateTitle(true)
        setUpdateDescription(true)
        setFetchingUrl(null)
      } else {
        // No existing data, update directly
        applyFetchedData(index, data, true, true)
        toast.success("Details fetched successfully!")
        setFetchingUrl(null)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch URL details")
      setFetchingUrl(null)
    }
  }

  const applyFetchedData = (
    index: number,
    data: { title: string; description: string; image?: string },
    shouldUpdateTitle: boolean,
    shouldUpdateDescription: boolean
  ) => {
    const newItems = items.map((it, i) => {
      if (i === index) {
        return {
          ...it,
          title: shouldUpdateTitle ? (data.title || it.title) : it.title,
          description: shouldUpdateDescription ? (data.description || it.description) : it.description,
          imageUrl: data.image || it.imageUrl,
        }
      }
      return it
    })
    setItems(newItems)
  }

  const handleConfirmOverwrite = () => {
    if (overwriteDialog) {
      applyFetchedData(overwriteDialog.index, overwriteDialog.data, updateTitle, updateDescription)
      toast.success("Details updated successfully!")
      setOverwriteDialog(null)
    }
  }

  const addItem = () => {
    setItems([...items, { title: "", description: "", url: "", price: "", priority: 0 }])
    setEditingIndex(items.length)
  }

  const hasValidItems = items.some((item) => item.title.trim() !== "")

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Lists
        </Link>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create a New List</h1>
          <p className="text-muted-foreground">Add items with titles, descriptions, and optional links</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* List Name */}
          <Card>
            <CardContent className="pt-6">
              <div>
                <label htmlFor="list-name" className="text-sm font-medium mb-2 block">
                  List Name *
                </label>
                <Input
                  type="text"
                  id="list-name"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="e.g., Christmas 2025, Birthday Wishes..."
                  className="text-base"
                  required
                  autoFocus
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
                            <div className="flex gap-2">
                              <Input
                                type="url"
                                id={`url-${index}`}
                                value={item.url}
                                onChange={(e) => updateItem(index, "url", e.target.value)}
                                placeholder="https://example.com"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => fetchUrlDetails(index)}
                                disabled={!item.url.trim() || fetchingUrl === index}
                                title="Auto-fetch title and description"
                              >
                                {fetchingUrl === index ? (
                                  <span className="inline-block animate-spin">⟳</span>
                                ) : (
                                  <Sparkles className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label htmlFor={`price-${index}`} className="text-xs font-medium mb-2 block">
                              Price (optional)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <Input
                                type="text"
                                id={`price-${index}`}
                                value={item.price}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^\d.]/g, '')
                                  if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                    updateItem(index, "price", value)
                                  }
                                }}
                                placeholder="0.00"
                                className="pl-7"
                              />
                            </div>
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
                          <div className="flex items-center gap-4 mt-2">
                            {item.price && (
                              <div className="text-sm font-medium text-foreground">
                                ${Number(item.price).toFixed(2)}
                              </div>
                            )}
                            {item.url && (
                              <div className="flex items-center gap-1 text-xs text-primary">
                                <ExternalLink className="w-3 h-4" />
                                <span className="truncate">{item.url}</span>
                              </div>
                            )}
                          </div>
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

        {/* Overwrite Confirmation Dialog */}
        <AlertDialog open={overwriteDialog !== null} onOpenChange={(open) => !open && setOverwriteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Update with fetched details?</AlertDialogTitle>
              <AlertDialogDescription>
                Some fields already have content. Select which fields you want to update:
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              {overwriteDialog?.hasTitle && (
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="update-title"
                    checked={updateTitle}
                    onChange={(e) => setUpdateTitle((e.target as HTMLInputElement).checked)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="update-title"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Update title
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Current: &quot;{items[overwriteDialog.index]?.title}&quot; → New: &quot;{overwriteDialog.data.title}&quot;
                    </p>
                  </div>
                </div>
              )}
              {overwriteDialog?.hasDescription && (
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="update-description"
                    checked={updateDescription}
                    onChange={(e) => setUpdateDescription((e.target as HTMLInputElement).checked)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="update-description"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Update description
                    </label>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      Current: &quot;{items[overwriteDialog.index]?.description}&quot;
                    </p>
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Note: The image will always be updated if available.
              </p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmOverwrite}>
                Update
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default NewListPage
