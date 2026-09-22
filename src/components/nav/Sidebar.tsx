import { useState } from 'react';
import {
  Home,
  FileText,
  AppWindow,
  HardDrive,
  BookOpen,
  LayoutGrid,
  Users,
  Lock,
  Trash2,
  Target,
  HelpCircle,
  DatabaseBackup,
  type LucideIcon,
} from 'lucide-react';
import { desktop, isDesktop } from '@/lib/desktop';

export type Section =
  | 'home'
  | 'launcher'
  | 'shortcuts'
  | 'drives'
  | 'cheatsheets'
  | 'ideaboard'
  | 'dailybp'
  | 'contacts'
  | 'vault'
  | 'trash';

const NAV: { id: Section; label: string; hint: string; Icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', hint: 'The dashboard', Icon: Home },
  { id: 'launcher', label: 'Templates', hint: 'Open a Word/Excel template', Icon: FileText },
  { id: 'shortcuts', label: 'Tools', hint: 'Launch other apps you built', Icon: AppWindow },
  { id: 'drives', label: 'Drives', hint: 'Jump to a drive or share', Icon: HardDrive },
  { id: 'cheatsheets', label: 'Cheat Sheets', hint: 'Short how-to notes', Icon: BookOpen },
  { id: 'ideaboard', label: 'Idea Boards', hint: 'Arrange reference photos', Icon: LayoutGrid },
  { id: 'dailybp', label: 'Daily BP', hint: "Today's quotas and targets", Icon: Target },
  { id: 'contacts', label: 'Contacts', hint: 'Names, numbers, emails', Icon: Users },
  { id: 'vault', label: 'Vault', hint: 'Securely stored passwords', Icon: Lock },
  { id: 'trash', label: 'Trash', hint: 'Deleted items, for 24 hours', Icon: Trash2 },
];

interface SidebarProps {
  active: Section;
  onSelect: (s: Section) => void;
}

export function Sidebar({ active, onSelect }: SidebarProps) {
  const [helpMode, setHelpMode] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');

  async function backUpNow() {
    if (!isDesktop()) return;
    setBackupStatus('');
    const bridge = desktop();
    const dest = await bridge.pickFolder();
    if (!dest) return;
    setBackupStatus('Backing up…');
    try {
      const target = await bridge.runBackup(dest);
      setBackupStatus(`Saved to ${target}`);
    } catch {
      setBackupStatus("Backup failed — couldn't write to that folder.");
    }
  }

  return (
    <nav className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark">SO</span>
        <span className="sidebar__brand-name">Stills Off</span>
      </div>
      <ul className="sidebar__list">
        {NAV.map(({ id, label, hint, Icon }) => (
          <li key={id}>
            <button
              className={`sidebar__item${active === id ? ' sidebar__item--active' : ''}`}
              onClick={() => onSelect(id)}
            >
              <Icon size={18} />
              <span className="sidebar__item-text">
                <span>{label}</span>
                {helpMode && <span className="sidebar__item-hint">{hint}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="sidebar__footer">
        <button
          className={`sidebar__footer-btn${helpMode ? ' sidebar__footer-btn--active' : ''}`}
          onClick={() => setHelpMode((v) => !v)}
        >
          <HelpCircle size={15} />
          {helpMode ? 'Hide help' : 'Show help'}
        </button>
        {isDesktop() && (
          <button className="sidebar__footer-btn" onClick={backUpNow}>
            <DatabaseBackup size={15} />
            Back Up My Data
          </button>
        )}
        {backupStatus && <p className="sidebar__footer-status">{backupStatus}</p>}
      </div>
    </nav>
  );
}
