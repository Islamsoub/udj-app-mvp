import type { ReactNode } from 'react';
import { Card } from './card';
import { SectionLabel } from './section-label';
import { Badge } from '@/components/ui/badge';
import { TONE_COLORS, type Tone } from '@/lib/tokens';

/**
 * StatCard (impl spec §11): 38px tinted icon tile + optional trend badge,
 * SectionLabel, big value (30/800) + unit, sub caption.
 */
export interface StatCardProps {
  icon: ReactNode;
  tone?: Tone;
  label: string;
  value: string | number;
  unit?: string;
  sub?: ReactNode;
  trend?: { label: string; tone?: Tone };
  onClick?: () => void;
}

export function StatCard({ icon, tone = 'jade', label, value, unit, sub, trend, onClick }: StatCardProps) {
  const [fg, bg] = TONE_COLORS[tone];
  return (
    <Card hover={!!onClick} onClick={onClick} pad={18}>
      <div className="mb-3 flex items-start justify-between">
        <span
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px]"
          style={{ background: bg, color: fg }}
        >
          {icon}
        </span>
        {trend && (
          <Badge tone={trend.tone ?? 'jade'} dot>
            {trend.label}
          </Badge>
        )}
      </div>
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-[30px] font-extrabold leading-none tracking-[-0.02em] text-ink">{value}</span>
        {unit && <span className="text-[14px] font-semibold text-ink3">{unit}</span>}
      </div>
      {sub && <div className="mt-[6px] text-[12.5px] text-ink2">{sub}</div>}
    </Card>
  );
}
