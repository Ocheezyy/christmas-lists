'use client';

import { use, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Share2, ExternalLink, Gift, Home } from "lucide-react"

interface Item {
  id: string;
  title: string;
  description: string;
  url?: string;
  imageUrl?: string;
  price?: string;
  purchased: boolean;
  purchasedBy?: string | null;
  purchaserName?: string;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await fetch(`/api/share/${token}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError("This shared link is invalid or has expired")
            setLoading(false)
            return
          }
          if (res.status === 410) {
            setError("This shared link has expired")
            setLoading(false)
            return
          }
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

    // Check authentication status
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/profile')
        setIsAuthenticated(res.ok)
      } catch {
        setIsAuthenticated(false)
      }
    }

    fetchList()
    checkAuth()
  }, [token])

  const handleViewList = () => {
    if (!list) return
    
    if (!isAuthenticated) {
      sessionStorage.setItem('returnToList', list.id)
      window.location.href = '/login'
    } else {
      window.location.href = `/list/${list.id}`
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

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Want to mark items as purchased?</h2>
            <p className="text-muted-foreground">
              {isAuthenticated 
                ? "Go to the full list to purchase items and keep track of what's been bought."
                : "Login to access the full list where you can purchase items and see what others have bought."}
            </p>
            <div className="flex gap-3 justify-center">
              {!isAuthenticated && (
                <Button onClick={handleViewList} size="lg" className="gap-2">
                  Login to View Full List
                </Button>
              )}
              {isAuthenticated && (
                <Button onClick={handleViewList} size="lg" className="gap-2">
                  View Full List
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

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
                      </div>
                      {item.description && (
                        <p className="text-foreground/70">
                          {item.description}
                        </p>
                      )}
                      {item.price && (
                        <p className="text-lg font-semibold text-foreground">
                          ${Number(item.price).toFixed(2)}
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
