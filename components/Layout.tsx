
import React, { ReactNode, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { AppView } from '../types';
import { ChevronLeft } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  title: string;
  currentView: AppView;
  onBack: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title, currentView, onBack }) => {
  const { tg, isVersionAtLeast } = useTelegram();

  useEffect(() => {
    // Sync with Telegram Native Back Button if supported (6.1+)
    if (currentView !== 'DASHBOARD' && isVersionAtLeast('6.1')) {
      tg?.BackButton.show();
      const backListener = () => {
        onBack();
      };
      
      tg?.BackButton.onClick(backListener);
      
      return () => {
        tg?.BackButton.offClick(backListener);
      };
    } else if (isVersionAtLeast('6.1')) {
      tg?.BackButton.hide();
    }
  }, [currentView, onBack, tg, isVersionAtLeast]);

  return (
    <div className="min-h-screen flex flex-col p-4 pb-20 max-w-md mx-auto">
      <header className="mb-6 flex items-center justify-between min-h-[40px]">
        <h1 className="text-2xl font-bold truncate pr-4">{title}</h1>
        
        {/* Persistent UI Back Button in Top Right Corner as requested */}
        {currentView !== 'DASHBOARD' && (
          <button 
            onClick={onBack}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full font-semibold text-sm active:scale-90 transition-transform shadow-sm flex-shrink-0"
          >
            <ChevronLeft size={18} />
            <span>Back</span>
          </button>
        )}
      </header>
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;
