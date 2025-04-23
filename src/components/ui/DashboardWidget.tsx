import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardWidgetProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  colSpan?: number;
}

export function DashboardWidget({ 
  title, 
  icon: Icon, 
  children, 
  colSpan = 1 
}: DashboardWidgetProps) {
  const colSpanClass = colSpan > 1 
    ? `col-span-1 md:col-span-${Math.min(colSpan, 3)}` 
    : 'col-span-1';
    
  return (
    <div className={`bg-white backdrop-blur-sm rounded-xl p-4 xs:p-5 sm:p-6 border border-orange-100 shadow-sm ${colSpanClass}`}>
      <h2 className="text-lg xs:text-xl font-extralight text-orange-700 mb-3 xs:mb-4 flex items-center gap-2">
        <Icon size={18} className="text-orange-600 xs:hidden" />
        <Icon size={20} className="text-orange-600 hidden xs:block" />
        {title}
      </h2>
      
      <div className="space-y-3 xs:space-y-4">
        {children}
      </div>
    </div>
  );
} 