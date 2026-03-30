import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router';
import { Toaster } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';

import { AppShell } from '@/components/layout/AppShell';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { ChatsPage } from '@/pages/ChatsPage';
import { ChatScreen } from '@/pages/ChatScreen';
import { SearchPage } from '@/pages/SearchPage';
import { AddContactPage } from '@/pages/AddContactPage';
import { NewGroupPage } from '@/pages/NewGroupPage';
import { GroupInfoPage } from '@/pages/GroupInfoPage';
import { UserProfilePage } from '@/pages/UserProfilePage';
import { OwnProfilePage } from '@/pages/OwnProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AnnouncementsPage } from '@/pages/AnnouncementsPage';
import { GroupMediaPage } from '@/pages/GroupMediaPage';
import { AccountPage } from '@/pages/AccountPage';
import { ListsPage } from '@/pages/ListsPage';
import { ArchivedPage } from '@/pages/ArchivedPage';
import { ArchivedSettingsPage } from '@/pages/ArchivedSettingsPage';
import { AnnouncementsSettingsPage } from '@/pages/AnnouncementsSettingsPage';
import { InvitePage } from '@/pages/InvitePage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { AppearancePage } from '@/pages/AppearancePage';
import { HelpPage } from '@/pages/HelpPage';
import { AboutPage } from '@/pages/AboutPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <div className="h-svh w-full flex items-center justify-center bg-background"><span className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Redirect component for root/auth when signed in
const RedirectIfSignedIn = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (user && (location.pathname === '/' || location.pathname === '/auth')) {
    return <Navigate to="/chats" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { setUser, setLoading } = useAuthStore();
  useAutoUpdate();

  useEffect(() => {
    // Single listener for both initial session and changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      
      if (user) {
        // Fetch profile in background without blocking isLoading
        supabase.from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) useAuthStore.getState().setProfile(data);
          });
      } else {
        useAuthStore.getState().setProfile(null);
      }
      
      // Mark auth as "ready" as soon as we have a session (or lack thereof)
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return (
    <>
      <Toaster position="top-center" richColors theme="system" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<RedirectIfSignedIn><LandingPage /></RedirectIfSignedIn>} />
        <Route path="/auth" element={<RedirectIfSignedIn><AuthPage /></RedirectIfSignedIn>} />

        {/* Protected Routes inside AppShell */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="/chats" element={<ChatsPage />} />
          <Route path="/chats/:id" element={<ChatScreen />} />
          <Route path="/chats/:id/info" element={<GroupInfoPage />} />
          <Route path="/chats/:id/media" element={<GroupMediaPage />} />
          <Route path="/chats/lists" element={<ListsPage />} />
          
          <Route path="/search" element={<SearchPage />} />
          
          <Route path="/add" element={<AddContactPage />} />
          <Route path="/add/new-group" element={<NewGroupPage />} />
          
          <Route path="/profile" element={<OwnProfilePage />} />
          <Route path="/profile/:id" element={<UserProfilePage />} />
          
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/account" element={<AccountPage />} />
          
          <Route path="/archived" element={<ArchivedPage />} />
          <Route path="/archived/settings" element={<ArchivedSettingsPage />} />
          
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/announcements/settings" element={<AnnouncementsSettingsPage />} />
          
          <Route path="/settings/privacy" element={<PrivacyPage />} />
          <Route path="/settings/appearance" element={<AppearancePage />} />
          <Route path="/settings/help" element={<HelpPage />} />
          <Route path="/about" element={<AboutPage />} />
          
          <Route path="/invite" element={<InvitePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
