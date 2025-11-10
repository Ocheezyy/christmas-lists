"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Share2, ExternalLink, Check, Gift } from "lucide-react"

interface Item {
  id: string
  title: string
  description: string
  url?: string
  purchased: boolean
  purchasedBy?: string
}

interface List {
  id: string
  userId: string
  user: {
    name: string
  }
  items: Item[]
}

export default function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [list, setList] = useState<List | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [updatingItem, setUpdatingItem] = useState<string | null>(null)

  useEffect(() => {
    const fetchList = async () => {
      try {
        const response = await fetch(`/api/lists/${id}`)
        if (!response.ok) {
          throw new Error("Failed to load list")
        }
        const data = await response.json()
        setList(data.list)
        setCurrentUserId(data.currentUserId)
      } catch {
        setError("Failed to load list")
      } finally {
        setLoading(false)
      }
    }

    fetchList()
  }, [id])

  const handlePurchaseToggle = async (itemId: string, currentlyPurchased: boolean) => {
    setUpdatingItem(itemId)
    try {
      const response = await fetch(`/api/lists/${id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchased: !currentlyPurchased }),
      })

      if (!response.ok) {
        throw new Error("Failed to update item")
      }

      setList((prevList) => {
        if (!prevList) return null
        return {
          ...prevList,
          items: prevList.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  purchased: !currentlyPurchased,
                  purchasedBy: (!currentlyPurchased ? currentUserId : null) as string | undefined,
                }
              : item,
          ),
        }
      })
    } catch {
      alert("Failed to update item. Please try again.")
    } finally {
      setUpdatingItem(null)
    }
  }

  const handleShare = async () => {
    setShareLoading(true)
    try {
      const res = await fetch(`/api/lists/${id}/share`, { method: "POST" })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json?.error || "Failed to create share link")
      }
      const { token } = await res.json()
      const origin = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_ORIGIN || ""
      const shareUrl = `${origin}/share/${token}`

      if (navigator.share) {
        try {
          await navigator.share({ title: `${list?.user.name}'s list`, url: shareUrl })
          return
        } catch {
          // fallback to clipboard
        }
      }

      await navigator.clipboard.writeText(shareUrl)
      alert("Share link copied to clipboard")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create share link")
    } finally {
      setShareLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-3xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error || "List not found"}</p>
            <Link href="/">
              <Button variant="outline" className="w-full bg-transparent">
                Return to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwnList = currentUserId === list.userId
  const visibleItems = list.items.filter((item) => {
    if (isOwnList) return true
    return !item.purchased || item.purchasedBy === currentUserId
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-3">
            <ArrowLeft className="w-4 h-4" />
            Back to Lists
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{list.user.name}&apos;s List</h1>
            </div>
            {!isOwnList && (
              <Button onClick={handleShare} disabled={shareLoading} className="gap-2">
                <Share2 className="w-4 h-4" />
                {shareLoading ? "Creating…" : "Share List"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {visibleItems.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center">
              <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No items in this list yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visibleItems.map((item) => (
              <Card
                key={item.id}
                className={`transition-all ${item.purchased ? "opacity-75 bg-muted/50" : "hover:shadow-lg"}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-lg font-semibold ${
                            item.purchased ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {item.title}
                        </h3>
                        {item.purchased && (
                          <Badge variant="secondary" className="gap-1">
                            <Check className="w-3 h-3" />
                            Purchased
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className={`${item.purchased ? "text-muted-foreground" : "text-foreground/70"}`}>
                          {item.description}
                        </p>
                      )}
                      {item.url && (
                        <Link href={item.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="link" className="p-0 h-auto gap-1 text-primary">
                            View Item
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                    {!isOwnList && (
                      <Button
                        onClick={() => handlePurchaseToggle(item.id, item.purchased)}
                        disabled={updatingItem === item.id}
                        variant={item.purchased ? "outline" : "default"}
                        className="gap-2 whitespace-nowrap"
                      >
                        {updatingItem === item.id ? (
                          <>
                            <span className="inline-block animate-spin">⟳</span>
                            Updating…
                          </>
                        ) : item.purchasedBy === currentUserId ? (
                          <>
                            <Check className="w-4 h-4" />
                            Unpurchase
                          </>
                        ) : item.purchased ? (
                          "Already Purchased"
                        ) : (
                          <>
                            <Gift className="w-4 h-4" />
                            Purchase
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
