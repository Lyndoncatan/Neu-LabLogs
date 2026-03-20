import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if we have valid Supabase credentials  
// A valid URL should end with .supabase.co and be reachable
// A valid anon key should be a JWT (starts with eyJ)
export const hasValidSupabase = !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.includes('.supabase.co') &&
    supabaseAnonKey.startsWith('eyJ')
)

// Create a mock client for development when Supabase is not configured
const mockClient = {
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: (_event: string, _callback: any) => ({
            data: { subscription: { unsubscribe: () => {} } }
        }),
        signInWithOAuth: async (_options: any) => ({
            data: null,
            error: { message: 'Supabase is not configured. Using local authentication.' }
        }),
        signOut: async () => ({ error: null }),
    }
} as any

export const supabase = hasValidSupabase
    ? createClient(supabaseUrl, supabaseAnonKey)
    : mockClient
