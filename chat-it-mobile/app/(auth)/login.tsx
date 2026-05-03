import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  signInWithPassword,
  signUp,
  verifyOtp,
} from "@/features/auth/api/authApi";

type Step = "form" | "otp";
type Mode = "login" | "signup";

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");

  // OTP
  const [otpToken, setOtpToken] = useState("");
  const [otpEmail, setOtpEmail] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setUsername("");
    setFullName("");
    setOtpToken("");
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await signInWithPassword(email.trim(), password);
      // Auth state listener in index.tsx will handle redirect
      router.replace("/(tabs)/chats");
    } catch (error: any) {
      if (error.message?.includes("Email not confirmed")) {
        setOtpEmail(email.trim());
        setStep("otp");
        Alert.alert("Verify Email", "Please check your inbox for a 6-digit code.");
      } else {
        Alert.alert("Login Failed", error.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (
      !email.trim() ||
      !password.trim() ||
      !username.trim() ||
      !fullName.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, username.trim(), fullName.trim());
      setOtpEmail(email.trim());
      setStep("otp");
      Alert.alert("Check your email", "We sent you a 6-digit verification code.");
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpToken.length !== 6) return;

    setLoading(true);
    try {
      await verifyOtp(otpEmail, otpToken);
      router.replace("/(tabs)/chats");
    } catch (error: any) {
      Alert.alert("Verification Failed", error.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="px-6 pt-4">
            <Pressable onPress={() => router.back()}>
              <Text className="text-lg text-blue-500">← Back</Text>
            </Pressable>
          </View>

          <View className="flex-1 px-6 pt-8">
            {step === "otp" ? (
              /* ── OTP Verification ── */
              <View>
                <Text className="text-3xl font-bold text-black dark:text-white mb-2">
                  Verify Email
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 mb-1">
                  Enter the 6-digit code sent to:
                </Text>
                <Text className="text-blue-500 font-semibold mb-8">
                  {otpEmail}
                </Text>

                <TextInput
                  value={otpToken}
                  onChangeText={(t) => setOtpToken(t.replace(/\D/g, ""))}
                  placeholder="000000"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  className="h-16 bg-gray-100 dark:bg-gray-900 text-black dark:text-white text-center text-3xl font-bold tracking-widest rounded-2xl mb-6"
                />

                <Pressable
                  onPress={handleVerifyOtp}
                  disabled={otpToken.length !== 6 || loading}
                  className={`h-14 rounded-2xl items-center justify-center ${
                    otpToken.length === 6
                      ? "bg-black dark:bg-white"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      className={`text-lg font-semibold ${
                        otpToken.length === 6
                          ? "text-white dark:text-black"
                          : "text-gray-500"
                      }`}
                    >
                      Verify & Join
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => {
                    setStep("form");
                    setOtpToken("");
                  }}
                  className="mt-4 items-center"
                >
                  <Text className="text-gray-500 text-sm">
                    Wait, I made a mistake
                  </Text>
                </Pressable>
              </View>
            ) : (
              /* ── Login / Signup Form ── */
              <View>
                <Text className="text-3xl font-bold text-black dark:text-white mb-8">
                  {mode === "login" ? "Welcome back" : "Create account"}
                </Text>

                {/* Tab switcher */}
                <View className="flex-row bg-gray-100 dark:bg-gray-900 rounded-2xl p-1 mb-8">
                  <Pressable
                    onPress={() => {
                      setMode("login");
                      resetForm();
                    }}
                    className={`flex-1 py-3 rounded-xl items-center ${
                      mode === "login" ? "bg-white dark:bg-gray-800" : ""
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        mode === "login"
                          ? "text-black dark:text-white"
                          : "text-gray-500"
                      }`}
                    >
                      Log In
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setMode("signup");
                      resetForm();
                    }}
                    className={`flex-1 py-3 rounded-xl items-center ${
                      mode === "signup" ? "bg-white dark:bg-gray-800" : ""
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        mode === "signup"
                          ? "text-black dark:text-white"
                          : "text-gray-500"
                      }`}
                    >
                      Sign Up
                    </Text>
                  </Pressable>
                </View>

                {/* Signup-only fields */}
                {mode === "signup" && (
                  <>
                    <TextInput
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Full Name"
                      placeholderTextColor="#999"
                      autoCapitalize="words"
                      className="h-14 bg-gray-100 dark:bg-gray-900 text-black dark:text-white rounded-2xl px-5 text-base mb-3"
                    />
                    <TextInput
                      value={username}
                      onChangeText={setUsername}
                      placeholder="Username"
                      placeholderTextColor="#999"
                      autoCapitalize="none"
                      className="h-14 bg-gray-100 dark:bg-gray-900 text-black dark:text-white rounded-2xl px-5 text-base mb-3"
                    />
                  </>
                )}

                {/* Shared fields */}
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email Address"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="h-14 bg-gray-100 dark:bg-gray-900 text-black dark:text-white rounded-2xl px-5 text-base mb-3"
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={
                    mode === "signup"
                      ? "Password (min 8 characters)"
                      : "Password"
                  }
                  placeholderTextColor="#999"
                  secureTextEntry
                  className="h-14 bg-gray-100 dark:bg-gray-900 text-black dark:text-white rounded-2xl px-5 text-base mb-3"
                />

                {mode === "signup" && (
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm Password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    className="h-14 bg-gray-100 dark:bg-gray-900 text-black dark:text-white rounded-2xl px-5 text-base mb-3"
                  />
                )}

                {/* Submit */}
                <Pressable
                  onPress={mode === "login" ? handleLogin : handleSignup}
                  disabled={loading}
                  className="h-14 bg-black dark:bg-white rounded-2xl items-center justify-center mt-4 active:opacity-80"
                >
                  {loading ? (
                    <ActivityIndicator
                      color={Platform.OS === "ios" ? "#fff" : "#000"}
                    />
                  ) : (
                    <Text className="text-white dark:text-black text-lg font-semibold">
                      {mode === "login" ? "Continue" : "Create Account"}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
