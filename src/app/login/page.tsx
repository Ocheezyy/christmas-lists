"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { startAuthentication } from "@simplewebauthn/browser"
import { Gift, Lock } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)

    try {
      const optionsRes = await fetch("/api/auth/login/options", {
        method: "POST",
      })

      if (!optionsRes.ok) {
        const json = await optionsRes.json()
        throw new Error(json?.error || "Failed to get login options")
      }

      const options = await optionsRes.json()
      const credential = await startAuthentication(options)

      const verifyRes = await fetch("/api/auth/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      })

      if (!verifyRes.ok) {
        const json = await verifyRes.json()
        throw new Error(json?.error || "Login failed")
      }

      toast.success("Logged in successfully!")
      window.location.href = "/"
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Gift className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold">Family Christmas Lists</h1>
          <p className="text-muted-foreground">Share your wishlist with loved ones</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Use your security key or biometric authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleLogin} disabled={loading} size="lg" className="w-full gap-2">
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⟳</span>
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Sign In with Passkey
                </>
              )}
            </Button>

            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                Don&apos;t have an account?{" "}
                <a href="/admin/invite" className="text-primary hover:underline font-medium">
                  Request an invite
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Your data is encrypted and secure. Family-only access.
        </p>
      </div>
    </div>
  )
}
