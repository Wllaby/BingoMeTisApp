import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Hardcoded fallback values
const FALLBACK_SUPABASE_URL = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    // Try multiple sources with fallback
    const supabaseUrl =
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      Constants.expoConfig?.extra?.supabaseUrl ||
      FALLBACK_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      Constants.expoConfig?.extra?.supabaseAnonKey ||
      FALLBACK_SUPABASE_ANON_KEY;

    console.log('Initializing Supabase client on platform:', Platform.OS);

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return supabaseInstance;
}

// Export a proxy object that lazily initializes the client
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export interface BingoTemplate {
  id: string;
  name: string;
  description?: string;
  items: string[];
  is_custom: boolean;
  code?: string;
  created_at: string;
}

export interface BingoGame {
  id: string;
  template_id?: string;
  template_name: string;
  marked_cells: number[];
  completed: boolean;
  completed_at?: string;
  created_at: string;
  started_at: string;
  items: string[];
  bingo_count: number;
  duration?: number;
  is_started: boolean;
  first_bingo_time?: number;
  three_bingos_time?: number;
  full_card_time?: number;
}
