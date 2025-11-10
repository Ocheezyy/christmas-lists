"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Copy, Check, Gift } from "lucide-react"
import Link from "next/link"

export default function AdminInvitePage() {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const adminSecret = formData.get("adminSecret") as string

    try {
      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, adminSecret }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create invite")
      }

      const data = await response.json()
      setInviteUrl(data.url)
      toast.success("Invite link created successfully!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create invite")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Gift className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold">Create Invite Link</h1>
          <p className="text-muted-foreground">Invite family members to join</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Invite</CardTitle>
            <CardDescription>Create a personalized link for a family member</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!inviteUrl ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="adminSecret" className="text-sm font-medium">
                    Admin Secret Key
                  </label>
                  <Input 
                    id="adminSecret" 
                    name="adminSecret" 
                    type="password" 
                    placeholder="Enter admin secret" 
                    required 
                    disabled={loading} 
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Family Member Name
                  </label>
                  <Input id="name" name="name" type="text" placeholder="e.g., Sean" required disabled={loading} />
                </div>

                <Button type="submit" disabled={loading} size="lg" className="w-full gap-2">
                  {loading ? (
                    <>
                      <span className="inline-block animate-spin">⟳</span>
                      Creating...
                    </>
                  ) : (
                    "Generate Invite Link"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Share this link:</label>
                  <div className="flex gap-2">
                    <Input value={inviteUrl} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      className="shrink-0 bg-transparent"
                      title="Copy link"
                    >
                      {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Link expires in:</p>
                  <p>24 hours</p>
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setInviteUrl(null)
                    setCopied(false)
                  }}
                >
                  Create Another
                </Button>
              </div>
            )}

            <div className="text-center text-sm">
              <Link href="/login" className="text-primary hover:underline font-medium">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
