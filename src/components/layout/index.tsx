/**
 * 布局组件 - 科技宇宙 (Sci-Fi Cosmic) 风格
 */

import type { ReactNode } from 'react';
import { 
  IconStarMapCalendar, 
  IconEnergyCrystal, 
  IconCosmicCapsule, 
  IconCommandDeck 
} from '@/components/icons/CosmicIcons';

// ============ Header 组件 ============

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: ReactNode;
}

export function Header({ title, showBack = false, onBack, rightContent }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-[#070B19]/80 backdrop-blur-md border-b border-sky-500/20 px-4 py-3 z-30 transition-colors">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        {showBack ? (
          <button 
            onClick={onBack} 
            className="text-slate-300 hover:text-cyan-400 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors flex items-center justify-center"
          >
            <span className="text-lg">←</span>
          </button>
        ) : <div className="w-8" />}
        
        <h1 className="font-bold text-base tracking-wide text-white flex items-center gap-2 font-orbitron">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#00F0FF] animate-pulse"></span>
          {title || '小朋友任务规划 · 星际探索舱'}
        </h1>
        
        {rightContent || <div className="w-8" />}
      </div>
    </header>
  );
}

// ============ Page 组件 ============

interface PageProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  headerRight?: ReactNode;
  className?: string;
  theme?: 'child' | 'parent';
}

export function Page({ children, title, showHeader = true, headerRight, className = '', theme: _theme = 'child' }: PageProps) {
  return (
    <div className={`min-h-screen text-white ${className} relative overflow-x-hidden`}>
      {/* 科技宇宙深空星光背景特效 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px]"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col min-h-screen">
        {showHeader && <Header title={title} rightContent={headerRight} />}
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

// ============ TabBar 组件 ============

interface TabBarItem {
  key: string;
  label: string;
  icon?: string;
  badge?: number;
}

interface TabBarProps {
  items: TabBarItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

export function TabBar({ items, activeKey, onChange }: TabBarProps) {
  const renderTabIcon = (key: string, isActive: boolean) => {
    switch (key) {
      case 'tasks':
        return <IconStarMapCalendar size={22} className={isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_#00F0FF]' : 'text-slate-400'} />;
      case 'points':
        return <IconEnergyCrystal size={22} className={isActive ? 'text-amber-400 drop-shadow-[0_0_8px_#FBBF24]' : 'text-slate-400'} />;
      case 'rewards':
        return <IconCosmicCapsule size={22} className={isActive ? 'text-purple-400 drop-shadow-[0_0_8px_#A855F7]' : 'text-slate-400'} />;
      default:
        return <IconCommandDeck size={22} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />;
    }
  };

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-40 bg-[#0B132B]/95 backdrop-blur-xl border border-sky-500/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.7)] safe-area-bottom">
      <div className="flex justify-around items-center py-2 px-3">
        {items.map(item => {
          const isActive = activeKey === item.key;
          return (
            <button
              key={item.key}
              className={`flex flex-col items-center py-1.5 px-4 rounded-xl transition-all duration-200 relative ${
                isActive 
                  ? 'text-cyan-300 bg-cyan-950/40 shadow-[inset_0_0_12px_rgba(0,240,255,0.2)]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
              onClick={() => onChange(item.key)}
            >
              <div className="relative flex items-center justify-center">
                {renderTabIcon(item.key, isActive)}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-3 min-w-[16px] h-[16px] px-1 text-[9px] font-bold font-orbitron bg-rose-500 text-white rounded-full flex items-center justify-center shadow-[0_0_10px_#F43F5E]">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 font-medium tracking-wider ${isActive ? 'text-cyan-300 font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ============ DateHeader 组件 ============

interface DateHeaderProps {
  date: string;
  onPrevDay?: () => void;
  onNextDay?: () => void;
}

export function DateHeader({ date, onPrevDay, onNextDay }: DateHeaderProps) {
  const d = new Date(date);
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];

  return (
    <div className="flex items-center justify-between cosmic-glass px-4 py-2.5 text-sm mb-5 w-full">
      {onPrevDay ? (
        <button
          onClick={onPrevDay}
          className="text-slate-300 hover:text-cyan-400 px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors flex items-center gap-1 font-medium"
        >
          <span>←</span>
          <span className="text-xs hidden sm:inline">前一天</span>
        </button>
      ) : <div className="w-16" />}
      
      <div className="flex items-center gap-3">
        <IconStarMapCalendar size={20} className="text-cyan-400" />
        <span className="text-white font-bold font-orbitron tracking-wider text-base">{date}</span>
        <span className="text-xs px-2.5 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-semibold tracking-wide">
          {weekday}
        </span>
      </div>
      
      {onNextDay ? (
        <button
          onClick={onNextDay}
          className="text-slate-300 hover:text-cyan-400 px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors flex items-center gap-1 font-medium"
        >
          <span className="text-xs hidden sm:inline">后一天</span>
          <span>→</span>
        </button>
      ) : <div className="w-16" />}
    </div>
  );
}
