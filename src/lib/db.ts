/**
 * St. Mary's High School — Database Client
 * 
 * Central database module (equivalent to the old db/firebase.js).
 * Import from here instead of directly from supabase client.
 * 
 * Usage:
 *   import { db, auth } from "@/lib/db";
 *   const { data } = await db.from("students").select("*");
 *   const { data: { user } } = await auth.getUser();
 */

import { supabase } from "@/integrations/supabase/client";

// Main database client — use for all queries
export const db = supabase;

// Auth shortcut
export const auth = supabase.auth;

// Helper: get current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
};

// Helper: check if user has a specific role
export const checkUserRole = async (role: "admin" | "teacher" | "student"): Promise<boolean> => {
  const userId = await getCurrentUserId();
  if (!userId) return false;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", role)
    .single();
  return !!data;
};

// Helper: get user profile
export const getUserProfile = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
};

// Re-export for convenience
export { supabase };
