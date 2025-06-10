// Stub file to replace Supabase functionality
// This file provides mock implementations to prevent build errors

export const isSupabaseConfigured = (): boolean => {
  return false
}

export const checkSupabaseConnection = async (): Promise<boolean> => {
  return false
}

export const initializeDatabase = async (): Promise<{ success: boolean; message?: string }> => {
  return { success: false, message: "Supabase is not configured" }
}

export const signUp = async () => {
  throw new Error("Authentication is not available")
}

export const signIn = async () => {
  throw new Error("Authentication is not available")
}

export const signOut = async () => {
  // No-op function
}

export const getCurrentUser = async () => {
  return null
}
