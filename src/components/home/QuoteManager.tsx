import { useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { Modal } from '@/components/common/Modal';
import { Trash2 } from 'lucide-react';

interface QuoteManagerProps {
  onClose: () => void;
}

export function QuoteManager({ onClose }: QuoteManagerProps) {
  const quoteIds = useAppStore((s) => s.data.quoteIds);
  const quotes = useAppStore((s) => s.data.quotes);
  const addQuote = useAppStore((s) => s.addQuote);
  const updateQuote = useAppStore((s) => s.updateQuote);
  const removeQuote = useAppStore((s) => s.removeQuote);

  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');

  function submit() {
    if (!text.trim()) return;
    addQuote({ text: text.trim(), author: author.trim() });
    setText('');
    setAuthor('');
  }

  return (
    <Modal title="Quote of the Day" onClose={onClose} wide>
      <p className="modal__hint">
        One shows on Home each day, in order, cycling back to the start once the list runs out.
      </p>

      <ul className="quote-list">
        {quoteIds.map((id) => {
          const quote = quotes[id];
          if (!quote) return null;
          return (
            <li key={id} className="quote-list__row">
              <div className="quote-list__fields">
                <textarea
                  className="field field--quote"
                  value={quote.text}
                  onChange={(e) => updateQuote(id, { text: e.target.value })}
                  rows={2}
                />
                <input
                  className="field"
                  value={quote.author}
                  onChange={(e) => updateQuote(id, { author: e.target.value })}
                  placeholder="Attribution, e.g. Ansel Adams"
                />
              </div>
              <button className="btn btn--icon btn--danger" onClick={() => removeQuote(id)}>
                <Trash2 size={16} />
              </button>
            </li>
          );
        })}
        {quoteIds.length === 0 && <li className="empty-row">No quotes yet — add the first one below.</li>}
      </ul>

      <div className="quote-add">
        <textarea
          className="field field--quote"
          placeholder="Quote text…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
        />
        <div className="quote-add__row">
          <input
            className="field"
            placeholder="Attribution (optional)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <button className="btn btn--accent" onClick={submit} disabled={!text.trim()}>
            Add
          </button>
        </div>
      </div>
    </Modal>
  );
}
