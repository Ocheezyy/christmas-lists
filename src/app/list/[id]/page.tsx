"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { ArrowLeft, Share2, ExternalLink, Check, Gift, AlertTriangle, Copy } from "lucide-react"

interface Item {
  id: string
  title: string
  description: string
  url?: string
  imageUrl?: string
  purchased: boolean
  purchasedBy?: string
  purchaserName?: string
  priority: number
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
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [updatingItem, setUpdatingItem] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<{ itemId: string; itemTitle: string } | null>(null)
  const [unpurchaseWarning, setUnpurchaseWarning] = useState<{ itemId: string; itemTitle: string } | null>(null)

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

  const handlePurchaseToggle = async (itemId: string, currentlyPurchased: boolean, bypassWarning = false) => {
    // Check for unpurchase confirmation
    if (!bypassWarning && currentlyPurchased) {
      const item = list?.items.find((i) => i.id === itemId)
      if (item && item.purchasedBy === currentUserId) {
        setUnpurchaseWarning({ itemId, itemTitle: item.title })
        return
      }
    }

    // Check for duplicate purchase attempt
    if (!bypassWarning && !currentlyPurchased) {
      const item = list?.items.find((i) => i.id === itemId)
      if (item?.purchased && item.purchasedBy && item.purchasedBy !== currentUserId) {
        setDuplicateWarning({ itemId, itemTitle: item.title })
        return
      }
    }

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

  const confirmDuplicatePurchase = async () => {
    if (duplicateWarning) {
      await handlePurchaseToggle(duplicateWarning.itemId, false, true)
      setDuplicateWarning(null)
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
      const url = `${origin}/share/${token}`
      setShareUrl(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create share link")
    } finally {
      setShareLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert("Failed to copy link")
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
  const visibleItems = list.items
    .filter((item) => {
      if (isOwnList) return true
      return !item.purchased || item.purchasedBy === currentUserId
    })
    .sort((a, b) => b.priority - a.priority) // Sort by priority (high to low)

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
            <div className="flex gap-2">
              {isOwnList && (
                <Link href={`/list/edit/${id}`}>
                  <Button variant="outline" className="gap-2">
                    Edit List
                  </Button>
                </Link>
              )}
              <Button onClick={handleShare} disabled={shareLoading} className="gap-2">
                <Share2 className="w-4 h-4" />
                {shareLoading ? "Creating…" : "Share List"}
              </Button>
            </div>
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
                    {item.imageUrl && (
                      <div className="flex-shrink-0">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          width={96}
                          height={96}
                          className="w-24 h-24 object-cover rounded-md"
                        />
                      </div>
                    )}
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
                      {!isOwnList && item.purchased && item.purchaserName && (
                        <p className="text-sm text-muted-foreground">
                          Purchased by {item.purchaserName}
                        </p>
                      )}
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
                        variant={item.purchased ? "destructive" : "default"}
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

      {/* Unpurchase Confirmation Dialog */}
      <AlertDialog open={unpurchaseWarning !== null} onOpenChange={(open) => !open && setUnpurchaseWarning(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpurchase Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unpurchase &quot;{unpurchaseWarning?.itemTitle}&quot;? This will make it available for purchase again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (unpurchaseWarning) {
                  handlePurchaseToggle(unpurchaseWarning.itemId, true, true)
                  setUnpurchaseWarning(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Unpurchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Share Link Dialog */}
      <AlertDialog open={shareUrl !== null} onOpenChange={(open) => !open && setShareUrl(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share List</AlertDialogTitle>
            <AlertDialogDescription>
              Anyone with this link can view and purchase items from this list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Share this link:</label>
              <div className="flex gap-2">
                <Input value={shareUrl || ""} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                  title="Copy link"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="p-3 bg-muted rounded text-sm text-muted-foreground">
              <p>This link can be shared with anyone and does not expire.</p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShareUrl(null)}>
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
