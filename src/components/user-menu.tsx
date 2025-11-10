"use client"

import Link from "next/link"
import { User, List, LogOut, ShoppingBag, KeyRound } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface UserMenuProps {
  userName: string
}

export function UserMenu({ userName }: UserMenuProps) {
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/login"
    } catch {
      alert("Failed to logout")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 p-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">Manage account</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile/edit" className="cursor-pointer flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-lists" className="cursor-pointer flex items-center">
            <List className="mr-2 h-4 w-4" />
            <span>My Lists</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/purchases" className="cursor-pointer flex items-center">
            <ShoppingBag className="mr-2 h-4 w-4" />
            <span>My Purchases</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/auth/add-passkey" className="cursor-pointer flex items-center">
            <KeyRound className="mr-2 h-4 w-4" />
            <span>Add Passkey</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
