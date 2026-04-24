import React from 'react';
import { useNavigate } from 'react-router';
import { Users, AlertTriangle, Megaphone, Activity, Settings, ArrowLeft, MessageSquareText } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const cards = [
    { title: 'Users', description: 'Manage accounts and bans', icon: Users, path: '/admin/users', color: 'text-blue-400 bg-blue-500/10' },
    { title: 'Reports', description: 'Review reported content', icon: AlertTriangle, path: '/admin/reports', color: 'text-orange-400 bg-orange-500/10' },
    { title: 'Announcements', description: 'System-wide broadcasts', icon: Megaphone, path: '/admin/announcements', color: 'text-green-400 bg-green-500/10' },
    { title: 'Broadcast', description: 'Official Channel Messages', icon: MessageSquareText, path: '/admin/chatscreen', color: 'text-green-400 bg-green-500/10' },
    { title: 'Activity Logs', description: 'Admin audit trails', icon: Activity, path: '/admin/logs', color: 'text-purple-400 bg-purple-500/10' },
    { title: 'Settings', description: 'Global app config', icon: Settings, path: '/admin/settings', color: 'text-zinc-400 bg-zinc-500/10' },
  ];

  return (
    <div className="flex flex-col h-full">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/chats')} className="md:hidden p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg leading-tight">Admin Dashboard</span>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Welcome, Admin</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <button
                key={card.path}
                onClick={() => navigate(card.path)}
                className="flex flex-col text-left p-6 rounded-2xl bg-card/50 backdrop-blur-xl border border-white/20 hover:border-white/20 transition-all hover:-translate-y-1 group"
              >
                <div className={`p-4 rounded-full w-14 h-14 flex items-center justify-center mb-4 ${card.color}`}>
                  <card.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
