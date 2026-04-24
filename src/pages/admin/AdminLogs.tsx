import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { supabase } from '@/lib/supabase';

export const AdminLogs: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase.from('admin_logs').select(`
      *,
      admin:admin_id(full_name, username)
    `).order('created_at', { ascending: false });
    
    if (data) setLogs(data);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="md:hidden p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg leading-tight">Activity Logs</span>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border/10 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading logs...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No admin activity recorded.</div>
            ) : (
              <div className="divide-y divide-border/10">
                {logs.map((log) => (
                  <div key={log.id} className="p-4">
                    <p className="font-medium">
                      <span className="text-primary">{log.admin?.full_name}</span> performed <span className="font-bold">{log.action}</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Target: {log.target_type} ({log.target_id})
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
