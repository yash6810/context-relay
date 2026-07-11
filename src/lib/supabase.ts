import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bnkanwtzusfbsbqthona.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJua2Fud3R6dXNmYnNicXRob25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NjMxNzUsImV4cCI6MjA5OTAzOTE3NX0.l7yI56sk10QX-GJ2yhdi-jmKocAYRE_F5H0DJR8kGDE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "implicit",
    detectSessionInUrl: true,
  },
});