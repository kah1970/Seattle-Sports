"use client";

const icons: Record<string, JSX.Element> = {
  newspaper: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="14" height="12" rx="1.5" />
      <path d="M4 5h8M4 8h5M4 11h3" />
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" />
      <path d="M1.5 6.5h13M5 1v3M11 1v3" />
    </svg>
  ),
  chart: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13V8M8 13V4M12 13V7" />
    </svg>
  ),
  trophy: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2h6v5a3 3 0 01-6 0V2zM5 4H3a1 1 0 00-1 1v1a2 2 0 002 2h1M11 4h2a1 1 0 011 1v1a2 2 0 01-2 2h-1M6 13h4M8 10v3" />
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1.5 14c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
      <circle cx="11.5" cy="5.5" r="1.8" />
      <path d="M11.5 9.5c1.8 0 3.3 1.5 3.3 3.3" />
    </svg>
  ),
  target: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="3" />
      <circle cx="8" cy="8" r="0.5" fill="currentColor" />
    </svg>
  ),
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof icons;
  accentColor?: string;
  count?: number;
}

export function SectionHeader({ title, subtitle, icon, accentColor, count }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {icon && icons[icon] && (
        <span style={{ color: accentColor ?? "var(--muted)" }}>{icons[icon]}</span>
      )}
      <h2 className="eyebrow">{title}</h2>
      {count !== undefined && (
        <span className="rounded-full bg-white/5 px-1.5 py-px text-[10px] font-medium tabular-nums text-gray-400">
          {count}
        </span>
      )}
      <div className="ml-2 h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      {subtitle && <span className="text-xs font-normal text-gray-500">{subtitle}</span>}
    </div>
  );
}
