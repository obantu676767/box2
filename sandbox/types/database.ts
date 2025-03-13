export type User = {
  id: string
  email: string
  created_at: string
  name?: string
}

export type EnergyData = {
  id: string
  user_id: string
  device_id: string
  energy_consumption: number
  timestamp: string
  device_name: string
}

export type Device = {
  id: string
  user_id: string
  name: string
  type: string
  status: boolean
  created_at: string
}

