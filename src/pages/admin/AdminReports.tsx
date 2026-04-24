import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';

export const AdminReports: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="md:hidden p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg leading-tight">Reports</span>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <p className="text-muted-foreground">Review user reports here...</p>
      </div>
    </div>
  );
};
