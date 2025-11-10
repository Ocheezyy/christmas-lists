"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gift, Plus, LogOut } from "lucide-react"
import { UserWithLists } from "@/types/user"

export default function HomePage() {
  const [users, setUsers] = useState<UserWithLists[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/lists')
        if (!response.ok) {
          throw new Error('Failed to fetch lists')
        }
        const data = await response.json()
        setUsers(data.users || [])
        setCurrentUserId(data.currentUserId || null)
        setLoading(false)
      } catch {
        setError("Failed to load lists")
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/login"
    } catch {
      alert("Failed to logout")
    }
  }

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

  if (!users || users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Gift className="w-10 h-10 mx-auto mb-2 text-primary" />
            <CardTitle>No Lists Yet</CardTitle>
            <CardDescription>Please log in to view lists.</CardDescription>
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
            <h1 className="text-2xl font-bold text-foreground">Family Christmas Lists</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/list/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create New List
              </Button>
            </Link>
            <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  {user.name}&apos;s Lists
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
                      <div key={list.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <Link href={`/list/${list.id}`}>
                            <Button variant="link" className="p-0 h-auto font-semibold">
                              View List
                            </Button>
                          </Link>
                          <Badge variant={itemsRemaining > 0 ? "default" : "secondary"}>
                            {itemsRemaining} remaining
                          </Badge>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
