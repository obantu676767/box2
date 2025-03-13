"use client"

import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Zap, DollarSign, Lightbulb, Thermometer, Plug } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { EnergyData } from "@/types/database"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function Dashboard() {
  const { user } = useAuth()
  const [energyData, setEnergyData] = useState<EnergyData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalConsumption, setTotalConsumption] = useState(0)
  const [estimatedCost, setEstimatedCost] = useState(0)
  const [activeDevices, setActiveDevices] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // Check if the energy_data table exists
        const { error: tableCheckError } = await supabase.from("energy_data").select("id").limit(1)

        // If table doesn't exist, set empty data and show a message
        if (tableCheckError && tableCheckError.message.includes("does not exist")) {
          console.log("Energy data table does not exist yet. Using sample data.")
          setEnergyData([])
          setTotalConsumption(0)
          setEstimatedCost(0)
          setActiveDevices(0)
          setLoading(false)
          return
        }

        // Fetch energy data
        const { data, error } = await supabase
          .from("energy_data")
          .select("*")
          .eq("user_id", user.id)
          .order("timestamp", { ascending: false })
          .limit(30)

        if (error) throw error

        setEnergyData(data || [])

        // Calculate total consumption
        const total = data?.reduce((sum, item) => sum + item.energy_consumption, 0) || 0
        setTotalConsumption(total)

        // Estimate cost (assuming $0.15 per kWh)
        setEstimatedCost(total * 0.15)

        // Check if devices table exists
        const { error: devicesTableError } = await supabase.from("devices").select("id").limit(1)

        if (devicesTableError && devicesTableError.message.includes("does not exist")) {
          setActiveDevices(0)
        } else {
          // Get active devices count
          const { count } = await supabase
            .from("devices")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", true)

          setActiveDevices(count || 0)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Prepare data for charts
  const dailyData = energyData.reduce(
    (acc, item) => {
      const date = new Date(item.timestamp).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = { date, consumption: 0 }
      }
      acc[date].consumption += item.energy_consumption
      return acc
    },
    {} as Record<string, { date: string; consumption: number }>,
  )

  const chartData = Object.values(dailyData).slice(0, 7).reverse()

  const deviceData = energyData.reduce(
    (acc, item) => {
      if (!acc[item.device_name]) {
        acc[item.device_name] = { name: item.device_name, consumption: 0 }
      }
      acc[item.device_name].consumption += item.energy_consumption
      return acc
    },
    {} as Record<string, { name: string; consumption: number }>,
  )

  const deviceChartData = Object.values(deviceData)
    .sort((a, b) => b.consumption - a.consumption)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Monitor and manage your home energy consumption</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConsumption.toFixed(2)} kWh</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${estimatedCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Based on current rates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDevices}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Efficiency</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Good</div>
            <p className="text-xs text-muted-foreground">15% better than average</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Daily Energy Consumption</CardTitle>
            <CardDescription>Energy usage over the past 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: "kWh", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Bar dataKey="consumption" fill="#3b82f6" name="Energy (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Energy by Device</CardTitle>
            <CardDescription>Top energy consuming devices</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={deviceChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Bar dataKey="consumption" fill="#10b981" name="Energy (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick access */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
            <Lightbulb className="h-6 w-6" />
            <span>Lights</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
            <Thermometer className="h-6 w-6" />
            <span>Climate</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
            <Plug className="h-6 w-6" />
            <span>Devices</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
            <BarChart3 className="h-6 w-6" />
            <span>Reports</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

