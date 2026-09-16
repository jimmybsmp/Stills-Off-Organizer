import { useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { Modal } from '@/components/common/Modal';
import { launchTemplateCopy } from '@/lib/paths';
import type { TemplateDef } from '@/state/schema';

interface OpenTemplateDialogProps {
  template: TemplateDef;
  onClose: () => void;
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function OpenTemplateDialog({ template, onClose }: OpenTemplateDialogProps) {
  const docTypeIds = useAppStore((s) => s.data.docTypeIds);
  const docTypes = useAppStore((s) => s.data.docTypes);

  const [docTypeId, setDocTypeId] = useState(template.defaultDocTypeId ?? docTypeIds[0] ?? '');
  const [fileName, setFileName] = useState(`${template.label} - ${todayStamp()}.${template.extension}`);
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [error, setError] = useState('');

  const docType = docTypeId ? docTypes[docTypeId] : undefined;

  async function submit() {
    if (!docType) return;
    setStatus('working');
    setError('');
    try {
      await launchTemplateCopy(template.sourcePath, docType, fileName);
      onClose();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Could not open the file.');
    }
  }

  return (
    <Modal
      title={`Open “${template.label}”`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn--accent"
            onClick={submit}
            disabled={!docType || !fileName.trim() || status === 'working'}
          >
            {status === 'working' ? 'Opening…' : 'Create & Open'}
          </button>
        </>
      }
    >
      <p className="modal__hint">What type of document is this? It'll be saved into that folder.</p>
      <div className="form-row">
        <label>Document type</label>
        <select className="field" value={docTypeId} onChange={(e) => setDocTypeId(e.target.value)}>
          {docTypeIds.length === 0 && <option value="">No document types set up yet</option>}
          {docTypeIds.map((id) => (
            <option key={id} value={id}>
              {docTypes[id]?.label}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>File name</label>
        <input className="field" value={fileName} onChange={(e) => setFileName(e.target.value)} />
      </div>
      {docType && (
        <p className="modal__hint modal__hint--muted">
          Will be saved to <code>{docType.destinationFolder}</code>
          {docType.dateSubfolder ? ' (in a monthly subfolder)' : ''}.
        </p>
      )}
      {status === 'error' && <p className="form-error">{error}</p>}
    </Modal>
  );
}
