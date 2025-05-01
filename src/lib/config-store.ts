// Configuration storage for application settings
// This file provides utilities for storing and retrieving configuration

export interface SupabaseConfig {
  url: string;
  key: string;
  configured: boolean;
}

const CONFIG_KEY = 'konbase_config';

// Load configuration from localStorage
export function loadConfig(): SupabaseConfig | null {
  // In demo mode, we don't need real config
  console.log("loadConfig called in Demo Mode - returning mock config status");
  return { url: 'mock-url', key: 'mock-key', configured: true };
}

// Save configuration to localStorage
export function saveConfig(config: SupabaseConfig): boolean {
  // In demo mode, saving is ignored
  console.log("saveConfig called in Demo Mode - ignoring", config);
  return true;
}

// Check if application is configured via localStorage OR environment variables
export function isConfigured(): boolean {
  // In demo mode, always return true so the app doesn't get stuck on config screen
  console.log("isConfigured called in Demo Mode - returning true");
  return true;
}

// Clear configuration
export function clearConfig(): boolean {
  // In demo mode, clearing is ignored
  console.log("clearConfig called in Demo Mode - ignoring");
  return true;
}
