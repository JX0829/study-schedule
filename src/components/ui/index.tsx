/**
 * 基础 UI 组件 - 科技宇宙 (Sci-Fi Cosmic) 风格
 */

import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { IconEnergyCrystal } from '@/components/icons/CosmicIcons';

// ============ Button 组件 ============

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClass = 'inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 active:scale-95 rounded-xl cursor-pointer disabled:cursor-not-allowed select-none';
  
  const variantClasses = {
    primary: 'cosmic-glow-btn disabled:opacity-40 disabled:transform-none disabled:shadow-none',
    secondary: 'bg-slate-800/80 hover:bg-slate-700/80 text-white border border-sky-500/30 hover:border-cyan-400 disabled:opacity-40',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-[0_0_18px_rgba(16,185,129,0.35)] disabled:opacity-40',
    danger: 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-[0_0_18px_rgba(244,63,94,0.35)] disabled:opacity-40',
    ghost: 'bg-transparent text-slate-300 hover:bg-slate-800/60 hover:text-cyan-300',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  return (
    <button
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="animate-spin mr-2">⏳</span>}
      {icon && <span className="mr-2 flex items-center">{icon}</span>}
      {children}
    </button>
  );
}

// ============ Card 组件 ============

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function Card({ children, className = '', padding = 'md', onClick }: CardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-7',
  };

  return (
    <div
      className={`cosmic-glass text-white ${paddingClasses[padding]} ${className} ${
        onClick ? 'cursor-pointer hover:border-cyan-400/60 hover:shadow-[0_12px_40px_rgba(0,240,255,0.15)]' : ''
      }`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ============ Progress 组件 (火箭推进充能槽) ============

interface ProgressProps {
  value: number; // 0-100
  max?: number;
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'blue';
  size?: 'sm' | 'md' | 'lg';
}

export function Progress({ value, max = 100, showLabel = false, color = 'primary', size = 'md' }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const colorClasses = {
    primary: 'from-cyan-400 via-sky-400 to-indigo-500 shadow-[0_0_12px_#00F0FF]',
    success: 'from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_12px_#10B981]',
    blue: 'from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_12px_#6366F1]',
  };
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs font-orbitron text-slate-300 mb-1.5">
          <span className="text-cyan-400">{value}</span>
          <span className="text-slate-400">{max}</span>
        </div>
      )}
      <div className={`w-full bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-sky-500/25 ${sizeClasses[size]}`}>
        <div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all duration-700 relative`}
          style={{ width: `${percentage}%` }}
        >
          {percentage > 10 && (
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/80 rounded-full blur-[1px] animate-pulse"></div>
          )}
        </div>
      </div>
      {showLabel && (
        <div className="text-right text-xs font-orbitron text-cyan-300 mt-1 font-bold">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}

// ============ Badge 组件 ============

interface BadgeProps {
  children: ReactNode;
  color?: 'primary' | 'success' | 'danger' | 'gray' | 'blue' | 'purple';
  size?: 'sm' | 'md';
}

export function Badge({ children, color = 'primary', size = 'sm' }: BadgeProps) {
  const colorClasses = {
    primary: 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.15)]',
    success: 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
    danger: 'bg-rose-950/70 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.15)]',
    gray: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
    blue: 'bg-sky-950/70 text-sky-300 border border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.15)]',
    purple: 'bg-purple-950/70 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-lg font-medium tracking-wide ${colorClasses[color]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
}

// ============ PointsBadge 组件 (星能晶石显示徽章) ============

interface PointsBadgeProps {
  points: number;
  locked?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PointsBadge({ points, locked = 0, size = 'md' }: PointsBadgeProps) {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-xl bg-slate-900/90 border border-amber-500/40 shadow-[0_0_15px_rgba(251,191,36,0.2)] ${sizeClasses[size]}`}>
      <IconEnergyCrystal size={size === 'lg' ? 22 : 18} />
      <span className="text-amber-300 font-orbitron font-bold tracking-wider">{points}</span>
      {locked > 0 && (
        <span className="text-slate-400 text-xs font-orbitron">({locked}锁)</span>
      )}
    </div>
  );
}

