import React, { ReactNode, CSSProperties } from 'react';

// Define the component props
interface CardProps {
  header?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode; // Allows nesting elements or other cards directly inside
  
  // Dynamic sizing and positioning props
  width?: string | number;
  height?: string | number;
  top?: string | number;
  bottom?: string | number;
  left?: string | number;
  right?: string | number;
  position?: 'relative' | 'absolute' | 'fixed' | 'sticky';
  
  // Optional extra tailwind classes for further customization
  className?: string;
}

export default function Card({
  header,
  body,
  footer,
  children,
  width,
  height,
  top,
  bottom,
  left,
  right,
  position,
  className = '',
}: CardProps) {
  
  // Construct dynamic inline styles
  const dynamicStyles: CSSProperties = {
    width: width ?? '100%', // defaults to full width if not provided
    height: height ?? 'auto',
    position: position,
    top: top,
    bottom: bottom,
    left: left,
    right: right,
  };

  return (
    <div 
      style={dynamicStyles} 
      className={`flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm text-slate-800 ${className}`}
    >
      {/* Header Slot */}
      {header && (
        <div className="border-b border-slate-200 px-4 py-3 font-semibold">
          {header}
        </div>
      )}

      {/* Main Body Slot */}
      {body && (
        <div className="flex-1 p-4">
          {body}
        </div>
      )}

      {/* Children Slot (Crucial for direct nesting like <Card><input /></Card>) */}
      {children && (
        <div className="flex-1 p-4 pt-0 first:pt-4">
          {children}
        </div>
      )}

      {/* Footer Slot */}
      {footer && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}