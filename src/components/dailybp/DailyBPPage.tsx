import { useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { todayKey } from '@/lib/dates';
import { Plus, Trash2 } from 'lucide-react';
import type { DailyBPTarget } from '@/state/schema';

const PRESET_PEOPLE = ['Mate', 'Jimmy', 'Justin', 'Lara', 'Ava'];
const OTHER = '__other__';

type Stat = 'shots' | 'packages';

interface StatSectionProps {
  stat: Stat;
  label: string;
  achieved: number;
  quota: number;
  targets: DailyBPTarget[];
}

function StatSection({ stat, label, achieved, quota, targets }: StatSectionProps) {
  const setDailyBPAchieved = useAppStore((s) => s.setDailyBPAchieved);
  const setDailyBPQuota = useAppStore((s) => s.setDailyBPQuota);
  const addDailyBPTarget = useAppStore((s) => s.addDailyBPTarget);
  const removeDailyBPTarget = useAppStore((s) => s.removeDailyBPTarget);

  const [person, setPerson] = useState('');
  const [customName, setCustomName] = useState('');
  const [targetInput, setTargetInput] = useState('');

  const pct = quota > 0 ? Math.min(100, Math.round((achieved / quota) * 100)) : 0;
  const date = todayKey();

  const resolvedName = person === OTHER ? customName.trim() : person;
  const targetValue = Number(targetInput);
  const canAdd = resolvedName !== '' && Number.isFinite(targetValue) && targetValue > 0;

  function addTarget() {
    if (!canAdd) return;
    addDailyBPTarget(date, stat, resolvedName, targetValue);
    setPerson('');
    setCustomName('');
    setTargetInput('');
  }

  return (
    <section className="bp-section">
      <div className="bp-section__header">
        <h2>{label}</h2>
        <label className="bp-section__quota">
          Daily quota
          <input
            type="number"
            min={0}
            className="bp-card__quota-input"
            value={quota || ''}
            onChange={(e) => setDailyBPQuota(stat, Number(e.target.value) || 0)}
          />
        </label>
      </div>
      <p className="modal__hint modal__hint--muted">
        The quota is just today's overall goal — it isn't tied to anyone. Assign portions of it to
        people below, in Targets.
      </p>

      <div className="bp-card__progress-row">
        <input
          type="number"
          min={0}
          className="bp-card__achieved-input"
          value={achieved || ''}
          onChange={(e) => setDailyBPAchieved(date, stat, Number(e.target.value) || 0)}
        />
        <span className="bp-card__of">/ {quota} today</span>
      </div>
      <div className="bp-card__bar">
        <div className="bp-card__bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <h3 className="bp-section__subhead">Targets</h3>
      <table className="bp-table">
        <thead>
          <tr>
            <th>Person</th>
            <th>Target</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {targets.map((t) => (
            <tr key={t.id}>
              <td>{t.person || 'Unassigned'}</td>
              <td className="bp-table__num">{t.target}</td>
              <td>
                <button className="btn btn--icon" onClick={() => removeDailyBPTarget(date, stat, t.id)}>
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
          {targets.length === 0 && (
            <tr>
              <td colSpan={3} className="empty-row">
                No targets assigned yet today.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="bp-add-row">
        <select className="field" value={person} onChange={(e) => setPerson(e.target.value)}>
          <option value="" disabled>
            Choose person…
          </option>
          {PRESET_PEOPLE.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
          <option value={OTHER}>Other…</option>
        </select>
        {person === OTHER && (
          <input
            className="field"
            placeholder="Name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
        )}
        <input
          type="number"
          min={1}
          className="field"
          placeholder="Target"
          value={targetInput}
          onChange={(e) => setTargetInput(e.target.value)}
        />
        <button className="btn btn--accent" onClick={addTarget} disabled={!canAdd}>
          <Plus size={16} />
          Add Row
        </button>
      </div>
    </section>
  );
}

export function DailyBPPage() {
  const settings = useAppStore((s) => s.data.dailyBPSettings);
  const day = useAppStore((s) => s.data.dailyBPDays[todayKey()]);

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h1>Daily BP</h1>
          <p className="panel__subtitle">Today's production goals, tracked as the day goes.</p>
        </div>
      </header>

      <StatSection
        stat="shots"
        label="Shots in the Can"
        achieved={day?.shotsAchieved ?? 0}
        quota={settings.shotsQuota}
        targets={day?.shotsTargets ?? []}
      />
      <StatSection
        stat="packages"
        label="Photo Packages"
        achieved={day?.packagesAchieved ?? 0}
        quota={settings.packagesQuota}
        targets={day?.packagesTargets ?? []}
      />
    </section>
  );
}
