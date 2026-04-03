import { useNavigate } from 'react-router';
import { ArrowLeft, UserPlus, Copy, Share2, Check } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export const InvitePage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const inviteUrl = window.location.origin;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join me on Chat-It!',
        text: 'Hey! Chat with me on Chat-It, a premium messaging app.',
        url: inviteUrl
      }).catch(() => { });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex flex-col h-full bg-secondary/10 absolute inset-0 z-50 overflow-y-auto">
      <TopBar
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg whitespace-nowrap">Invite a friend</span>
          </div>
        }
      />

      <div className="flex-1 flex flex-col items-center p-8 max-w-md mx-auto w-full">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-sm">
          <UserPlus className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-bold mb-2 text-foreground text-center">Bring your friends</h2>
        <p className="text-sm text-muted-foreground text-center mb-10 leading-relaxed">
          Chat-It is better with friends. Share your unique link or let them scan your QR code to start chatting instantly.
        </p>

        <div className="w-full bg-background rounded-3xl shadow-xl border border-border p-8 mb-8 flex flex-col items-center gap-6">
          <div className="bg-white p-0 rounded-3xl shadow-2xl border border-border/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <img src="/qr/qr.svg" alt="Chat-It" className="w-100 xdark:invert" />
          </div>

          <div className="w-full space-y-3">
            <div className="flex items-center gap-2 p-1 pl-4 bg-secondary/30 rounded-2xl border border-border/90">
              <span className="text-xs font-mono text-muted-foreground truncate flex-1">{inviteUrl}</span>
              <button
                onClick={handleCopy}
                className={cn(
                  "p-3 rounded-xl transition-all active:scale-90",
                  copied ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"
                )}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="w-full grid grid-cols-2 gap-4">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-4 bg-background border border-border rounded-2xl font-semibold shadow-sm hover:bg-secondary/20 premium-transition active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold shadow-md shadow-primary/20 hover:shadow-lg premium-transition active:scale-95"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>

        <p className="mt-8 text-[11px] text-muted-foreground text-center uppercase tracking-widest font-bold">
          Free • Secure • Real-time
        </p>
      </div>
    </div>
  );
};
