import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Image as ImageIcon, Link as LinkIcon, FileText, Loader2, Download, ExternalLink, X } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type Tab = 'media' | 'links' | 'docs';

interface SharedContent {
  id: string;
  type: Tab;
  url: string;
  name: string;
  created_at: string;
  sender_name: string;
}

export const GroupMediaPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<Tab>('media');
  const [content, setContent] = useState<SharedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<SharedContent | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchContent = async () => {
      setIsLoading(true);
      try {
        // Fetch messages that have attachments or links
        let query = supabase
          .from('messages')
          .select('id, content, created_at, attachment_url, attachment_type, profiles(full_name)')
          .eq('chat_id', id);

        if (activeTab === 'media') {
          query = query.not('attachment_url', 'is', null).ilike('attachment_type', 'image/%');
        } else if (activeTab === 'docs') {
          query = query.not('attachment_url', 'is', null).not('attachment_type', 'ilike', 'image/%');
        } else {
          query = query.ilike('content', '%http%');
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        const formatted: SharedContent[] = (data || []).map((msg: any) => {
          if (activeTab === 'links') {
            const urlMatch = (msg.content as string).match(/https?:\/\/[^\s]+/);
            return {
              id: msg.id,
              type: 'links' as Tab,
              url: urlMatch ? urlMatch[0] : '',
              name: urlMatch ? urlMatch[0] : 'Link',
              created_at: msg.created_at,
              sender_name: msg.profiles?.full_name || 'Unknown'
            };
          }

          return {
            id: msg.id,
            type: activeTab,
            url: msg.attachment_url || '',
            name: (msg.attachment_url || '').split('/').pop() || 'File',
            created_at: msg.created_at,
            sender_name: msg.profiles?.full_name || 'Unknown'
          };
        }).filter(c => c.url);

        setContent(formatted as SharedContent[]);
      } catch (err) {
        console.error("Failed to fetch shared content:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [id, activeTab]);

  return (
    <div className="flex flex-col h-full bg-secondary/5 absolute inset-0 z-50 overflow-hidden">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg">Media, links, and docs</span>
          </div>
        }
      />
      
      <div className="flex p-2 bg-background border-b border-border shadow-sm sticky top-0 z-10">
        <TabButton active={activeTab === 'media'} onClick={() => setActiveTab('media')} label="Media" />
        <TabButton active={activeTab === 'links'} onClick={() => setActiveTab('links')} label="Links" />
        <TabButton active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} label="Docs" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-12">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : content.length > 0 ? (
          <div className={cn(
            activeTab === 'media' ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3" : "flex flex-col gap-4 max-w-4xl mx-auto"
          )}>
            {content.map((item) => (
              <ContentItem key={item.id} item={item} onOpen={setSelectedItem} />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-8">
            <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-border/50">
              {activeTab === 'media' && <ImageIcon className="w-10 h-10 opacity-30" />}
              {activeTab === 'links' && <LinkIcon className="w-10 h-10 opacity-30" />}
              {activeTab === 'docs' && <FileText className="w-10 h-10 opacity-30" />}
            </div>
            <h3 className="text-foreground font-bold text-lg mb-2">No {activeTab} yet</h3>
            <p className="text-sm max-w-60">All {activeTab} shared in this chat will appear here for easy access.</p>
          </div>
        )}
      </div>

      {selectedItem && (
        <FullScreenViewer 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex-1 py-4 text-sm font-bold transition-all relative",
      active ? "text-primary" : "text-muted-foreground hover:bg-secondary/50"
    )}
  >
    {label}
    {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(var(--primary),0.3)]" />}
  </button>
);

const ContentItem = ({ item, onOpen }: { item: SharedContent; onOpen: (item: SharedContent) => void }) => {
  if (item.type === 'media') {
    return (
      <div 
        onClick={() => onOpen(item)}
        className="aspect-square rounded-2xl bg-secondary overflow-hidden relative group cursor-pointer border border-border shadow-sm hover:shadow-md premium-transition"
      >
        <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <ExternalLink className="w-6 h-6 text-white" />
        </div>
      </div>
    );
  }

  if (item.type === 'links') {
    let domain = 'link';
    try {
      domain = new URL(item.url).hostname.replace('www.', '');
    } catch (e) {}
    
    return (
      <a 
        href={item.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-4 p-4 rounded-3xl bg-background hover:bg-secondary/30 border border-border shadow-sm hover:shadow-md premium-transition group"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0 border border-primary/20">
          <LinkIcon className="w-5 h-5" />
          <span className="text-[8px] font-bold mt-0.5 uppercase tracking-tighter">{domain.split('.')[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">{item.url}</p>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{domain}</span>
             <span className="w-1 h-1 rounded-full bg-border" />
             <p className="text-[10px] text-muted-foreground/60 font-medium">
               {item.sender_name} • {format(new Date(item.created_at), 'MMM d')}
             </p>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-3xl bg-background hover:bg-secondary/30 border border-border shadow-sm hover:shadow-md premium-transition group cursor-pointer">
      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0 border border-orange-500/20">
        <FileText className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate text-foreground group-hover:text-orange-600 transition-colors">{item.name}</p>
        <p className="text-[10px] text-muted-foreground/60 font-medium mt-1">
          {item.sender_name} • {format(new Date(item.created_at), 'MMM d, yyyy')}
        </p>
      </div>
      <Download className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

const FullScreenViewer = ({ item, onClose }: { item: SharedContent; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-100 bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white z-10 bg-linear-to-b from-black/60 to-transparent">
        <div className="flex flex-col">
           <span className="font-bold text-sm tracking-tight">{item.name}</span>
           <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Shared by {item.sender_name}</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <img 
          src={item.url} 
          alt={item.name} 
          className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
        />
      </div>

      <div className="absolute bottom-10 flex gap-4 animate-in slide-in-from-bottom duration-500">
         <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-3.5 rounded-2xl flex items-center gap-2 font-bold transition-all active:scale-95 border border-white/10">
            <Download className="w-4 h-4" />
            Download
         </button>
      </div>
    </div>
  );
};
