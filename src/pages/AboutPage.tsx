import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Globe, MessageCircle, ChevronRight, ShieldCheck, FileText, RefreshCw, Loader2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { useAutoUpdate, CURRENT_VERSION } from '@/hooks/useAutoUpdate';
import { cn } from '@/lib/utils';

export const AboutPage = () => {
  const navigate = useNavigate();
  const { isChecking, checkForUpdates } = useAutoUpdate();
  const [channel, setChannel] = useState(localStorage.getItem('chat-it-update-channel') || 'stable');

  const handleChannelChange = (newChannel: string) => {
    setChannel(newChannel);
    localStorage.setItem('chat-it-update-channel', newChannel);
  };

  const links = [
    { label: 'Open source licenses', icon: FileText, onClick: () => window.open('https://github.com/' + 'Bismay-exe/chat-it/blob/main/LICENSE', '_blank') },
    { label: 'Privacy policy', icon: ShieldCheck, onClick: () => navigate('/settings/privacy') },
  ];

  const socialLinks = [
    { label: 'GitHub', icon: Globe, url: 'https://github.com/Bismay-exe/chat-it' },
    { label: 'Discord', icon: MessageCircle, url: 'https://discord.gg/chat-it' },
    { label: 'Website', icon: Globe, url: 'https://chat-it-bro.vercel.app/' },
  ];

  return (
    <div className="flex flex-col h-full bg-secondary/10 absolute inset-0 z-50 overflow-y-auto">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg">About</span>
          </div>
        }
      />

      <div className="flex-1 flex flex-col p-6 items-center">
        {/* Logo Section */}
        <div className="mt-8 mb-12 flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
             <MessageCircle className="w-12 h-12 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tighter">Chat-It</h1>
            <p className="text-muted-foreground text-sm font-medium">Connect. Chat. Express.</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="w-full max-w-sm space-y-4">
          <div className="bg-background rounded-3xl border border-border overflow-hidden shadow-sm">
            {/* Version Info */}
            <div className="p-4 flex items-center justify-between border-b border-border">
              <span className="text-sm font-semibold">Version</span>
              <span className="text-sm text-muted-foreground font-mono bg-secondary/50 px-2 py-0.5 rounded-lg">{CURRENT_VERSION}</span>
            </div>

            {/* Channel Selector */}
            <div className="p-4 space-y-3">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Update Channel</span>
              <div className="flex p-1 bg-secondary/50 rounded-2xl gap-1">
                {['stable', 'beta'].map((c) => (
                  <button
                    key={c}
                    onClick={() => handleChannelChange(c)}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold rounded-xl transition-all capitalize",
                      channel === c ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Check for Updates */}
            <button 
              onClick={() => checkForUpdates(true)}
              disabled={isChecking}
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors border-t border-border group"
            >
              <div className="flex items-center gap-3">
                {isChecking ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <RefreshCw className="w-4 h-4 text-primary" />}
                <span className="text-sm font-medium">Check for updates</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="bg-background rounded-3xl border border-border overflow-hidden shadow-sm">
            {links.map((link, idx) => (
              <button
                key={idx}
                onClick={link.onClick}
                className={cn(
                  "w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors group",
                  idx !== links.length - 1 && "border-b border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <link.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{link.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-3 gap-3">
            {socialLinks.map((link, idx) => (
              <button
                key={idx}
                onClick={() => window.open(link.url, '_blank')}
                className="flex flex-col items-center gap-2 p-4 bg-background rounded-3xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <link.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">{link.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.2em] pb-8">
          © 2026 Chat-It Team • Handcrafted with love
        </div>
      </div>
    </div>
  );
};
