import { supabase } from "@/lib/supabase";

/**
 * Sign in with email + password.
 * Returns the session data or throws.
 */
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Sign up with email + password + profile metadata.
 * Supabase will send an OTP to the email for verification.
 */
export async function signUp(
  email: string,
  password: string,
  username: string,
  fullName: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name: fullName,
      },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Verify the 6-digit OTP code sent to the user's email.
 */
export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });
  if (error) throw error;
  return data;
}

/**
 * Sign out and clear the session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Fetch the user's profile from the profiles table.
 */
export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}
