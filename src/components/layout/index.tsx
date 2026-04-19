/**
 * 布局组件
 */

import type { ReactNode } from 'react';
import { Icon } from '@/components/ui';

// ============ Header 组件 ============

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: ReactNode;
}

export function Header({ title, showBack = false, onBack, rightContent }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 z-10">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {showBack && (
          <button onClick={onBack} className="text-gray-600 p-1">
            <Icon name="back" size={20} />
          </button>
        )}
        
        <h1 className="font-medium text-lg text-gray-800">
          {title || '小朋友任务规划'}
        </h1>
        
        {rightContent || <div className="w-6" />}
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
  /** 页面类型：child（小孩端黄色）或 parent（家长端蓝色） */
  theme?: 'child' | 'parent';
}

export function Page({ children, title, showHeader = true, headerRight, className = '', theme = 'child' }: PageProps) {
  const themeClasses = {
    child: 'bg-gradient-to-b from-yellow-50 to-orange-50',
    parent: 'bg-gradient-to-b from-parent-50 to-parent-100',
  };

  return (
    <div className={`min-h-screen ${themeClasses[theme]} ${className}`}>
      {showHeader && <Header title={title} rightContent={headerRight} />}
      <main className="w-full px-4 py-4 md:max-w-2xl md:mx-auto lg:max-w-4xl">
        {children}
      </main>
    </div>
  );
}

// ============ TabBar 组件 ============

interface TabBarItem {
  key: string;
  label: string;
  icon: string;
}

interface TabBarProps {
  items: TabBarItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

export function TabBar({ items, activeKey, onChange }: TabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-bottom">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {items.map(item => (
          <button
            key={item.key}
            className={`flex flex-col items-center py-1 px-3 ${
              activeKey === item.key 
                ? 'text-primary-500' 
                : 'text-gray-400'
            }`}
            onClick={() => onChange(item.key)}
          >
            <Icon name={item.icon} size={24} />
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ============ DateHeader 组件 ============

interface DateHeaderProps {
  date: string;
  onPrevDay?: () => void;
  onNextDay?: () => void;
  onToday?: () => void;
}

export function DateHeader({ date, onPrevDay, onNextDay, onToday }: DateHeaderProps) {
  const d = new Date(date);
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][d.getDay()];
  const formatted = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;

  return (
    <div className="flex items-center justify-between py-3">
      <button 
        onClick={onPrevDay}
        className="text-gray-400 p-2 hover:text-gray-600"
      >
        <Icon name="back" size={20} />
      </button>
      
      <div className="text-center">
        <div className="font-medium text-gray-800">{formatted}</div>
        <div className="text-sm text-gray-500">{weekday}</div>
      </div>
      
      <button 
        onClick={onNextDay}
        className="text-gray-400 p-2 hover:text-gray-600"
      >
        <Icon name="forward" size={20} />
      </button>
    </div>
  );
}