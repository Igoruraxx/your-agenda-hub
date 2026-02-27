import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://irergynffqnkertdagbs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZXJneW5mZnFua2VydGRhZ2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4OTM4NjAsImV4cCI6MjA4NzQ2OTg2MH0.qhd5kkVZFGDfeXW41ut57ZB0jvnBf7I5Mn6p-FPDc4I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
});
