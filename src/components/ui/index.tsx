/**
 * 基础 UI 组件
 * 
 * 设计原则：
 * - 简洁易用
 * - 小程序迁移友好（避免复杂 DOM 操作）
 * - 通过 props 控制，状态驱动渲染
 */

import type { ReactNode, ButtonHTMLAttributes } from 'react';

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
  const baseClass = 'inline-flex items-center justify-center font-medium transition-colors active:scale-95 rounded-lg';
  
  const variantClasses = {
    primary: 'bg-primary-400 text-white hover:bg-primary-500 disabled:bg-primary-200',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100',
    success: 'bg-green-500 text-white hover:bg-green-600 disabled:bg-green-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 disabled:bg-red-200',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="animate-spin mr-2">⏳</span>}
      {icon && <span className="mr-2">{icon}</span>}
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
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${paddingClasses[padding]} ${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ============ Progress 组件 ============

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
    primary: 'from-primary-400 to-primary-300',
    success: 'from-green-500 to-green-400',
    blue: 'from-blue-500 to-blue-400',
  };
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-center text-sm text-gray-500 mt-1">
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
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-green-100 text-green-600',
    danger: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClasses[color]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
}

// ============ PointsBadge 组件 ============

interface PointsBadgeProps {
  points: number;
  locked?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PointsBadge({ points, locked = 0, size = 'md' }: PointsBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-1.5 text-base',
    lg: 'px-4 py-2 text-lg',
  };

  return (
    <div className={`inline-flex items-center gap-1 rounded-full bg-primary-100 ${sizeClasses[size]}`}>
      <span className="text-primary-600 font-bold">⭐ {points}</span>
      {locked > 0 && (
        <span className="text-gray-500 text-xs">({locked}锁定)</span>
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
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <h3 className="text-gray-600 font-medium">{title}</h3>
      {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* 内容区 */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-auto">
        {title && (
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-medium text-lg">{title}</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="p-4">
          {children}
        </div>
        
        {footer && (
          <div className="px-4 py-3 border-t border-gray-100 flex justify-end gap-2">
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
    <div className="flex border-b border-gray-200">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeKey === tab.key
              ? 'text-primary-600 border-b-2 border-primary-400'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
          {tab.badge && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ============ PointsSlider 组件（积分范围选择 -50 到 50）============

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
  label = '积分'
}: PointsSliderProps) {
  // 快速选择按钮的常用值
  const quickValues = [-50, -20, -10, -5, 0, 5, 10, 20, 50];
  
  // 根据值显示颜色
  const getValueColor = (val: number) => {
    if (val > 0) return 'text-green-600 bg-green-100';
    if (val < 0) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  }; 

  return (
    <div className="space-y-3">
      {label && <label className="text-gray-500 text-sm">{label}</label>}
      
      {/* 快速选择按钮 */}
      {showQuickSelect && (
        <div className="flex flex-wrap gap-2">
          {quickValues.map(v => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                value === v
                  ? getValueColor(v) + ' ring-2 ring-offset-1'
                  : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {v > 0 ? `+${v}` : v}
            </button>
          ))}
        </div>
      )}
      
      {/* 滑块 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-red-500 w-8">-{Math.abs(min)}</span>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-parent-500"
        />
        <span className="text-sm text-green-500 w-8">+{max}</span>
      </div>
      
      {/* 当前值显示 */}
      <div className="text-center">
        <span className={`px-4 py-2 rounded-lg font-bold text-lg ${getValueColor(value)}`}
        >
          {value > 0 ? `+${value}` : value} 分
        </span>
      </div>
    </div>
  );
}

// ============ Icon 组件（小程序迁移友好）============

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

// 使用 emoji 作为图标，小程序无需处理 SVG
export function Icon({ name, size = 24, className = '' }: IconProps) {
  const icons: Record<string, string> = {
    check: '✅',
    clock: '⏰',
    star: '⭐',
    sun: '☀️',
    moon: '🌙',
    book: '📚',
    pencil: '📝',
    music: '🎵',
    game: '🎮',
    gift: '🎁',
    home: '🏠',
    settings: '⚙️',
    add: '+',
    delete: '🗑️',
    edit: '✏️',
    back: '←',
    forward: '→',
    up: '↑',
    down: '↓',
    menu: '☰',
    close: '✕',
    warning: '⚠️',
    info: '💡',
    heart: '❤️',
    trophy: '🏆',
    calendar: '📅',
    chart: '📊',
    user: '👤',
    team: '👥',
    refresh: '🔄',
    lock: '🔒',
    unlock: '🔓',
  };

  return (
    <span 
      className={`inline-block ${className}`} 
      style={{ fontSize: size }}
    >
      {icons[name] || name}
    </span>
  );
}export { TimePicker } from "./TimePicker";
