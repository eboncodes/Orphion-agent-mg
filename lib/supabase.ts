import { createClient } from "@supabase/supabase-js"

// Get environment variables with proper fallbacks and warnings
const getSupabaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!url) {
    console.warn(
      "NEXT_PUBLIC_SUPABASE_URL environment variable is not set. " + "Authentication features may not work correctly.",
    )
    // Return empty string to prevent createClient from throwing an error
    // The isSupabaseConfigured() function will handle this case
    return ""
  }

  return url
}

const getSupabaseAnonKey = (): string => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!key) {
    console.warn(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not set. " +
        "Authentication features may not work correctly.",
    )
    // Return empty string to prevent createClient from throwing an error
    // The isSupabaseConfigured() function will handle this case
    return ""
  }

  return key
}

// Get the values
const supabaseUrl = getSupabaseUrl()
const supabaseAnonKey = getSupabaseAnonKey()

// Create a client with the provided values and explicit persistence settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "orphion-auth-token",
  },
})

// Update the function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

// Update the checkSupabaseConnection function to handle missing configuration
export async function checkSupabaseConnection(): Promise<boolean> {
  // Return false immediately if not configured
  if (!isSupabaseConfigured()) {
    console.warn("Supabase is not configured. Authentication features will be disabled.")
    return false
  }

  try {
    const { data, error } = await supabase.from("profiles").select("*").limit(1)

    if (error) {
      console.error("Supabase connection check failed:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Supabase connection check error:", error)
    return false
  }
}

// Helper function to initialize the database (create tables, etc.)
export async function initializeDatabase(): Promise<{ success: boolean; message?: string }> {
  // This function is intentionally left empty as the table creation is handled by the supabase-setup.sql file
  // The function only checks if the tables exist
  try {
    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*").limit(1)
    const { data: chatSessions, error: chatSessionsError } = await supabase.from("chat_sessions").select("*").limit(1)
    const { data: chatMessages, error: chatMessagesError } = await supabase.from("chat_messages").select("*").limit(1)
    const { data: messageVersions, error: messageVersionsError } = await supabase
      .from("message_versions")
      .select("*")
      .limit(1)

    if (profilesError || chatSessionsError || chatMessagesError || messageVersionsError) {
      console.error(
        "Database initialization check failed:",
        profilesError,
        chatSessionsError,
        chatMessagesError,
        messageVersionsError,
      )
      return { success: false, message: "One or more tables are missing. Run supabase-setup.sql." }
    }

    return { success: true }
  } catch (error) {
    console.error("Database initialization check error:", error)
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Helper functions for authentication
export async function signUp(email: string, password: string, username: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Cannot sign up.")
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  })

  if (error) {
    throw error
  }

  // We'll rely on the database trigger to create the profile
  // The trigger is defined in supabase-setup.sql and will automatically
  // create a profile when a new user is created in auth.users

  return data
}

export async function signIn(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Cannot sign in.")
  }

  try {
    // First attempt normal sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // If there's an error about email confirmation
    if (error && error.message && error.message.includes("Email not confirmed")) {
      console.warn("Email not confirmed error. Attempting alternative authentication...")

      // Try to get the user directly
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (!userError && userData.user) {
        console.log("User found despite email confirmation error")
        return { user: userData.user, session: null }
      }

      // For development environments, try to sign in with email/password directly
      if (process.env.NODE_ENV === "development") {
        console.log("Development environment detected, attempting to bypass email confirmation...")

        // Create a custom session (this is a simplified approach)
        const session = {
          access_token: "dev_session",
          refresh_token: "dev_refresh",
          expires_in: 3600,
          user: { email, id: "dev_user_id" },
        }

        return { user: { email, id: "dev_user_id" }, session }
      }

      throw error
    }

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Error signing in:", error)
    throw error
  }
}

export async function signOut() {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase is not configured. Sign out will only clear local state.")
    return
  }

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null
  }

  const { data, error } = await supabase.auth.getUser()

  if (error) {
    return null
  }

  return data.user
}
