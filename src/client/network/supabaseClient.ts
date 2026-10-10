import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { MockRealtimeHub, createMockSupabaseClient } from './mockRealtimeHub.js';

// Singleton In-Memory / BroadcastChannel Hub cho chế độ Local Demo
const fallbackHub = new MockRealtimeHub(true);

/**
 * Kiểm tra xem ứng dụng có đang kết nối với Supabase Cloud thật hay không.
 */
export function isUsingRealSupabase(): boolean {
  const url = import.meta.env?.VITE_SUPABASE_URL;
  const key = import.meta.env?.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.trim() !== '' && key.trim() !== '');
}

/**
 * Trả về Supabase Client:
 * - Nếu có VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY -> Dùng Supabase Realtime Cloud thật.
 * - Nếu thiếu -> Tự động fallback sang BroadcastChannel/In-memory Hub để test đa tab ngay lập tức.
 */
export function getSupabaseClient(clientId: string): SupabaseClient {
  const url = import.meta.env?.VITE_SUPABASE_URL;
  const key = import.meta.env?.VITE_SUPABASE_ANON_KEY;

  if (url && key && url.trim() !== '' && key.trim() !== '') {
    return createClient(url, key);
  }

  return createMockSupabaseClient(fallbackHub, clientId);
}
