import { useNavigate } from 'react-router';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';

export const GroupMediaPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-background absolute inset-0 z-50">
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
      
      <div className="flex border-b border-border mt-2">
        <button className="flex-1 py-3 text-sm font-medium border-b-2 border-primary text-primary">Media</button>
        <button className="flex-1 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary/40 premium-transition">Links</button>
        <button className="flex-1 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary/40 premium-transition">Docs</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
        <p>No media shared in this chat yet.</p>
      </div>
    </div>
  );
};
