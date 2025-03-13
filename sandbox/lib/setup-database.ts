import { supabase } from "./supabase"

export async function setupDatabase() {
  try {
    // Check if profiles table exists
    const { error: profilesCheckError } = await supabase.from("profiles").select("id").limit(1)

    // If profiles table doesn't exist, create all tables
    if (profilesCheckError && profilesCheckError.message.includes("does not exist")) {
      console.log("Setting up database schema...")

      // Create profiles table
      const { error: createProfilesError } = await supabase.rpc("create_profiles_table")
      if (createProfilesError && !createProfilesError.message.includes("already exists")) {
        console.error("Error creating profiles table:", createProfilesError)

        // Try direct SQL if RPC fails
        const { error: sqlError } = await supabase.rpc("execute_sql", {
          sql_query: `
            CREATE TABLE IF NOT EXISTS profiles (
              id UUID PRIMARY KEY,
              email TEXT NOT NULL,
              name TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
        })

        if (sqlError) {
          console.error("Error creating profiles table with direct SQL:", sqlError)
        }
      }

      // Create devices table
      const { error: createDevicesError } = await supabase.rpc("execute_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS devices (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            status BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      })

      if (createDevicesError) {
        console.error("Error creating devices table:", createDevicesError)
      }

      // Create energy_data table
      const { error: createEnergyDataError } = await supabase.rpc("execute_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS energy_data (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            device_id UUID NOT NULL,
            device_name TEXT NOT NULL,
            energy_consumption DECIMAL NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      })

      if (createEnergyDataError) {
        console.error("Error creating energy_data table:", createEnergyDataError)
      }

      console.log("Database setup completed")
    }

    return { success: true }
  } catch (error) {
    console.error("Error setting up database:", error)
    return { success: false, error }
  }
}

