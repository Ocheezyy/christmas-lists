"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserMenu } from "@/components/user-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { ShoppingBag, ArrowLeft, ExternalLink, User, List as ListIcon } from "lucide-react"

interface PurchasedItem {
  id: string
  title: string
  description: string
  url: string | null
  priority: number
  list: {
    id: string
    name: string | null
    user: {
      id: string
      name: string
    }
  }
}

export default function MyPurchasesPage() {
  const [purchases, setPurchases] = useState<PurchasedItem[]>([])
  const [userName, setUserName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPurchases = async (retryCount = 0) => {
      try {
        const response = await fetch('/api/purchases')
        
        if (response.status === 401 && retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 200 * (retryCount + 1)))
          return fetchPurchases(retryCount + 1)
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch purchases')
        }
        
        const data = await response.json()
        setPurchases(data.purchases)
        setUserName(data.userName)
        setLoading(false)
      } catch {
        setError("Failed to load purchases")
        setLoading(false)
      }
    }

    fetchPurchases()
  }, [])

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3: return 'High'
      case 2: return 'Medium'
      case 1: return 'Low'
      default: return null
    }
  }

  const getPriorityVariant = (priority: number): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 3: return 'destructive'
      case 2: return 'default'
      case 1: return 'secondary'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="animate-pulse text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading your purchases...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Return Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to All Lists
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <UserMenu userName={userName} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Purchases</h1>
              <p className="text-muted-foreground mt-1">
                {purchases.length} {purchases.length === 1 ? "item" : "items"} purchased
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {purchases.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">No Purchases Yet</h2>
              <p className="text-muted-foreground mb-6">
                Items you mark as purchased will appear here
              </p>
              <Link href="/">
                <Button>Browse Lists</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map((item) => {
              const priorityLabel = getPriorityLabel(item.priority)
              
              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader>
                    <div className="space-y-2">
                      <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                      <CardDescription className="line-clamp-3">
                        {item.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col gap-4">
                    {/* Priority Badge */}
                    {priorityLabel && (
                      <Badge variant={getPriorityVariant(item.priority)} className="w-fit">
                        {priorityLabel} Priority
                      </Badge>
                    )}

                    {/* List and User Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">For:</span>
                        <span className="font-medium">{item.list.user.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <ListIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">From:</span>
                        <span className="font-medium truncate">
                          {item.list.name || "Untitled List"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-4 space-y-2">
                      {item.url && (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button variant="outline" className="w-full gap-2">
                            <ExternalLink className="w-4 h-4" />
                            View Link
                          </Button>
                        </a>
                      )}
                      <Link href={`/list/${item.list.id}`} className="block">
                        <Button variant="outline" className="w-full">
                          View List
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
