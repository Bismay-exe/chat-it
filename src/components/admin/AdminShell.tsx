import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { Users, AlertTriangle, Megaphone, MessageSquareText, Activity, Settings, ArrowLeft } from 'lucide-react';
import bg from '/backgrounds/002.jpg';

export const AdminShell: React.FC = () => {
  const navigate = useNavigate();
  const navItems = [
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/reports', icon: AlertTriangle, label: 'Reports' },
    { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/admin/chatscreen', icon: MessageSquareText, label: 'Broadcast' },
    { to: '/admin/logs', icon: Activity, label: 'Logs' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-svh w-full bg-cover bg-center bg-no-repeat text-foreground overflow-hidden"
      style={{ backgroundImage: `url(${bg})` }}
      >
      {/* Admin Sidebar */}
      <div className="w-64 border-r border-border/10 bg-card hidden md:flex flex-col">
        <div className="p-4 flex items-center gap-3 border-b border-border/10">
          <button onClick={() => navigate('/chats')} className="p-2 hover:bg-white/5 rounded-full transition-colors active:scale-95">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="font-semibold text-lg">Admin System</h2>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          <NavLink 
            to="/admin" 
            end 
            className={({ isActive }) => `px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'}`}
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </NavLink>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
