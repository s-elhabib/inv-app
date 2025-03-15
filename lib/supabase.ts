import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aosmhygkauohmlraqlzc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvc21oeWdrYXVvaG1scmFxbHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5OTcyNzAsImV4cCI6MjA1NzU3MzI3MH0.Rab660AS06xm27pIA2F5-tA0RzlgqCQexQfrE1lTQLI';

export const supabase = createClient(supabaseUrl, supabaseKey);