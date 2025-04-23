import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface DataCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function DataCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  className = ""
}: DataCardProps) {
  return (
    <div className={`flex items-center justify-between px-3 xs:px-4 py-2 rounded-lg bg-white border border-orange-100 ${className}`}>
      <div className="flex items-center gap-1.5 xs:gap-2">
        <Icon size={16} className="text-orange-600 xs:hidden" />
        <Icon size={18} className="text-orange-600 hidden xs:block" />
        <span className="text-orange-700 font-light text-xs xs:text-sm">{label}</span>
      </div>
      
      <div className="flex items-center gap-2">
        {trend && (
          <span className={`text-xs ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
        )}
        <span className="font-medium text-orange-700 text-xs xs:text-sm">{value}</span>
      </div>
    </div>
  );
} 