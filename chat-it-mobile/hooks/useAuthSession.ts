import { useEffect, useRef } from "react";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { fetchProfile } from "@/features/auth/api/authApi";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook that restores auth session on app start (works on any route).
 * Must be called in the root layout so it runs regardless of which
 * route the browser loads.
 */
export function useAuthSession() {
  const { setUser, setProfile, setLoading, user } = useAuthStore();
  const hasBootstrapped = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    let mounted = true;

    async function restore() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          setUser(session.user);

          try {
            const profile = await fetchProfile(session.user.id);
            if (profile && !profile.is_banned && mounted) {
              setProfile(profile);
            } else if (profile?.is_banned) {
              await supabase.auth.signOut();
              setUser(null);
              setProfile(null);
            }
          } catch {
            // Profile fetch failed — session still valid
          }
        }
      } catch {
        // Session restore failed
      } finally {
        if (mounted) setLoading(false);
      }
    }

    restore();

    // Auth state listener for session changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        // Clear ALL cached query data to prevent ghost data on next login
        queryClient.clear();
        setUser(null);
        setProfile(null);
        router.replace("/(auth)/welcome");
      } else if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        try {
          const profile = await fetchProfile(session.user.id);
          if (profile && !profile.is_banned && mounted) {
            setProfile(profile);
          }
        } catch {
          // Non-critical
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
}
