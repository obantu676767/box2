import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const cookieStore = cookies()

  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabaseServer.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const userId = session.user.id
  const period = searchParams.get("period") || "week"

  let timeFilter
  const now = new Date()

  switch (period) {
    case "day":
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      timeFilter = yesterday.toISOString()
      break
    case "week":
      const lastWeek = new Date(now)
      lastWeek.setDate(now.getDate() - 7)
      timeFilter = lastWeek.toISOString()
      break
    case "month":
      const lastMonth = new Date(now)
      lastMonth.setMonth(now.getMonth() - 1)
      timeFilter = lastMonth.toISOString()
      break
    default:
      const defaultPeriod = new Date(now)
      defaultPeriod.setDate(now.getDate() - 7)
      timeFilter = defaultPeriod.toISOString()
  }

  try {
    const { data, error } = await supabase
      .from("energy_data")
      .select("*")
      .eq("user_id", userId)
      .gte("timestamp", timeFilter)
      .order("timestamp", { ascending: false })

    if (error) throw error

    return NextResponse.json({ energy_data: data })
  } catch (error) {
    console.error("Error fetching energy data:", error)
    return NextResponse.json({ error: "Failed to fetch energy data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const cookieStore = cookies()

  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabaseServer.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { device_id, energy_consumption, device_name } = body

    if (!device_id || energy_consumption === undefined || !device_name) {
      return NextResponse.json(
        {
          error: "Device ID, energy consumption, and device name are required",
        },
        { status: 400 },
      )
    }

    const newEnergyData = {
      user_id: session.user.id,
      device_id,
      energy_consumption,
      device_name,
      timestamp: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("energy_data").insert(newEnergyData).select().single()

    if (error) throw error

    return NextResponse.json({ energy_data: data })
  } catch (error) {
    console.error("Error recording energy data:", error)
    return NextResponse.json({ error: "Failed to record energy data" }, { status: 500 })
  }
}

