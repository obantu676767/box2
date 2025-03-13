"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { initializeDatabase } from "@/app/actions/setup-db"
import { supabase } from "@/lib/supabase"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSetup = async () => {
    setIsLoading(true)
    setMessage("")
    setError("")

    try {
      setMessage("Checking database connection...")

      // First, check if we can connect to Supabase
      const { data, error: connectionError } = await supabase
        .from("_dummy_query")
        .select("*")
        .limit(1)
        .catch(() => ({
          data: null,
          error: { message: "Could not connect to database" },
        }))

      if (connectionError && !connectionError.message.includes("does not exist")) {
        throw new Error(`Database connection error: ${connectionError.message}`)
      }

      setMessage("Connection successful. Setting up database schema...")

      // Try to initialize the database
      const result = await initializeDatabase()

      if (result.success) {
        setMessage("Database setup completed successfully!")

        // Create sample data
        setMessage("Creating sample data...")

        try {
          // Get the current user
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (session?.user) {
            // Create a sample device
            const { data: deviceData, error: deviceError } = await supabase
              .from("devices")
              .insert({
                user_id: session.user.id,
                name: "Sample Device",
                type: "light",
                status: true,
              })
              .select()
              .single()

            if (deviceError && !deviceError.message.includes("does not exist")) {
              console.error("Error creating sample device:", deviceError)
            } else if (deviceData) {
              // Create sample energy data
              const { error: energyError } = await supabase.from("energy_data").insert({
                user_id: session.user.id,
                device_id: deviceData.id,
                device_name: deviceData.name,
                energy_consumption: 1.5,
                timestamp: new Date().toISOString(),
              })

              if (energyError && !energyError.message.includes("does not exist")) {
                console.error("Error creating sample energy data:", energyError)
              }
            }
          }
        } catch (sampleDataError) {
          console.error("Error creating sample data:", sampleDataError)
        }

        setMessage("Setup completed! Redirecting to dashboard...")

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        throw new Error("Database setup failed")
      }
    } catch (err: any) {
      setError(`Setup failed: ${err.message}`)
      console.error("Setup error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Database Setup</CardTitle>
          <CardDescription className="text-center">Initialize your Smart Home Energy database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            This page will help you set up the necessary database tables for your Smart Home Energy application. Click
            the button below to initialize the database.
          </p>

          {message && <div className="bg-primary/10 p-4 rounded-md text-sm">{message}</div>}

          {error && <div className="bg-destructive/10 p-4 rounded-md text-sm text-destructive">{error}</div>}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/")}>
            Back to Home
          </Button>
          <Button onClick={handleSetup} disabled={isLoading}>
            {isLoading ? "Setting up..." : "Initialize Database"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

