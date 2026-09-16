import { useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import type { Section } from '@/components/nav/Sidebar';
import { FileText, AppWindow, HardDrive, BookOpen, LayoutGrid, Pencil, type LucideIcon } from 'lucide-react';
import { quoteOfDayId } from '@/lib/quoteOfDay';
import { QuoteManager } from './QuoteManager';

interface HomeProps {
  onNavigate: (s: Section) => void;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Home({ onNavigate }: HomeProps) {
  const templateCount = useAppStore((s) => s.data.templateIds.length);
  const shortcutCount = useAppStore((s) => s.data.shortcutIds.length);
  const driveCount = useAppStore((s) => s.data.driveIds.length);
  const cheatSheetCount = useAppStore((s) => s.data.cheatSheetIds.length);
  const boardCount = useAppStore((s) => s.data.boardIds.length);
  const quoteIds = useAppStore((s) => s.data.quoteIds);
  const quotes = useAppStore((s) => s.data.quotes);
  const [managingQuotes, setManagingQuotes] = useState(false);

  const quote = quotes[quoteOfDayId(quoteIds) ?? ''];

  const cards: { section: Section; label: string; count: number; Icon: LucideIcon }[] = [
    { section: 'launcher', label: 'Templates', count: templateCount, Icon: FileText },
    { section: 'shortcuts', label: 'Tools', count: shortcutCount, Icon: AppWindow },
    { section: 'drives', label: 'Drives', count: driveCount, Icon: HardDrive },
    { section: 'cheatsheets', label: 'Cheat Sheets', count: cheatSheetCount, Icon: BookOpen },
    { section: 'ideaboard', label: 'Idea Boards', count: boardCount, Icon: LayoutGrid },
  ];

  return (
    <div className="home">
      <p className="home__eyebrow">{greeting()}</p>
      <h1 className="home__title">Hello Stills Off</h1>
      <p className="home__subtitle">Everything the desk needs, in one place.</p>

      <div className="home__quote">
        {quote ? (
          <>
            <p className="home__quote-text">&ldquo;{quote.text}&rdquo;</p>
            {quote.author && <p className="home__quote-author">— {quote.author}</p>}
          </>
        ) : (
          <p className="home__quote-empty">No quote of the day set yet.</p>
        )}
        <button
          className="home__quote-edit"
          onClick={() => setManagingQuotes(true)}
          aria-label="Manage quotes"
          title="Manage quotes"
        >
          <Pencil size={13} />
        </button>
      </div>

      <div className="home__grid">
        {cards.map(({ section, label, count, Icon }) => (
          <button key={section} className="home__card" onClick={() => onNavigate(section)}>
            <Icon size={24} />
            <span className="home__card-label">{label}</span>
            <span className="home__card-count">{count}</span>
          </button>
        ))}
      </div>

      {managingQuotes && <QuoteManager onClose={() => setManagingQuotes(false)} />}
    </div>
  );
}
