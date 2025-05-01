import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockSupabase'; // Import the mock client
import { Database } from '@/lib/database.types'; // Import your generated DB types
import { logDebug, isDebugModeEnabled } from '@/utils/debug';

// Environment variables for Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Determine if we should use the mock client
// Use mock if URL or Key is missing, or if explicitly set via another env var (optional)
const useMock = !supabaseUrl || !supabaseAnonKey || import.meta.env.VITE_USE_MOCK_SUPABASE === 'true';

// Create the Supabase client (either real or mock)
const supabaseClient = useMock
  ? mockSupabase // Use the imported mock client
  : createClient<Database>(supabaseUrl, supabaseAnonKey);

// Log which client is being used (optional, good for debugging)
if (useMock) {
  console.warn("Using Mock Supabase Client for Demo Mode.");
} else {
  console.info("Using Real Supabase Client.");
}

/**
 * Checks if the application is currently using the mock Supabase client.
 * @returns {boolean} True if using the mock client, false otherwise.
 */
export const isMock = (): boolean => {
  return useMock;
};

/**
 * Checks if the Supabase Realtime client is connected.
 * Basic implementation for demo purposes.
 * @returns {boolean} True if potentially connected, false otherwise.
 */
export const isRealtimeConnected = (): boolean => {
  // Always return false to disable realtime features
  if (isMock()) {
    console.log("[Konbase Debug] isRealtimeConnected called in Demo Mode - returning false");
  }
  return false; 
};

// Export the chosen client instance
export const supabase = supabaseClient;

/**
 * Initializes the Supabase client.
 * In demo mode, this will return the mock client.
 */
export const initializeSupabaseClient = () => {
  logDebug('initializeSupabaseClient called - returning client', null, 'info');
  return supabase;
};

/**
 * Retrieves the Supabase client instance.
 */
export const getSupabaseClient = () => {
  return supabase;
};

/**
 * Reconnects the Supabase Realtime client.
 * In demo mode, this does nothing.
 */
export const reconnectRealtime = () => {
  logDebug('reconnectRealtime called - doing nothing in Demo Mode', null, 'info');
  return false;
};
