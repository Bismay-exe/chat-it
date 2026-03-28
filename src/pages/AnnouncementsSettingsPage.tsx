import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';

export const AnnouncementsSettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-secondary/10 absolute inset-0 z-50">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg">Announcements</span>
          </div>
        }
      />
      
      <div className="bg-background mt-4 border-y border-border p-4 flex flex-col gap-2">
        <h3 className="text-primary text-sm font-semibold mb-2">Platform Notifications</h3>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-[16px] mb-1">Show Notifications</h3>
            <p className="text-xs text-muted-foreground mr-4">
              Get push notifications for important updates from the Chat-It platform.
            </p>
          </div>
          <div className="relative inline-block w-12 h-6 rounded-full bg-primary premium-transition cursor-pointer shrink-0">
            <div className="absolute w-5 h-5 bg-white rounded-full top-0.5 right-0.5 shadow-sm transform transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
