// This file creates a Supabase client using configuration from localStorage or defaults
// NOTE: In Demo Mode, src/lib/supabase.ts should be the primary import, which exports the mock client.
// This file is kept for structural consistency but its client might not be used.

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { isConfigured } from '@/lib/config-store'; // Uses the modified isConfigured
import { mockSupabase } from '@/lib/mockSupabase'; // Import the mock

// Default values - not used in demo mode
const DEFAULT_SUPABASE_URL = "";
const DEFAULT_SUPABASE_KEY = "";

// Get values from localStorage config if available - not used in demo mode
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Export the MOCK client here as well for consistency if this file is imported directly
export const supabase = mockSupabase as any;
// export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY); // Original line

// Export a function to check if Supabase is configured
// This will now always return true because isConfigured is modified
export const isSupabaseConfigured = () => isConfigured() && !!SUPABASE_URL && !!SUPABASE_PUBLISHABLE_KEY;
