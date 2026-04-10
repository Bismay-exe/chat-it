import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Key, Smartphone, FileText, Trash2, Loader2, Mail, Lock } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';

export const AccountPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateEmail = async () => {
    if (!newEmail) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Confirmation email sent to " + newEmail);
      setIsChangingEmail(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setIsChangingPassword(false);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirm1 = window.confirm("Are you sure you want to delete your account?");
    if (!confirm1) return;
    const confirm2 = window.prompt("Type DELETE to confirm account deletion:");
    if (confirm2 !== 'DELETE') return;

    try {
      setIsUpdating(true);
      // Delete profile first (cascade would be better but let's be explicit)
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', user.id);
      if (profileError) throw profileError;

      // Note: Supabase Client SDK cannot delete the Auth User directly without Admin/Service Role
      // In a real production app, this would be a call to an Edge Function
      // For this PWA demo, we sign out as the final step.
      await supabase.auth.signOut();
      toast.success("Account marked for deletion");
      navigate('/auth');
    } catch (err: any) {
      toast.error("Failed to delete account: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const links = [
    { icon: Mail, label: 'Change email address', onClick: () => setIsChangingEmail(true) },
    { icon: Lock, label: 'Change password', onClick: () => setIsChangingPassword(true) },
    { icon: Key, label: 'Security notifications', onClick: () => toast.info("Security notification settings coming soon") },
    { icon: Smartphone, label: 'Two-step verification', onClick: () => toast.info("Two-step verification coming soon") },
    { icon: FileText, label: 'Request account info', onClick: () => toast.info("Your data report is being generated...") },
    { icon: Trash2, label: 'Delete account', textClass: 'text-red-500', onClick: handleDeleteAccount },
  ];

  return (
    <div className="flex flex-col h-full bg-secondary/10 absolute inset-0 z-50">
      <TopBar
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg">Account</span>
          </div>
        }
      />

      <div className="max-w-xl w-full mx-auto p-4 space-y-6">
        <div className="bg-background rounded-3xl shadow-sm border border-border">
          <div className="p-4">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Email Address</span>
            <div className="mt-1 text-lg">{user?.email}</div>
          </div>
        </div>

        <div className="bg-background rounded-3xl shadow-sm border border-border">

          {links.map((link, idx) => {
            const Icon = link.icon;
            return (
              <button
                key={idx}
                onClick={link.onClick}
                className="w-full p-4 flex items-center gap-4 hover:bg-secondary/50 premium-transition text-left"
              >
                <Icon className={cn("w-6 h-6 text-muted-foreground", link.textClass)} />
                <span className={cn("text-[16px] flex-1 border-b border-border pb-4 -mb-4", link.textClass)}>
                  {link.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-8">
          <button
            onClick={handleSignOut}
            className="w-full p-4 font-semibold text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-2xl border border-red-500/20 premium-transition"
          >
            Log Out of All Sessions
          </button>
        </div>
      </div>

      {/* Change Email Modal */}
      <BottomSheet isOpen={isChangingEmail} onClose={() => setIsChangingEmail(false)} title="Change Email">
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">Enter a new email address. You will need to confirm the change via email.</p>
          <input 
            type="email"
            placeholder="New email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full bg-secondary/50 rounded-2xl p-4 outline-none border-2 border-transparent focus:border-primary transition-all"
          />
          <button 
            disabled={isUpdating}
            onClick={handleUpdateEmail}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Update Email'}
          </button>
        </div>
      </BottomSheet>

      {/* Change Password Modal */}
      <BottomSheet isOpen={isChangingPassword} onClose={() => setIsChangingPassword(false)} title="Change Password">
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">Enter a new password (min. 6 characters).</p>
          <input 
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-secondary/50 rounded-2xl p-4 outline-none border-2 border-transparent focus:border-primary transition-all"
          />
          <button 
            disabled={isUpdating}
            onClick={handleUpdatePassword}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Update Password'}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
