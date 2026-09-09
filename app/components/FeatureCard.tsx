"use client";

import { ReactNode } from "react";

interface FeatureCardProps {
  number?: number;
  title?: string;
  subtitle?: string;
  header?: ReactNode;
  body?: ReactNode;
  icon?: ReactNode;
  badge?: { label: string; color: string };
  divided?: boolean;
  actions?: ReactNode;
  footer?: ReactNode;
  width?: string | number;
  bodyClassName?: string;
  className?: string;
  children?: ReactNode;
}

const badgeColors: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
};

export default function FeatureCard({
  number,
  title,
  subtitle,
  header,
  body,
  icon,
  badge,
  divided,
  actions,
  footer,
  width,
  bodyClassName = "",
  className = "",
  children,
}: FeatureCardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`} style={width ? { width } : undefined}>
      {header ? (
        <div className="border-b border-slate-100 px-5 max-sm:px-4 py-4">{header}</div>
      ) : (title || number !== undefined || icon || badge || actions) ? (
        <div className={`flex items-start justify-between gap-3 px-5 max-sm:px-4 pt-5 max-sm:pt-4 pb-3 max-sm:pb-2 ${divided ? "border-b border-slate-100" : ""}`}>
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {icon && (
              <span className="text-lg shrink-0 mt-0.5">{icon}</span>
            )}
            <div className="min-w-0">
              {title && (
                <div className="flex items-center gap-2 flex-wrap">
                  {number !== undefined && (
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {number}
                    </span>
                  )}
                  <h3 className="text-base font-semibold text-slate-800 truncate">
                    {title}
                  </h3>
                  {badge && (
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${badgeColors[badge.color] || badgeColors.blue}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
              )}
              {subtitle && (
                <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="shrink-0">{actions}</div>
          )}
        </div>
      ) : null}
      {body ? (
        <div className={`px-5 max-sm:px-4 py-4 max-sm:py-3 ${bodyClassName}`}>{body}</div>
      ) : children ? (
        <div className={`px-5 max-sm:px-4 py-4 max-sm:py-3 ${bodyClassName}`}>{children}</div>
      ) : null}
      {footer && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 max-sm:px-4 py-3 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}
