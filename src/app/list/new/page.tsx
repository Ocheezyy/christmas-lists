"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Trash2, Plus, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"

interface ListItem {
  title: string
  description: string
  url: string
}

const NewListPage = () => {
  const router = useRouter()
  const [items, setItems] = useState<ListItem[]>([{ title: "", description: "", url: "" }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedItem, setExpandedItem] = useState("0")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      // Filter out empty items
      const validItems = items.filter(item => item.title.trim() !== "")

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
      // Redirect to the home page
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
  }

  const updateItem = (index: number, field: keyof ListItem, value: string) => {
    const newItems = items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    setItems(newItems)
  }

  const addItem = () => {
    const newIndex = items.length
    setItems([...items, { title: "", description: "", url: "" }])
    setExpandedItem(String(newIndex))
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Accordion value={expandedItem} onValueChange={setExpandedItem} type="single" collapsible>
          {items.map((item, index) => (
            <AccordionItem key={index} value={String(index)} className="border rounded-lg mb-2">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-sm font-medium">
                    Item {index + 1}
                    {item.title && ` - ${item.title}`}
                  </span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItem(index)
                      }}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 space-y-3 bg-muted/30">
                <div>
                  <label htmlFor={`title-${index}`} className="text-xs font-medium mb-1 block">
                    Title *
                  </label>
                  <Input
                    type="text"
                    id={`title-${index}`}
                    value={item.title}
                    onChange={(e) => updateItem(index, "title", e.target.value)}
                    placeholder="What do you want?"
                    className="h-8 text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`description-${index}`} className="text-xs font-medium mb-1 block">
                    Description
                  </label>
                  <textarea
                    id={`description-${index}`}
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    placeholder="Add details about this item..."
                    rows={2}
                    className="w-full px-3 py-1 border rounded-md resize-none text-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`url-${index}`} className="text-xs font-medium mb-1 block">
                    URL (optional)
                  </label>
                  <Input
                    type="url"
                    id={`url-${index}`}
                    value={item.url}
                    onChange={(e) => updateItem(index, "url", e.target.value)}
                    placeholder="https://example.com"
                    className="h-8 text-sm"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

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
    </div>
  )
}

export default NewListPage
