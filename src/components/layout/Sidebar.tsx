import React from 'react';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router';
import { MessageSquare, Settings, Users, Megaphone, Plus } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarOpen, setSidebarOpen } = useUiStore();

  const navItems = [
    { label: 'All Chats', icon: MessageSquare, path: '/chats' },
    { label: 'Announcements', icon: Megaphone, path: '/announcements' },
    { label: 'Contacts', icon: Users, path: '/search' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      
      {/* Sidebar container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-75 bg-background border-r border-border transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="h-16 flex items-center px-4 border-b border-border">
          <h2 className="text-xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent m-0">
            Chat-It
          </h2>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left premium-transition",
                  isActive 
                    ? "bg-accent/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "fill-primary/10")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Create Chat CTA */}
        <div className="p-4 border-t border-border">
          <button 
            onClick={() => {
              navigate('/add');
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium premium-transition hover:bg-primary/90 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>
    </>
  );
};
