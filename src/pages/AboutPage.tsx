import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Globe, MessageCircle, ChevronRight, ShieldCheck, FileText, Loader2, Download } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { CURRENT_VERSION } from '@/hooks/useAutoUpdate';
import { useUpdateStore } from '@/stores/updateStore';
import { cn } from '@/lib/utils';

export const AboutPage = () => {
  const navigate = useNavigate();
  const [channel, setChannel] = useState(localStorage.getItem('chat-it-update-channel') || 'stable');
  const { setUpdateAvailable } = useUpdateStore();

  const [channelLatestVersion, setChannelLatestVersion] = useState('');
  const [channelDownloadUrl, setChannelDownloadUrl] = useState('');
  const [channelReleaseNotes, setChannelReleaseNotes] = useState('');
  const [isFetchingChannel, setIsFetchingChannel] = useState(false);

  useEffect(() => {
    const fetchChannelInfo = async () => {
      setIsFetchingChannel(true);
      try {
        const url = channel === 'stable' 
          ? `https://api.github.com/repos/Bismay-exe/chat-it/releases/latest`
          : `https://api.github.com/repos/Bismay-exe/chat-it/releases`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Fetch error');
        const data = await response.json();
        let latestRelease = Array.isArray(data) ? data[0] : data;
        if (Array.isArray(data) && channel === 'beta') {
          latestRelease = data.find((r: any) => r.prerelease || r.tag_name?.toLowerCase().includes('beta')) || data[0];
        }
        
        if (latestRelease) {
          const sanitizeVersion = (v: string) => v.trim().toLowerCase().replace(/^v/, '');
          const version = sanitizeVersion(latestRelease.tag_name || '');
          const apkAsset = latestRelease.assets?.find((asset: any) => asset.name.endsWith('.apk'));
          const dUrl = apkAsset ? apkAsset.browser_download_url : latestRelease.html_url;

          setChannelLatestVersion(version);
          setChannelDownloadUrl(dUrl);
          setChannelReleaseNotes(latestRelease.body || '');
        }
      } catch(err) {
         console.error(err);
      } finally {
         setIsFetchingChannel(false);
      }
    };
    fetchChannelInfo();
  }, [channel]);

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
          <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20">
            <img src="/logo/chat-it-logo.svg" alt="Chat-It" className="h-9 w-auto xdark:invert" />
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
                      channel === c ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Latest Version Info */}
            <div className="p-4 flex flex-col gap-3 border-t border-border">
               <div className="flex items-center justify-between">
                 <span className="text-sm font-semibold capitalize">{channel} Build</span>
                 {isFetchingChannel ? (
                   <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                 ) : (
                   <span className="text-sm font-bold text-primary max-w-30 truncate" title={channelLatestVersion}>{channelLatestVersion || 'N/A'}</span>
                 )}
               </div>
               <button 
                  onClick={() => setUpdateAvailable(channelLatestVersion, channelDownloadUrl, channelReleaseNotes, channel, true)}
                  disabled={isFetchingChannel || !channelDownloadUrl}
                  className="w-full bg-primary/10 text-primary py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all disabled:opacity-50 mt-1"
               >
                  <Download className="w-4 h-4" />
                  Install Latest {channel === 'stable' ? 'Stable' : 'Beta'}
               </button>
            </div>
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
