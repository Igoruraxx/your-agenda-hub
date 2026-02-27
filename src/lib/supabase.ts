import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://irergynffqnkertdagbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZXJneW5mZnFua2VydGRhZ2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMTI5MTAsImV4cCI6MjA2NDg4ODkxMH0.MsJBHhjSNElm1kFALFkVUsi7sFaoNDdpEwuXNji8MJM';

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'fitpro-auth-token',
      storage: window.localStorage
    },
  }
);
