"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserMenu } from "@/components/user-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Gift, Plus, ArrowLeft, Edit } from "lucide-react"

interface ListItem {
  id: string
  title: string
  priority: number
}

interface List {
  id: string
  name: string | null
  items: ListItem[]
  createdAt: string
  updatedAt: string
}

export default function MyListsPage() {
  const [lists, setLists] = useState<List[]>([])
  const [userName, setUserName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async (retryCount = 0) => {
      try {
        const response = await fetch('/api/lists')
        
        if (response.status === 401 && retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 200 * (retryCount + 1)))
          return fetchData(retryCount + 1)
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch lists')
        }
        
        const data = await response.json()
        
        // Find current user's lists
        const currentUser = data.users?.find((u: { id: string }) => u.id === data.currentUserId)
        setUserName(currentUser?.name || "User")
        setLists(currentUser?.lists || [])
        setLoading(false)
      } catch {
        setError("Failed to load lists")
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading your lists...</p>
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
              <Button variant="outline" className="w-full bg-transparent">
                Return Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalItems = lists.reduce((acc, list) => acc + list.items.length, 0)

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
              <h1 className="text-3xl font-bold text-foreground">My Lists</h1>
              <p className="text-muted-foreground mt-1">
                {lists.length} {lists.length === 1 ? "list" : "lists"} • {totalItems} total items
              </p>
            </div>
            <Link href="/list/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create New List
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {lists.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">No Lists Yet</h2>
              <p className="text-muted-foreground mb-6">Create your first list to get started!</p>
              <Link href="/list/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First List
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((list) => {
              const totalItems = list.items.length
            //   const highPriorityItems = list.items.filter(item => item.priority === 3).length
              const createdDate = new Date(list.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })

              return (
                <Card key={list.id} className="hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate">
                          {list.name || "Untitled List"}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Created At: {createdDate}
                        </CardDescription>
                      </div>
                      <Link href={`/list/edit/${list.id}`}>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 space-y-4">
                    {/* Item Count */}
                    <div className="text-sm text-muted-foreground">
                      Total items: <span className="font-semibold text-foreground">{totalItems}</span>
                    </div>

                    {/* High Priority Items */}
                    {/* {highPriorityItems > 0 && (
                      <Badge variant="destructive" className="w-fit">
                        {highPriorityItems} high priority
                      </Badge>
                    )} */}

                    {/* View List Button */}
                    <Link href={`/list/${list.id}`} className="block">
                      <Button className="w-full">
                        View List
                      </Button>
                    </Link>
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
