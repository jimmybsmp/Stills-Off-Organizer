import { useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { AddTemplateDialog } from './AddTemplateDialog';
import { OpenTemplateDialog } from './OpenTemplateDialog';
import { DocTypeManager } from './DocTypeManager';
import type { TemplateDef } from '@/state/schema';
import { Plus, Settings, Trash2 } from 'lucide-react';

export function Launcher() {
  const templateIds = useAppStore((s) => s.data.templateIds);
  const templates = useAppStore((s) => s.data.templates);
  const removeTemplate = useAppStore((s) => s.removeTemplate);
  const docTypeIds = useAppStore((s) => s.data.docTypeIds);

  const [adding, setAdding] = useState(false);
  const [managingTypes, setManagingTypes] = useState(false);
  const [opening, setOpening] = useState<TemplateDef | null>(null);
  const [manageMode, setManageMode] = useState(false);

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h1>Templates</h1>
          <p className="panel__subtitle">Launch a Word or Excel template — it saves itself into the right folder.</p>
        </div>
        <div className="panel__actions">
          <button className="btn" onClick={() => setManagingTypes(true)}>
            <Settings size={16} />
            Document Types
          </button>
          <button className="btn" onClick={() => setManageMode((m) => !m)}>
            {manageMode ? 'Done' : 'Manage'}
          </button>
          <button className="btn btn--accent" onClick={() => setAdding(true)}>
            <Plus size={16} />
            Add Template
          </button>
        </div>
      </header>

      {docTypeIds.length === 0 && (
        <div className="banner banner--warn">
          Set up at least one document type (with a destination folder) before launching templates.
        </div>
      )}

      <div className="card-grid">
        {templateIds.map((id) => {
          const tpl = templates[id];
          if (!tpl) return null;
          return (
            <div key={id} className="launch-card">
              <button
                className="launch-card__body"
                onClick={() => (manageMode ? undefined : setOpening(tpl))}
                disabled={manageMode}
              >
                <span className="launch-card__icon">{tpl.icon}</span>
                <span className="launch-card__label">{tpl.label}</span>
                <span className="launch-card__ext">.{tpl.extension}</span>
              </button>
              {manageMode && (
                <button
                  className="launch-card__remove"
                  onClick={() => {
                    if (window.confirm(`Move "${tpl.label}" to trash?`)) removeTemplate(id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
        {templateIds.length === 0 && (
          <p className="empty-row">No templates yet — add your first Word or Excel file.</p>
        )}
      </div>

      {adding && <AddTemplateDialog onClose={() => setAdding(false)} />}
      {managingTypes && <DocTypeManager onClose={() => setManagingTypes(false)} />}
      {opening && <OpenTemplateDialog template={opening} onClose={() => setOpening(null)} />}
    </section>
  );
}
