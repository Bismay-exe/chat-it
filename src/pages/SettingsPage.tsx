import { Fragment } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Key, Bell, HelpCircle, Palette, Lock, User } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      const logout = useAuthStore.getState().logout;
      logout();
      navigate('/', { replace: true });
    }
  };

  const settingsLinks = [
    { icon: Key, label: 'Account', desc: 'Email, password, delete account', path: '/account' },
    { icon: Lock, label: 'Privacy', desc: 'Blocked contacts, read receipts', path: '/settings/privacy' },
    { icon: Palette, label: 'Appearance', desc: 'Theme colors, chat wallpaper', path: '/settings/appearance' },
    { icon: Bell, label: 'Notifications', desc: 'Message tones, group alerts', path: '/announcements/settings' },
    { icon: User, label: 'Profile', desc: 'About, phone number, name', path: '/profile' },
    { icon: HelpCircle, label: 'Help', desc: 'Help center, privacy policy', path: '/settings/help' },
  ];

  return (
    <div className="flex flex-col h-full bg-secondary/10 absolute inset-0 z-50 overflow-y-auto">
      <TopBar
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/chats')} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg">Settings</span>
          </div>
        }
      />

      <div className="max-w-xl w-full mx-auto pb-10">
        <div
          onClick={() => navigate('/profile')}
          className="bg-background m-4 rounded-3xl p-4 flex items-center gap-4 shadow-sm border border-border cursor-pointer hover:bg-secondary/40 premium-transition"
        >
          <Avatar src={profile?.avatar_url} fallback={profile?.full_name} size="lg" />
          <div className="flex-1">
            <h2 className="text-xl font-medium">{profile?.full_name || 'Loading...'}</h2>
            <p className="text-sm text-muted-foreground">{profile?.about || 'Available'}</p>
          </div>
        </div>

        <div className="bg-background m-4 rounded-3xl shadow-sm border border-border overflow-hidden">
          {settingsLinks.map((link, idx) => {
            const Icon = link.icon;
            return (
              <Fragment key={link.label}>
                <button
                  onClick={() => navigate(link.path)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-secondary/50 premium-transition text-left group"
                >
                  <div className="p-2 bg-secondary rounded-full text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary premium-transition">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[16px] font-medium">{link.label}</div>
                    <div className="text-[13px] text-muted-foreground">{link.desc}</div>
                  </div>
                </button>
                {idx < settingsLinks.length - 1 && <div className="w-full h-px bg-border ml-16" />}
              </Fragment>
            );
          })}
        </div>

        <div className="px-8 mt-8">
          <button
            onClick={handleSignOut}
            className="w-full p-3 font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl premium-transition"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};
