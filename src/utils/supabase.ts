import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Adds a log entry to the 'logs' table in Supabase
 * @param {Object} entry - The log entry to be added (will be stored as JSONB)
 * @returns {Promise<Object>} The result of the insert operation
 */
export const addLogEntry = async (entry: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("logs")
      .insert({ entry })
      .select()

    if (error) {
      console.error("Error adding log entry:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in addLogEntry:", error)
    throw error
  }
}
