import { useEffect, useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { AddDriveDialog } from './AddDriveDialog';
import { desktop, isDesktop } from '@/lib/desktop';
import { Plus, Trash2, Check, X } from 'lucide-react';

function isNetworkAddress(path: string): boolean {
  return /^[a-z]+:\/\//i.test(path);
}

export function Drives() {
  const driveIds = useAppStore((s) => s.data.driveIds);
  const drives = useAppStore((s) => s.data.drives);
  const removeDrive = useAppStore((s) => s.removeDrive);

  const [adding, setAdding] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [status, setStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isDesktop()) return;
    let cancelled = false;
    async function check() {
      const bridge = desktop();
      const entries = await Promise.all(
        driveIds.map(async (id) => {
          const drive = drives[id];
          if (!drive || isNetworkAddress(drive.path)) return [id, false] as const;
          return [id, await bridge.pathExists(drive.path)] as const;
        }),
      );
      if (!cancelled) setStatus(Object.fromEntries(entries));
    }
    check();
    const interval = setInterval(check, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [driveIds, drives]);

  async function open(path: string) {
    if (!isDesktop()) return;
    const bridge = desktop();
    if (isNetworkAddress(path)) {
      await bridge.openExternal(path);
    } else {
      await bridge.openPath(path);
    }
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h1>Drives</h1>
          <p className="panel__subtitle">Jump to a mounted volume, or connect to a network share.</p>
        </div>
        <div className="panel__actions">
          <button className="btn" onClick={() => setManageMode((m) => !m)}>
            {manageMode ? 'Done' : 'Manage'}
          </button>
          <button className="btn btn--accent" onClick={() => setAdding(true)}>
            <Plus size={16} />
            Add Drive
          </button>
        </div>
      </header>

      <div className="card-grid">
        {driveIds.map((id) => {
          const drive = drives[id];
          if (!drive) return null;
          const network = isNetworkAddress(drive.path);
          const connected = network ? null : status[id] ?? false;
          return (
            <div key={id} className="launch-card">
              <button
                className="launch-card__body"
                onClick={() => (manageMode ? undefined : open(drive.path))}
                disabled={manageMode}
              >
                <span className="launch-card__icon">{drive.icon}</span>
                <span className="launch-card__label">{drive.label}</span>
                <span className={`drive-status${connected === false ? ' drive-status--off' : ''}`}>
                  {network ? (
                    'network share'
                  ) : connected ? (
                    <>
                      <Check size={12} /> connected
                    </>
                  ) : (
                    <>
                      <X size={12} /> not mounted
                    </>
                  )}
                </span>
              </button>
              {manageMode && (
                <button className="launch-card__remove" onClick={() => removeDrive(id)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
        {driveIds.length === 0 && <p className="empty-row">No drives added yet.</p>}
      </div>

      {adding && <AddDriveDialog onClose={() => setAdding(false)} />}
    </section>
  );
}
