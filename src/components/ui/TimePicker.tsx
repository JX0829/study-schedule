/**
 * iOS Picker 风格的时间选择器（支持起始时间和结束时间）
 */

import { useState, useRef, useEffect } from 'react';

interface TimePickerProps {
  startTime: string; // HH:mm 格式
  endTime: string; // HH:mm 格式
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

// 生成小时列表 (00-23)
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

// 生成分钟列表 (00, 05, 10, 15, ... 55)
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

// 单列时间选择器
function TimeColumn({ 
  value, 
  onChange, 
  items 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  items: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (ref.current) {
      const index = items.indexOf(value);
      const element = ref.current.children[index + 1] as HTMLElement; // +1 因为有顶部空白
      if (element) {
        element.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [value, items]);
  
  return (
    <div className="flex-1 relative h-[120px] overflow-y-auto snap-y snap-mandatory scrollbar-hide">
      <div ref={ref} className="flex flex-col">
        {/* 顶部空白 */}
        <div className="h-[40px] snap-start" />
        
        {items.map(item => (
          <button
            key={item}
            onClick={() => onChange(item)}
            className={`h-[40px] flex items-center justify-center text-lg font-mono snap-center transition-colors ${
              item === value ? 'text-blue-500 font-bold' : 'text-gray-400'
            }`}
          >
            {item}
          </button>
        ))}
        
        {/* 底部空白 */}
        <div className="h-[40px] snap-start" />
      </div>
    </div>
  );
}

export function TimePicker({ startTime, endTime, onStartTimeChange, onEndTimeChange }: TimePickerProps) {
  const [startHour, startMinute] = startTime.split(':');
  const [endHour, endMinute] = endTime.split(':');
  
  return (
    <div className="w-full space-y-4">
      {/* 起始时间 */}
      <div>
        <label className="text-gray-600 text-sm block mb-2 font-medium">起始时间</label>
        <div className="flex gap-2 bg-gray-100 rounded-lg p-2 relative">
          {/* 高亮选中项的遮罩 */}
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-[40px] bg-white rounded-lg pointer-events-none border border-gray-200" />
          
          <TimeColumn 
            value={startHour} 
            onChange={(h) => onStartTimeChange(`${h}:${startMinute}`)} 
            items={HOURS} 
          />
          
          {/* 分隔符 */}
          <div className="flex items-center justify-center text-2xl font-mono text-gray-400">
            :
          </div>
          
          <TimeColumn 
            value={startMinute} 
            onChange={(m) => onStartTimeChange(`${startHour}:${m}`)} 
            items={MINUTES} 
          />
        </div>
        <div className="mt-1 text-center text-gray-500 text-sm font-mono">
          {startHour}:{startMinute}
        </div>
      </div>
      
      {/* 结束时间 */}
      <div>
        <label className="text-gray-600 text-sm block mb-2 font-medium">结束时间</label>
        <div className="flex gap-2 bg-gray-100 rounded-lg p-2 relative">
          {/* 高亮选中项的遮罩 */}
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-[40px] bg-white rounded-lg pointer-events-none border border-gray-200" />
          
          <TimeColumn 
            value={endHour} 
            onChange={(h) => onEndTimeChange(`${h}:${endMinute}`)} 
            items={HOURS} 
          />
          
          {/* 分隔符 */}
          <div className="flex items-center justify-center text-2xl font-mono text-gray-400">
            :
          </div>
          
          <TimeColumn 
            value={endMinute} 
            onChange={(m) => onEndTimeChange(`${endHour}:${m}`)} 
            items={MINUTES} 
          />
        </div>
        <div className="mt-1 text-center text-gray-500 text-sm font-mono">
          {endHour}:{endMinute}
        </div>
      </div>
      
      {/* 时间段总时长 */}
      <div className="bg-blue-50 rounded-lg p-3 text-center">
        <span className="text-blue-600 font-medium">
          任务时长：{startHour}:{startMinute} → {endHour}:{endMinute}
        </span>
      </div>
    </div>
  );
}