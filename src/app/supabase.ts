import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mmuluvcxpmljsdzcolsh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdWx1dmN4cG1sanNkemNvbHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyOTIyMjEsImV4cCI6MjA5OTg2ODIyMX0.Lf0prsghLe82xkZU3Etg18ohOfPHEE7XtU6WyVA1aSA'

export const supabase = createClient(supabaseUrl, supabaseKey);