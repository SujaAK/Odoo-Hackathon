import { ReactNode } from 'react';

interface KPICardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: 'brand' | 'success' | 'danger' | 'info' | 'warning';
}

const colorMap = {
  brand: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', iconBg: 'rgba(245, 158, 11, 0.15)' },
  success: { bg: 'rgba(34, 197, 94, 0.06)', border: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', iconBg: 'rgba(34, 197, 94, 0.12)' },
  danger: { bg: 'rgba(239, 68, 68, 0.06)', border: 'rgba(239, 68, 68, 0.15)', text: '#f87171', iconBg: 'rgba(239, 68, 68, 0.12)' },
  info: { bg: 'rgba(59, 130, 246, 0.06)', border: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', iconBg: 'rgba(59, 130, 246, 0.12)' },
  warning: { bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', iconBg: 'rgba(245, 158, 11, 0.12)' },
};

export default function KPICard({ icon, label, value, subtitle, color = 'brand' }: KPICardProps) {
  const c = colorMap[color];

  return (
    <div
      className="animate-fade-in"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        transition: 'all 0.2s ease',
        cursor: 'default',
      }}
    >
      <div
        style={{
          background: c.iconBg,
          borderRadius: '10px',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: c.text,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px', fontWeight: 500 }}>
          {label}
        </p>
        <p style={{ fontSize: '1.75rem', fontWeight: 700, color: c.text, lineHeight: 1 }}>
          {value}
        </p>
        {subtitle && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
