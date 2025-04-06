import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface PopoverProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Popover: React.FC<PopoverProps> = ({ 
  children, 
  open: controlledOpen, 
  onOpenChange 
}) => {
  const [open, setOpen] = useState(controlledOpen || false);
  
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen);
    }
  }, [controlledOpen]);
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };
  
  return (
    <div className="relative inline-block">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            open,
            onOpenChange: handleOpenChange
          });
        }
        return child;
      })}
    </div>
  );
};

interface PopoverTriggerProps {
  children: ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const PopoverTrigger: React.FC<PopoverTriggerProps> = ({ 
  children, 
  className = '',
  open,
  onOpenChange
}) => {
  const handleClick = () => {
    onOpenChange?.(!open);
  };
  
  return (
    <div 
      onClick={handleClick}
      className={className}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </div>
  );
};

interface PopoverContentProps {
  children: ReactNode;
  className?: string;
  open?: boolean;
}

export const PopoverContent: React.FC<PopoverContentProps> = ({ 
  children, 
  className = '',
  open 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        // Click outside detected, handle it if needed
      }
    };
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);
  
  if (!open) return null;
  
  return (
    <div 
      ref={contentRef}
      className={`absolute z-50 ${className}`}
      style={{ minWidth: '10rem' }}
    >
      {children}
    </div>
  );
}; 