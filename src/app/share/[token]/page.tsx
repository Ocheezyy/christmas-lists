'use client';

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Share2, ExternalLink, Check, Gift, Home, AlertTriangle } from "lucide-react"

interface Item {
  id: string;
  title: string;
  description: string;
  url?: string;
  purchased: boolean;
  purchasedBy?: string | null;
  priority: number;
}

interface List {
  id: string;
  userId: string;
  user: { name: string };
  items: Item[];
}

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [list, setList] = useState<List | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<{ itemId: string; itemTitle: string } | null>(null)

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await fetch(`/api/share/${token}`)
        if (!res.ok) {
          const json = await res.json()
          throw new Error(json?.error || "Failed to fetch")
        }
        const { list } = await res.json()
        setList(list)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load shared list")
      } finally {
        setLoading(false)
      }
    }

    fetchList()
  }, [token])

  const togglePurchase = async (itemId: string, currentlyPurchased: boolean, bypassWarning = false) => {
    // Check for duplicate purchase attempt
    if (!bypassWarning && !currentlyPurchased) {
      const item = list?.items.find((i) => i.id === itemId)
      if (item?.purchased && item.purchasedBy && item.purchasedBy !== `share:${token}`) {
        setDuplicateWarning({ itemId, itemTitle: item.title })
        return
      }
    }

    setProcessing(itemId)
    try {
      const res = await fetch(`/api/share/${token}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchased: !currentlyPurchased }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json?.error || "Failed to update")
      }

      const { item } = await res.json()
      setList((prev) => {
        if (!prev) return prev
        return { ...prev, items: prev.items.map((i) => (i.id === item.id ? item : i)) }
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update item")
    } finally {
      setProcessing(null)
    }
  }

  const confirmDuplicatePurchase = async () => {
    if (duplicateWarning) {
      await togglePurchase(duplicateWarning.itemId, false, true)
      setDuplicateWarning(null)
    }
  }

  const shareToOS = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: `${list?.user.name}'s list`, url })
        return
      } catch {
        // fallback
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      alert("Link copied to clipboard")
    } catch {
      alert(url)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="animate-pulse text-center">
          <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading shared list...</p>
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
            <p className="mb-4">{error || "Shared list not found"}</p>
            <Link href="/">
              <Button variant="outline" className="w-full gap-2 bg-transparent">
                <Home className="w-4 h-4" />
                Return Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const visibleItems = list.items
    .filter((item) => !item.purchased || item.purchasedBy === `share:${token}`)
    .sort((a, b) => b.priority - a.priority) // Sort by priority (high to low)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{list.user.name}&apos;s List</h1>
              <p className="text-sm text-muted-foreground">Shared with you</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={shareToOS} variant="outline" size="icon" title="Share this list">
                <Share2 className="w-4 h-4" />
              </Button>
              <Link href="/">
                <Button variant="outline" size="icon" title="Go home">
                  <Home className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {visibleItems.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center">
              <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No items available in this list.</p>
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
                        {item.priority > 0 && (
                          <Badge
                            variant={
                              item.priority === 1
                                ? "secondary"
                                : item.priority === 2
                                ? "default"
                                : "destructive"
                            }
                          >
                            {item.priority === 1 ? "Low" : item.priority === 2 ? "Medium" : "High"}
                          </Badge>
                        )}
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
                    <Button
                      onClick={() => togglePurchase(item.id, item.purchased)}
                      disabled={processing === item.id}
                      variant={item.purchased ? "outline" : "default"}
                      className="gap-2 whitespace-nowrap"
                    >
                      {processing === item.id ? (
                        <>
                          <span className="inline-block animate-spin">⟳</span>
                          Updating…
                        </>
                      ) : item.purchased ? (
                        <>
                          <Check className="w-4 h-4" />
                          Unpurchase
                        </>
                      ) : (
                        <>
                          <Gift className="w-4 h-4" />
                          Purchase
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Duplicate Purchase Warning Dialog */}
      <AlertDialog open={duplicateWarning !== null} onOpenChange={(open) => !open && setDuplicateWarning(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Item Already Purchased
            </AlertDialogTitle>
            <AlertDialogDescription>
              The item &quot;{duplicateWarning?.itemTitle}&quot; has already been marked as purchased by someone else. 
              Are you sure you want to purchase this item as well?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDuplicatePurchase}>
              Purchase Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
