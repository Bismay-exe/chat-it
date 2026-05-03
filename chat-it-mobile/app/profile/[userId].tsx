import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { ScreenContainer, Row, Divider } from "@/components/ui/Layout";
import { Heading, Subheading, Body, Small, cn } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  about: string | null;
}

/**
 * View another user's profile (read-only).
 */
export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url, about")
          .eq("id", userId)
          .single();
        if (error) throw error;
        setProfile(data);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const hue = Math.abs((profile?.full_name || "?").charCodeAt(0) * 37) % 360;

  return (
    <ScreenContainer>
      <Row className="px-4 py-3 border-b border-border">
        <AnimatedPressable onPress={() => router.back()} className="mr-3 py-1 px-2">
          <Subheading className="text-primary">←</Subheading>
        </AnimatedPressable>
        <Subheading className="flex-1">
          User Profile
        </Subheading>
      </Row>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : profile ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Avatar */}
          <View className="items-center mt-8 mb-6">
            <Avatar name={profile.full_name} size="lg" className="w-28 h-28" />
          </View>

          {/* Info card */}
          <View className="mx-5 bg-surface-secondary rounded-2xl p-5 border border-border">
            <Small className="font-sf-pro-bold text-primary uppercase tracking-wider mb-1">
              Name
            </Small>
            <Body className="text-lg mb-4">
              {profile.full_name}
            </Body>

            <Divider className="mb-4" />

            <Small className="font-sf-pro-bold text-primary uppercase tracking-wider mb-1">
              Username
            </Small>
            <Body className="text-lg mb-4">
              @{profile.username}
            </Body>

            <Divider className="mb-4" />

            <Small className="font-sf-pro-bold text-primary uppercase tracking-wider mb-1">
              About
            </Small>
            <Body className="text-text-secondary">
              {profile.about || "Available"}
            </Body>
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Body className="text-text-muted">User not found</Body>
        </View>
      )}
    </ScreenContainer>
  );
}