// ============ EmptyState 组件 ============

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center cosmic-glass-subtle my-4">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <h3 className="text-white font-semibold tracking-wide text-base">{title}</h3>
      {description && <p className="text-slate-300 text-xs mt-1.5 max-w-sm px-4">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ============ Modal 组件 ============

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#070B19]/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col text-white animate-in fade-in zoom-in-95 duration-200">
        {title && (
          <div className="px-5 py-4 border-b border-sky-500/20 flex items-center justify-between bg-slate-900/60">
            <h3 className="font-bold text-base text-white flex items-center gap-2 font-orbitron tracking-wide">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]"></span>
              {title}
            </h3>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="p-5 overflow-y-auto space-y-4">
          {children}
        </div>
        
        {footer && (
          <div className="px-5 py-3 border-t border-sky-500/20 bg-slate-900/80 flex justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Tabs 组件 ============

interface TabsProps {
  tabs: Array<{ key: string; label: string; badge?: number }>;
  activeKey: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, activeKey, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-sky-500/20 space-x-1.5">
      {tabs.map(tab => {
        const isActive = activeKey === tab.key;
        return (
          <button
            key={tab.key}
            className={`px-4 py-2.5 text-xs font-bold tracking-wider transition-all duration-200 whitespace-nowrap rounded-t-xl relative ${
              isActive
                ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-950/30 shadow-[inset_0_2px_8px_rgba(0,240,255,0.15)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/30'
            }`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
            {tab.badge && (
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] font-orbitron bg-rose-500 text-white rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============ PointsSlider 组件 ============

interface PointsSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  showQuickSelect?: boolean;
  label?: string;
}

export function PointsSlider({
  value,
  onChange,
  min = -50,
  max = 50,
  showQuickSelect = true,
  label = '星能配比'
}: PointsSliderProps) {
  const quickValues = [-50, -20, -10, -5, 0, 5, 10, 20, 50];
  
  const getValueColor = (val: number) => {
    if (val > 0) return 'text-emerald-300 bg-emerald-950/70 border border-emerald-500/40';
    if (val < 0) return 'text-rose-300 bg-rose-950/70 border border-rose-500/40';
    return 'text-slate-300 bg-slate-800 border border-slate-700';
  }; 

  return (
    <div className="space-y-3 cosmic-glass-subtle p-4 rounded-xl">
      {label && <label className="text-slate-300 text-xs font-bold tracking-wider uppercase">{label}</label>}
      
      {showQuickSelect && (
        <div className="flex flex-wrap gap-2">
          {quickValues.map(v => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`px-3 py-1.5 text-xs rounded-lg font-orbitron font-semibold transition-all ${
                value === v
                  ? getValueColor(v) + ' shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60'
              }`}
            >
              {v > 0 ? `+${v}` : v}
            </button>
          ))}
        </div>
      )}
      
      <div className="flex items-center gap-3 pt-2">
        <span className="text-xs font-orbitron text-rose-400 w-8">-{Math.abs(min)}</span>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <span className="text-xs font-orbitron text-emerald-400 w-8">+{max}</span>
      </div>
      
      <div className="text-center pt-1">
        <span className={`px-5 py-2 rounded-xl font-orbitron font-bold text-lg inline-block ${getValueColor(value)}`}>
          {value > 0 ? `+${value}` : value} 星能
        </span>
      </div>
    </div>
  );
}

// 兼容导出原通用图标辅助组件
export function Icon({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) {
  const symbolMap: Record<string, string> = {
    back: '←',
    forward: '→',
    check: '✓',
    close: '✕',
    edit: '✎',
    delete: '✕',
    star: '✦',
    clock: '⏱',
    settings: '⚙',
    user: '👤',
    team: '👥',
    lock: '🔒',
    unlock: '🔓',
    refresh: '↻',
    warning: '⚠',
    info: 'ⓘ',
  };
  return (
    <span className={`inline-flex items-center justify-center font-bold ${className}`} style={{ fontSize: size }}>
      {symbolMap[name] || '•'}
    </span>
  );
}

export { TimePicker } from "./TimePicker";
