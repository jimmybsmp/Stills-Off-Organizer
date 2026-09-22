import { useAppStore } from '@/state/useAppStore';
import { todayKey } from '@/lib/dates';
import type { Section } from '@/components/nav/Sidebar';
import { ArrowRight } from 'lucide-react';

interface DailyBPSummaryProps {
  onNavigate: (s: Section) => void;
}

function Row({ label, achieved, quota }: { label: string; achieved: number; quota: number }) {
  const pct = quota > 0 ? Math.min(100, Math.round((achieved / quota) * 100)) : 0;
  return (
    <div className="bp-summary__row">
      <div className="bp-summary__row-top">
        <span>{label}</span>
        <span className="bp-summary__row-nums">
          {achieved} / {quota}
        </span>
      </div>
      <div className="bp-card__bar">
        <div className="bp-card__bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DailyBPSummary({ onNavigate }: DailyBPSummaryProps) {
  const settings = useAppStore((s) => s.data.dailyBPSettings);
  const day = useAppStore((s) => s.data.dailyBPDays[todayKey()]);

  return (
    <button className="bp-summary" onClick={() => onNavigate('dailybp')}>
      <div className="bp-summary__title">
        Daily BP
        <ArrowRight size={14} />
      </div>
      <Row label="Shots in the Can" achieved={day?.shotsAchieved ?? 0} quota={settings.shotsQuota} />
      <Row label="Photo Packages" achieved={day?.packagesAchieved ?? 0} quota={settings.packagesQuota} />
    </button>
  );
}
