import { useEffect, useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { Sidebar, type Section } from '@/components/nav/Sidebar';
import { Home } from '@/components/home/Home';
import { Launcher } from '@/components/launcher/Launcher';
import { Shortcuts } from '@/components/shortcuts/Shortcuts';
import { Drives } from '@/components/drives/Drives';
import { CheatSheets } from '@/components/cheatsheets/CheatSheets';
import { IdeaBoards } from '@/components/ideaboard/IdeaBoards';
import { DailyBPPage } from '@/components/dailybp/DailyBPPage';
import { Contacts } from '@/components/contacts/Contacts';
import { Vault } from '@/components/vault/Vault';
import { Trash } from '@/components/trash/Trash';
import { isDesktop } from '@/lib/desktop';

const TRASH_CHECK_INTERVAL_MS = 15 * 60 * 1000;

export default function App() {
  const ready = useAppStore((s) => s.ready);
  const init = useAppStore((s) => s.init);
  const [section, setSection] = useState<Section>('home');

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const interval = setInterval(() => {
      useAppStore.getState().purgeExpiredTrash();
    }, TRASH_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!ready) {
    return <div className="app-loading">Loading Stills Off…</div>;
  }

  return (
    <div className="app">
      <Sidebar active={section} onSelect={setSection} />
      <main className="app__content">
        {!isDesktop() && (
          <div className="banner banner--warn">
            Running outside the desktop app — file, drive, and template features are disabled.
          </div>
        )}
        {section === 'home' && <Home onNavigate={setSection} />}
        {section === 'launcher' && <Launcher />}
        {section === 'shortcuts' && <Shortcuts />}
        {section === 'drives' && <Drives />}
        {section === 'cheatsheets' && <CheatSheets />}
        {section === 'ideaboard' && <IdeaBoards />}
        {section === 'dailybp' && <DailyBPPage />}
        {section === 'contacts' && <Contacts />}
        {section === 'vault' && <Vault />}
        {section === 'trash' && <Trash />}
      </main>
    </div>
  );
}
