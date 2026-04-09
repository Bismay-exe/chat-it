import React from 'react';
import { Outlet, useLocation } from 'react-router';
import { BottomDock } from './BottomDock';
import { DynamicSidebar } from './DynamicSidebar';

export const AppShell: React.FC = () => {
  const location = useLocation();
  const showDock = location.pathname === '/chats' || location.pathname === '/announcements';

  return (
    <div className="flex h-svh w-full bg-background overflow-hidden relative">
      <DynamicSidebar>
        <main className="flex-1 relative h-full overflow-hidden flex bg-secondary/20">
          <Outlet />
        </main>
      </DynamicSidebar>
      {showDock && <BottomDock />}
    </div>
  );
};
