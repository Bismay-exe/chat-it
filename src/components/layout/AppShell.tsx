import React from 'react';
import { Outlet, useLocation } from 'react-router';
import { BottomDock } from './BottomDock';

export const AppShell: React.FC = () => {
  const location = useLocation();
  const showDock = location.pathname === '/chats' || location.pathname === '/announcements';

  return (
    <div className="flex flex-col h-svh w-full bg-background overflow-hidden relative">
      <main className="flex-1 relative overflow-hidden flex bg-secondary/20">
        <Outlet />
      </main>
      {showDock && <BottomDock />}
    </div>
  );
};
