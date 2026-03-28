import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Palette, Check } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { cn } from '@/lib/utils';

export const AppearancePage = () => {
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState('Default');

  const themes = [
    { name: 'Default', color: 'bg-emerald-500' },
    { name: 'Blue', color: 'bg-blue-500' },
    { name: 'Purple', color: 'bg-purple-500' },
    { name: 'Rose', color: 'bg-rose-500' },
    { name: 'Amber', color: 'bg-amber-500' },
    { name: 'Dark Slate', color: 'bg-slate-800' },
  ];

  return (
    <div className="flex flex-col h-full bg-secondary/10 absolute inset-0 z-50 overflow-y-auto">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg">Appearance</span>
          </div>
        }
      />
      
      <div className="max-w-xl w-full mx-auto p-4 space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-4 mb-3">Theme Color</h3>
          <div className="bg-background rounded-3xl shadow-sm border border-border p-4 grid grid-cols-2 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => setSelectedTheme(theme.name)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl border-2 premium-transition",
                  selectedTheme === theme.name ? "border-primary bg-primary/5" : "border-transparent hover:bg-secondary/40"
                )}
              >
                <div className={cn("w-6 h-6 rounded-full shadow-inner", theme.color)} />
                <span className="text-sm font-medium flex-1 text-left">{theme.name}</span>
                {selectedTheme === theme.name && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-4 mb-3">Chat Wallpaper</h3>
          <button className="w-full bg-background rounded-3xl shadow-sm border border-border p-4 flex items-center justify-between hover:bg-secondary/40 premium-transition">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-secondary rounded-full">
                <Palette className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <div className="text-[15px] font-medium">Choose from library</div>
                <div className="text-[12px] text-muted-foreground">Solid colors, gradients, images</div>
              </div>
            </div>
          </button>
        </section>
      </div>
    </div>
  );
};
