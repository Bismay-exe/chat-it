import React, { useState } from "react";
import {
  View,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { ScreenContainer, Row, Divider } from "@/components/ui/Layout";
import { Heading, Subheading, Body, Caption, Small, cn } from "@/components/ui/Typography";
import { Avatar } from "@/components/ui/Avatar";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";

/**
 * Own profile screen — edit name, username, about.
 * Mirrors web OwnProfilePage functionality (sans avatar upload & social links for now).
 */
export default function OwnProfileScreen() {
  const { profile, user, setProfile } = useAuthStore();

  const [editField, setEditField] = useState<
    "name" | "username" | "about" | null
  >(null);
  const [fieldValue, setFieldValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const startEdit = (field: "name" | "username" | "about") => {
    setEditField(field);
    setUsernameError(null);
    if (field === "name") setFieldValue(profile?.full_name || "");
    else if (field === "username") setFieldValue(profile?.username || "");
    else setFieldValue(profile?.about || "");
  };

  const cancelEdit = () => {
    setEditField(null);
    setFieldValue("");
    setUsernameError(null);
  };

  const saveEdit = async () => {
    if (!user || !editField) return;

    // Validation
    if (editField === "name" && fieldValue.trim().length < 1) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    if (editField === "username") {
      const clean = fieldValue.toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (clean.length < 3) {
        setUsernameError("Username must be at least 3 characters");
        return;
      }
      // Check uniqueness
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", clean)
        .single();
      if (data && data.id !== user.id) {
        setUsernameError("Username is already taken");
        return;
      }
    }

    setSaving(true);
    try {
      const updates: { full_name?: string; username?: string; about?: string } = {};
      if (editField === "name") updates.full_name = fieldValue.trim();
      else if (editField === "username")
        updates.username = fieldValue.toLowerCase().replace(/[^a-z0-9_]/g, "");
      else updates.about = fieldValue.trim();

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
      if (error) throw error;

      setProfile({ ...profile!, ...updates });
      cancelEdit();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const hue = Math.abs((profile?.full_name || "?").charCodeAt(0) * 37) % 360;

  return (
    <ScreenContainer>
      {/* Header */}
      <Row className="px-4 py-3 border-b border-border">
        <AnimatedPressable onPress={() => router.back()} className="mr-3 py-1 px-2">
          <Subheading className="text-primary">←</Subheading>
        </AnimatedPressable>
        <Subheading className="flex-1">
          Profile
        </Subheading>
      </Row>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Avatar */}
        <View className="items-center mt-8 mb-6">
          <Avatar name={profile?.full_name} size="lg" className="w-28 h-28" />
        </View>

        {/* Editable fields card */}
        <View className="mx-5 bg-surface-secondary rounded-2xl p-5 border border-border">
          {/* Name */}
          <ProfileField
            label="Your Name"
            value={profile?.full_name || ""}
            isEditing={editField === "name"}
            editValue={fieldValue}
            onChangeEdit={setFieldValue}
            onStartEdit={() => startEdit("name")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            saving={saving}
            hint="This name will be visible to your Chat-It contacts."
          />

          <Divider className="my-4" />

          {/* Username */}
          <ProfileField
            label="Username"
            value={`@${profile?.username || "username"}`}
            isEditing={editField === "username"}
            editValue={fieldValue}
            onChangeEdit={(v) =>
              setFieldValue(v.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            onStartEdit={() => startEdit("username")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            saving={saving}
            error={usernameError}
          />

          <Divider className="my-4" />

          {/* About */}
          <ProfileField
            label="About"
            value={profile?.about || "Available"}
            isEditing={editField === "about"}
            editValue={fieldValue}
            onChangeEdit={setFieldValue}
            onStartEdit={() => startEdit("about")}
            onCancel={cancelEdit}
            onSave={saveEdit}
            saving={saving}
            multiline
          />
        </View>

        {/* Info */}
        <View className="mx-5 mt-6">
          <Row>
            <Caption className="mr-1">🔒</Caption>
            <Caption>
              Your profile is only visible to your contacts.
            </Caption>
          </Row>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * Reusable profile field component — display + inline edit.
 */
function ProfileField({
  label,
  value,
  isEditing,
  editValue,
  onChangeEdit,
  onStartEdit,
  onCancel,
  onSave,
  saving,
  hint,
  error,
  multiline,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  editValue: string;
  onChangeEdit: (v: string) => void;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  hint?: string;
  error?: string | null;
  multiline?: boolean;
}) {
  return (
    <View>
      <Small className="font-sf-pro-bold text-primary uppercase tracking-wider mb-2">
        {label}
      </Small>

      {isEditing ? (
        <View>
          <TextInput
            value={editValue}
            onChangeText={onChangeEdit}
            autoFocus
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            className="bg-background text-text-primary rounded-xl px-4 py-3 text-base border-2 border-primary font-sf-pro"
            style={multiline ? { textAlignVertical: "top", minHeight: 80 } : {}}
            placeholderTextColor="#A1A1AA"
          />
          {error && (
            <Small className="text-error mt-1 ml-1">{error}</Small>
          )}
          <Row className="justify-end mt-2">
            <AnimatedPressable
              onPress={onCancel}
              className="px-4 py-2 mr-2 rounded-xl"
            >
              <Body className="text-error font-sf-pro-semibold">Cancel</Body>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={onSave}
              disabled={saving}
              className="px-4 py-2 bg-primary rounded-xl min-w-20 items-center justify-center"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Body className="text-white font-sf-pro-semibold">Save</Body>
              )}
            </AnimatedPressable>
          </Row>
        </View>
      ) : (
        <AnimatedPressable
          onPress={onStartEdit}
          className="flex-row items-center justify-between"
        >
          <Body className="flex-1 text-lg">
            {value}
          </Body>
          <Body className="text-primary ml-2">✏️</Body>
        </AnimatedPressable>
      )}

      {hint && !isEditing && (
        <Caption className="mt-2">{hint}</Caption>
      )}
    </View>
  );
}
