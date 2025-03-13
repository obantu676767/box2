"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function updateProfile(formData: FormData) {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Unauthorized", success: false }
  }

  const name = formData.get("name") as string

  try {
    const { error } = await supabase.from("profiles").update({ name }).eq("id", session.user.id)

    if (error) throw error

    return { success: true, message: "Profile updated successfully" }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { error: "Failed to update profile", success: false }
  }
}

