import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { desktop, isDesktop } from '@/lib/desktop';
import { useAppStore } from '@/state/useAppStore';
import { FileText } from 'lucide-react';

interface FolderBrowserProps {
  folder: string;
  onClose: () => void;
}

interface FileRow {
  name: string;
  path: string;
  modifiedAt: number;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function FolderBrowser({ folder, onClose }: FolderBrowserProps) {
  const [files, setFiles] = useState<FileRow[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isDesktop()) {
      setError('The folder browser needs the desktop app.');
      return;
    }
    let cancelled = false;
    desktop()
      .listDir(folder)
      .then((rows) => {
        if (!cancelled) setFiles(rows);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't read that folder — it may not exist yet.");
      });
    return () => {
      cancelled = true;
    };
  }, [folder]);

  return (
    <Modal title="Browse Folder" onClose={onClose} wide>
      <p className="modal__hint modal__hint--muted">
        <code>{folder}</code>
      </p>
      {error && <p className="form-error">{error}</p>}
      {!error && files === null && <p className="empty-row">Loading…</p>}
      {!error && files && files.length === 0 && <p className="empty-row">This folder is empty.</p>}
      {!error && files && files.length > 0 && (
        <ul className="folder-browser__list">
          {files.map((f) => (
            <li key={f.path}>
              <button
                className="folder-browser__item"
                onClick={() => {
                  desktop().openPath(f.path);
                  useAppStore.getState().pushRecentFile(f.name, f.path);
                }}
              >
                <FileText size={15} />
                <span className="folder-browser__name">{f.name}</span>
                <span className="folder-browser__date">{formatDate(f.modifiedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
