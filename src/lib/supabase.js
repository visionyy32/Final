import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vzquegbhmptsdftzgtcl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6cXVlZ2JobXB0c2RmdHpndGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNTgwNjIsImV4cCI6MjA2OTYzNDA2Mn0.MRyQaUJLz7a5UNzNLeW8No8sJhpdTC2KilTLjP6_zug'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 