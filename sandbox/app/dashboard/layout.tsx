"use client"

import type React from "react"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, BarChart3, Settings, LogOut, Menu, X, Lightbulb, Thermometer, Plug } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [databaseError, setDatabaseError] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  useEffect(() => {
    const checkDatabase = async () => {
      if (!user) return

      try {
        // Check if energy_data table exists
        const { error } = await supabase.from("energy_data").select("id").limit(1)

        if (error && error.message.includes("does not exist")) {
          setDatabaseError(true)
        } else {
          setDatabaseError(false)
        }
      } catch (error) {
        console.error("Error checking database:", error)
        setDatabaseError(true)
      }
    }

    checkDatabase()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Energy Usage", href: "/dashboard/energy", icon: BarChart3 },
    { name: "Lights", href: "/dashboard/lights", icon: Lightbulb },
    { name: "Climate", href: "/dashboard/climate", icon: Thermometer },
    { name: "Devices", href: "/dashboard/devices", icon: Plug },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold">Smart Home Energy</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user.name || user.email}</p>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href} className="flex items-center p-2 rounded-md hover:bg-accent group">
                <item.icon className="h-5 w-5 mr-3 text-muted-foreground group-hover:text-foreground" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <Button variant="outline" className="w-full flex items-center justify-center" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 md:p-8">
        {databaseError && (
          <div className="mb-4 p-4 bg-amber-100 text-amber-800 rounded-md">
            <p className="font-medium">Database tables not found</p>
            <p className="text-sm">It looks like your database tables haven't been set up yet.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => router.push("/setup")}>
              Go to Setup Page
            </Button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

