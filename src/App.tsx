import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router';
import { Toaster } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import { useCapacitor } from '@/hooks/useCapacitor';
import { SplashScreen } from '@capacitor/splash-screen';

import { AppShell } from '@/components/layout/AppShell';
import { UpdateScreen } from '@/components/layout/UpdateScreen';

// Lazy-load ALL pages — each becomes its own small chunk instead of 1 giant 1.1MB bundle.
// This makes initial load fast and each page transition nearly instant on revisit.
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import('@/pages/AuthPage').then(m => ({ default: m.AuthPage })));
const ChatsPage = lazy(() => import('@/pages/ChatsPage').then(m => ({ default: m.ChatsPage })));
const ChatScreen = lazy(() => import('@/pages/ChatScreen').then(m => ({ default: m.ChatScreen })));
const SearchPage = lazy(() => import('@/pages/SearchPage').then(m => ({ default: m.SearchPage })));
const AddContactPage = lazy(() => import('@/pages/AddContactPage').then(m => ({ default: m.AddContactPage })));
const NewGroupPage = lazy(() => import('@/pages/NewGroupPage').then(m => ({ default: m.NewGroupPage })));
const GroupInfoPage = lazy(() => import('@/pages/GroupInfoPage').then(m => ({ default: m.GroupInfoPage })));
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage').then(m => ({ default: m.UserProfilePage })));
const OwnProfilePage = lazy(() => import('@/pages/OwnProfilePage').then(m => ({ default: m.OwnProfilePage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AnnouncementsPage = lazy(() => import('@/pages/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })));
const GroupMediaPage = lazy(() => import('@/pages/GroupMediaPage').then(m => ({ default: m.GroupMediaPage })));
const AccountPage = lazy(() => import('@/pages/AccountPage').then(m => ({ default: m.AccountPage })));
const ListsPage = lazy(() => import('@/pages/ListsPage').then(m => ({ default: m.ListsPage })));
const ArchivedPage = lazy(() => import('@/pages/ArchivedPage').then(m => ({ default: m.ArchivedPage })));
const ArchivedSettingsPage = lazy(() => import('@/pages/ArchivedSettingsPage').then(m => ({ default: m.ArchivedSettingsPage })));
const AnnouncementsSettingsPage = lazy(() => import('@/pages/AnnouncementsSettingsPage').then(m => ({ default: m.AnnouncementsSettingsPage })));
const InvitePage = lazy(() => import('@/pages/InvitePage').then(m => ({ default: m.InvitePage })));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const AppearancePage = lazy(() => import('@/pages/AppearancePage').then(m => ({ default: m.AppearancePage })));
const HelpPage = lazy(() => import('@/pages/HelpPage').then(m => ({ default: m.HelpPage })));
const AboutPage = lazy(() => import('@/pages/AboutPage').then(m => ({ default: m.AboutPage })));

// Admin pages — separate chunk group
const AdminShell = lazy(() => import('@/components/admin/AdminShell').then(m => ({ default: m.AdminShell })));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminReports = lazy(() => import('@/pages/admin/AdminReports').then(m => ({ default: m.AdminReports })));
const AdminAnnouncements = lazy(() => import('@/pages/admin/AdminAnnouncements').then(m => ({ default: m.AdminAnnouncements })));
const AdminLogs = lazy(() => import('@/pages/admin/AdminLogs').then(m => ({ default: m.AdminLogs })));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));

// Minimal page-level loading skeleton shown ONLY if the chunk is slow to download
// (on fast networks / after first visit this never shows — chunk is already cached)
const PageLoader = () => (
  <div className="h-svh w-full flex items-center justify-center bg-background">
    <span className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

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

// Admin Route Wrapper
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <div className="h-svh w-full flex items-center justify-center bg-background"><span className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return <div className="h-svh w-full flex items-center justify-center bg-background"><span className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (profile.role !== 'admin') {
    return <Navigate to="/chats" replace />;
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
  const { setUser, setLoading, isLoading } = useAuthStore();
  useAutoUpdate();
  useCapacitor();

  useEffect(() => {
    // Single listener for both initial session and changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch profile in background without blocking isLoading
        supabase.from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              if (data.is_banned) {
                // If the user is banned, force logout and prevent entry
                supabase.auth.signOut();
                useAuthStore.getState().setProfile(null);
                useAuthStore.getState().setUser(null);
                return;
              }
              useAuthStore.getState().setProfile(data);
            }
          });
      } else {
        useAuthStore.getState().setProfile(null);
      }
      
      // Mark auth as "ready" as soon as we have a session (or lack thereof)
      setLoading(false);

      // Hide splash screen only after we know the auth state
      if (Capacitor.isNativePlatform()) {
        setTimeout(() => {
          SplashScreen.hide().catch(() => {});
        }, 800); 
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  // While checking initial auth, show nothing 
  // (This keeps the SplashScreen visible behind the webview)
  if (isLoading) {
    return null;
  }

  return (
    <>
      <Toaster position="top-center" richColors theme="system" />
      <UpdateScreen />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RedirectIfSignedIn><LandingPage /></RedirectIfSignedIn>} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected Routes inside AppShell */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="/chats" element={<ChatsPage />}>
            <Route path=":id" element={<ChatScreen />} />
          </Route>
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

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminShell /></Suspense></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="chatscreen" element={<ChatScreen />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;

