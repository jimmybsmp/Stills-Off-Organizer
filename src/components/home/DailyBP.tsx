import { useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { todayKey } from '@/lib/dates';
import { X, Plus } from 'lucide-react';
import type { DailyBPTarget } from '@/state/schema';

const PRESET_PEOPLE = ['Mate', 'Jimmy', 'Justin', 'Lara', 'Ava'];
const OTHER = '__other__';

type Stat = 'shots' | 'packages';

interface StatCardProps {
  stat: Stat;
  label: string;
  achieved: number;
  quota: number;
  targets: DailyBPTarget[];
}

function StatCard({ stat, label, achieved, quota, targets }: StatCardProps) {
  const setDailyBPAchieved = useAppStore((s) => s.setDailyBPAchieved);
  const setDailyBPQuota = useAppStore((s) => s.setDailyBPQuota);
  const addDailyBPTarget = useAppStore((s) => s.addDailyBPTarget);
  const removeDailyBPTarget = useAppStore((s) => s.removeDailyBPTarget);

  const [person, setPerson] = useState('');
  const [customName, setCustomName] = useState('');
  const [targetInput, setTargetInput] = useState('');

  const pct = quota > 0 ? Math.min(100, Math.round((achieved / quota) * 100)) : 0;
  const date = todayKey();

  function addTarget() {
    const value = Number(targetInput);
    if (!Number.isFinite(value) || value <= 0) return;
    const name = person === OTHER ? customName.trim() : person;
    addDailyBPTarget(date, stat, name, value);
    setPerson('');
    setCustomName('');
    setTargetInput('');
  }

  return (
    <div className="bp-card">
      <div className="bp-card__header">
        <span className="bp-card__label">{label}</span>
        <label className="bp-card__quota">
          Quota
          <input
            type="number"
            min={0}
            className="bp-card__quota-input"
            value={quota || ''}
            onChange={(e) => setDailyBPQuota(stat, Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <div className="bp-card__progress-row">
        <input
          type="number"
          min={0}
          className="bp-card__achieved-input"
          value={achieved || ''}
          onChange={(e) => setDailyBPAchieved(date, stat, Number(e.target.value) || 0)}
        />
        <span className="bp-card__of">/ {quota}</span>
      </div>
      <div className="bp-card__bar">
        <div className="bp-card__bar-fill" style={{ width: `${pct}%` }} />
      </div>

      {targets.length > 0 && (
        <ul className="bp-card__targets">
          {targets.map((t) => (
            <li key={t.id}>
              <span>{t.person || 'Unassigned'}</span>
              <span className="bp-card__target-num">{t.target}</span>
              <button className="bp-card__target-remove" onClick={() => removeDailyBPTarget(date, stat, t.id)}>
                <X size={11} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="bp-card__add-target">
        <select className="field field--inline" value={person} onChange={(e) => setPerson(e.target.value)}>
          <option value="">Unassigned</option>
          {PRESET_PEOPLE.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
          <option value={OTHER}>Other…</option>
        </select>
        {person === OTHER && (
          <input
            className="field field--inline"
            placeholder="Name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
        )}
        <input
          type="number"
          min={1}
          className="bp-card__target-input"
          placeholder="Target"
          value={targetInput}
          onChange={(e) => setTargetInput(e.target.value)}
        />
        <button className="btn btn--icon" onClick={addTarget} title="Add target">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export function DailyBP() {
  const settings = useAppStore((s) => s.data.dailyBPSettings);
  const day = useAppStore((s) => s.data.dailyBPDays[todayKey()]);

  return (
    <div className="bp-row">
      <StatCard
        stat="shots"
        label="Shots in the Can"
        achieved={day?.shotsAchieved ?? 0}
        quota={settings.shotsQuota}
        targets={day?.shotsTargets ?? []}
      />
      <StatCard
        stat="packages"
        label="Photo Packages"
        achieved={day?.packagesAchieved ?? 0}
        quota={settings.packagesQuota}
        targets={day?.packagesTargets ?? []}
      />
    </div>
  );
}
