import { useEffect, useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { Sidebar, type Section } from '@/components/nav/Sidebar';
import { Home } from '@/components/home/Home';
import { Launcher } from '@/components/launcher/Launcher';
import { Shortcuts } from '@/components/shortcuts/Shortcuts';
import { Drives } from '@/components/drives/Drives';
import { CheatSheets } from '@/components/cheatsheets/CheatSheets';
import { IdeaBoards } from '@/components/ideaboard/IdeaBoards';
import { isDesktop } from '@/lib/desktop';

export default function App() {
  const ready = useAppStore((s) => s.ready);
  const init = useAppStore((s) => s.init);
  const [section, setSection] = useState<Section>('home');

  useEffect(() => {
    init();
  }, [init]);

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
      </main>
    </div>
  );
}
