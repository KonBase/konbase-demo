// NOTE: In Demo Mode, src/lib/supabase.ts should be the primary import.
// This file provides the mock client if used.

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types'; // Assuming this path is correct
import { loadConfig, isConfigured } from '@/lib/config-store'; // Import modified functions
import { mockSupabase } from '@/lib/mockSupabase'; // Import the mock

let dynamicSupabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export const getDynamicSupabaseClient = () => {
  console.log("getDynamicSupabaseClient called in Demo Mode - returning mock client");
  // Always return the mock client in demo mode
  if (!dynamicSupabaseClient) {
      dynamicSupabaseClient = mockSupabase as any;
  }
  return dynamicSupabaseClient;

  /* // Original logic:
  if (dynamicSupabaseClient) {
    return dynamicSupabaseClient;
  }

  const config = loadConfig(); // Use loadConfig
  const configured = isConfigured(); // Use isConfigured

  if (configured && config?.url && config?.key) {
    dynamicSupabaseClient = createClient<Database>(config.url, config.key);
    return dynamicSupabaseClient;
  }

  // console.warn('Dynamic Supabase client could not be initialized. Configuration missing or incomplete.');
  return null;
  */
};

// Optional: Function to reset the client if config changes
export const resetDynamicSupabaseClient = () => {
  console.log("resetDynamicSupabaseClient called in Demo Mode - resetting mock client reference");
  dynamicSupabaseClient = null; // Allow re-fetching the mock instance
};
