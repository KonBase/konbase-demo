// NOTE: In Demo Mode, src/lib/supabase.ts should be the primary import.
// This file provides the mock client if used.
import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockSupabase'; // Import the mock

// Get environment variables - not used in demo
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables - skipped in demo
// if (!supabaseUrl || !supabaseAnonKey) {
//   console.error('Missing Supabase environment variables');
// }

// Create Supabase client - Export MOCK instead
export const supabase = mockSupabase as any;
// export const supabase = createClient(supabaseUrl, supabaseAnonKey); // Original line

// Log the available authentication methods to help with debugging
console.log('Available MOCK Supabase auth methods:', Object.keys(supabase.auth));
// console.log('Supabase version compatibility check:',
//   typeof supabase.auth.signInWithPassword === 'function' ? 'v2+' : 'unknown');

export default supabase;
