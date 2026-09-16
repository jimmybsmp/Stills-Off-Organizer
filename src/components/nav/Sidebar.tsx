import {
  Home,
  FileText,
  AppWindow,
  HardDrive,
  BookOpen,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';

export type Section = 'home' | 'launcher' | 'shortcuts' | 'drives' | 'cheatsheets' | 'ideaboard';

const NAV: { id: Section; label: string; Icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'launcher', label: 'Templates', Icon: FileText },
  { id: 'shortcuts', label: 'Tools', Icon: AppWindow },
  { id: 'drives', label: 'Drives', Icon: HardDrive },
  { id: 'cheatsheets', label: 'Cheat Sheets', Icon: BookOpen },
  { id: 'ideaboard', label: 'Idea Boards', Icon: LayoutGrid },
];

interface SidebarProps {
  active: Section;
  onSelect: (s: Section) => void;
}

export function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <nav className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark">SO</span>
        <span className="sidebar__brand-name">Stills Off</span>
      </div>
      <ul className="sidebar__list">
        {NAV.map(({ id, label, Icon }) => (
          <li key={id}>
            <button
              className={`sidebar__item${active === id ? ' sidebar__item--active' : ''}`}
              onClick={() => onSelect(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
