"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"
import { Gift, Plus } from "lucide-react"
import { UserWithLists } from "@/types/user"

export default function HomePage() {
  const [users, setUsers] = useState<UserWithLists[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async (retryCount = 0) => {
      try {
        const response = await fetch('/api/lists')
        
        // Handle 401 with retry logic (race condition on initial login)
        if (response.status === 401 && retryCount < 3) {
          // Wait a bit for session cookie to be set, then retry
          await new Promise(resolve => setTimeout(resolve, 200 * (retryCount + 1)))
          return fetchData(retryCount + 1)
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch lists')
        }
        
        const data = await response.json()
        setUsers(data.users || [])
        setCurrentUserId(data.currentUserId || null)
        // Find current user's name
        const currentUser = data.users?.find((u: UserWithLists) => u.id === data.currentUserId)
        setCurrentUserName(currentUser?.name || "User")
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
            <Link href="/login">
              <Button variant="outline" className="w-full bg-transparent">
                Return to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // This should never happen now since API always includes current user
  if (!users || users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Gift className="w-10 h-10 mx-auto mb-2 text-primary" />
            <CardTitle>Error Loading Lists</CardTitle>
            <CardDescription>Unable to load your lists. Please try logging in again.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className="w-full">
              <Button className="w-full">Return to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Christmas Lists</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/list/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create New List
              </Button>
            </Link>
            <ThemeToggle />
            <UserMenu userName={currentUserName} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users
            .sort((a, b) => {
              // Current user's lists always first
              if (a.id === currentUserId) return -1
              if (b.id === currentUserId) return 1
              return 0
            })
            .map((user) => {
              const isCurrentUser = user.id === currentUserId
              return (
                <Card
                  key={user.id}
                  className={`hover:shadow-lg transition-shadow ${
                    isCurrentUser ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                      {isCurrentUser ? "Your Lists" : `${user.name}'s Lists`}
                    </CardTitle>
                    <CardDescription>
                      {user.lists.length} {user.lists.length === 1 ? "list" : "lists"}
                    </CardDescription>
                  </CardHeader>
              <CardContent className="space-y-4">
                {user.lists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No lists created yet.</p>
                ) : (
                  user.lists.map((list) => {
                    const itemsRemaining = list.items.filter((item) => !item.purchased).length
                    return (
                      <Link key={list.id} href={`/list/${list.id}`} className="block">
                        <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">View List</span>
                            <Badge variant={itemsRemaining > 0 ? "default" : "secondary"}>
                              {itemsRemaining} remaining
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    )
                  })
                )}
              </CardContent>
            </Card>
              )
            }
          )}
        </div>
      </main>
    </div>
  )
}
