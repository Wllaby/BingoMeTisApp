import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    // Try to get from environment variables first, then fall back to app.json
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl || '';
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase configuration missing:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        envUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
        configUrl: !!Constants.expoConfig?.extra?.supabaseUrl,
      });
      throw new Error('Supabase URL and/or Anon Key are not configured. Please check your .env file or app.json configuration.');
    }

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
