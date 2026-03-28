import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { MessageCircle, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomDock: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { label: 'Chats', icon: MessageCircle, path: '/chats' },
    { label: 'Announcements', icon: Megaphone, path: '/announcements' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around z-50 px-2 pb-safe">
      {tabs.map((tab) => {
        const isActive = location.pathname.startsWith(tab.path);
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              'flex flex-col items-center justify-center w-full h-full gap-1 premium-transition',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              <Icon className={cn('w-6 h-6', isActive && 'fill-primary/20')} />
            </div>
            <span className="text-[10px] font-medium leading-none">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
