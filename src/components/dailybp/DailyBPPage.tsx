import { useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { todayKey } from '@/lib/dates';
import { Plus, Trash2 } from 'lucide-react';
import type { DailyBPTarget } from '@/state/schema';

const PRESET_PEOPLE = ['Mate', 'Jimmy', 'Justin', 'Lara', 'Ava'];
const OTHER = '__other__';

type Stat = 'shots' | 'packages';

interface QuotaRowProps {
  stat: Stat;
  label: string;
  achieved: number;
  quota: number;
}

function QuotaRow({ stat, label, achieved, quota }: QuotaRowProps) {
  const setDailyBPAchieved = useAppStore((s) => s.setDailyBPAchieved);
  const setDailyBPQuota = useAppStore((s) => s.setDailyBPQuota);
  const pct = quota > 0 ? Math.min(100, Math.round((achieved / quota) * 100)) : 0;
  const date = todayKey();

  return (
    <div className="bp-quota-row">
      <div className="bp-quota-row__top">
        <span className="bp-quota-row__label">{label}</span>
        <label className="bp-section__quota">
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
        <span className="bp-card__of">/ {quota} today</span>
      </div>
      <div className="bp-card__bar">
        <div className="bp-card__bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TargetsChecklist({ targets }: { targets: DailyBPTarget[] }) {
  const addDailyBPTarget = useAppStore((s) => s.addDailyBPTarget);
  const toggleDailyBPTarget = useAppStore((s) => s.toggleDailyBPTarget);
  const removeDailyBPTarget = useAppStore((s) => s.removeDailyBPTarget);

  const [description, setDescription] = useState('');
  const [person, setPerson] = useState('');
  const [customName, setCustomName] = useState('');

  const date = todayKey();
  const resolvedName = person === OTHER ? customName.trim() : person;
  const canAdd = description.trim() !== '' && resolvedName !== '';

  function addTarget() {
    if (!canAdd) return;
    addDailyBPTarget(date, description.trim(), resolvedName);
    setDescription('');
    setPerson('');
    setCustomName('');
  }

  return (
    <section className="bp-section">
      <h2>Targets</h2>
      <p className="modal__hint modal__hint--muted">
        The goals for today, each one assigned to whoever's doing it — check them off as they get
        done.
      </p>

      <ul className="bp-checklist">
        {targets.map((t) => (
          <li key={t.id} className={`bp-checklist__row${t.done ? ' bp-checklist__row--done' : ''}`}>
            <input type="checkbox" checked={t.done} onChange={() => toggleDailyBPTarget(date, t.id)} />
            <span className="bp-checklist__desc">{t.description}</span>
            <span className="bp-checklist__person">{t.person}</span>
            <button className="btn btn--icon" onClick={() => removeDailyBPTarget(date, t.id)}>
              <Trash2 size={14} />
            </button>
          </li>
        ))}
        {targets.length === 0 && <li className="empty-row">No targets set for today yet.</li>}
      </ul>

      <div className="bp-add-row">
        <input
          className="field"
          placeholder="What needs to get done…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select className="field" value={person} onChange={(e) => setPerson(e.target.value)}>
          <option value="" disabled>
            Assign to…
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
        <button className="btn btn--accent" onClick={addTarget} disabled={!canAdd}>
          <Plus size={16} />
          Add Target
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
          <p className="panel__subtitle">Today's battle plan — set the day's quotas, then hand out targets.</p>
        </div>
      </header>

      <section className="bp-section">
        <h2>Today's Quotas</h2>
        <p className="modal__hint modal__hint--muted">
          Just the day's overall numbers — not tied to anyone. Assign the work itself to people in
          Targets, below.
        </p>
        <div className="bp-quota-grid">
          <QuotaRow stat="shots" label="Shots in the Can" achieved={day?.shotsAchieved ?? 0} quota={settings.shotsQuota} />
          <QuotaRow
            stat="packages"
            label="Photo Packages"
            achieved={day?.packagesAchieved ?? 0}
            quota={settings.packagesQuota}
          />
        </div>
      </section>

      <TargetsChecklist targets={day?.targets ?? []} />
    </section>
  );
}
