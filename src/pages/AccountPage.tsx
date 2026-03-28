import { useNavigate } from 'react-router';
import { ArrowLeft, Key, Smartphone, FileText, Trash2, Download } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const AccountPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirm = window.confirm("Are you absolutely sure? This will permanently delete your account and all messages.");
    if (!confirm) return;

    try {
      // In a real app, you'd call an Edge Function or trigger a cascade
      // Here we'll just demonstrate the flow
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;

      await supabase.auth.signOut();
      toast.success("Account deleted successfully");
      navigate('/auth');
    } catch (err: any) {
      toast.error("Failed to delete account: " + err.message);
    }
  };

  const links = [
    { icon: Key, label: 'Security notifications', onClick: () => toast.info("Security notification settings coming soon") },
    { icon: Smartphone, label: 'Two-step verification', onClick: () => toast.info("Two-step verification coming soon") },
    { icon: Smartphone, label: 'Change number', onClick: () => toast.info("Change number feature coming soon") },
    { icon: FileText, label: 'Request account info', onClick: () => toast.info("Your data report is being generated...") },
    { icon: Download, label: 'Passkeys', onClick: () => toast.info("Passkeys setup coming soon") },
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

      <div className="flex-1 overflow-y-auto">
        <div className="bg-background mt-4 border-y border-border">
          <div className="p-4 border-b border-border">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Email Address</span>
            <div className="mt-1 text-lg">{user?.email}</div>
          </div>

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

        <div className="p-8">
          <button
            onClick={handleSignOut}
            className="w-full p-4 font-semibold text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-2xl border border-red-500/20 premium-transition"
          >
            Log Out of All Sessions
          </button>
        </div>
      </div>
    </div>
  );
};
