import { useAppStore } from '@/state/useAppStore';
import { desktop, isDesktop } from '@/lib/desktop';
import { Clock } from 'lucide-react';

function timeAgo(ts: number): string {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function RecentFiles() {
  const recentFileIds = useAppStore((s) => s.data.recentFileIds);
  const recentFiles = useAppStore((s) => s.data.recentFiles);

  if (recentFileIds.length === 0) return null;

  return (
    <div className="recent-files">
      <div className="recent-files__title">
        <Clock size={14} />
        Recent Files
      </div>
      <ul className="recent-files__list">
        {recentFileIds.map((id) => {
          const file = recentFiles[id];
          if (!file) return null;
          return (
            <li key={id}>
              <button
                className="recent-files__item"
                onClick={() => isDesktop() && desktop().openPath(file.path)}
                title={file.path}
              >
                <span className="recent-files__label">{file.label}</span>
                <span className="recent-files__time">{timeAgo(file.openedAt)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
