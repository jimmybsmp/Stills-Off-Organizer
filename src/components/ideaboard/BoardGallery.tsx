import { useAppStore } from '@/state/useAppStore';
import { desktop } from '@/lib/desktop';
import { Plus, Trash2, LayoutGrid } from 'lucide-react';

interface BoardGalleryProps {
  onOpen: (boardId: string) => void;
}

export function BoardGallery({ onOpen }: BoardGalleryProps) {
  const boardIds = useAppStore((s) => s.data.boardIds);
  const boards = useAppStore((s) => s.data.boards);
  const assets = useAppStore((s) => s.data.assets);
  const addBoard = useAppStore((s) => s.addBoard);
  const removeBoard = useAppStore((s) => s.removeBoard);

  function createBoard() {
    const id = addBoard('Untitled board');
    onOpen(id);
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h1>Idea Boards</h1>
          <p className="panel__subtitle">Drop in reference frames, arrange them, save the look.</p>
        </div>
        <div className="panel__actions">
          <button className="btn btn--accent" onClick={createBoard}>
            <Plus size={16} />
            New Board
          </button>
        </div>
      </header>

      <div className="board-grid">
        {boardIds.map((id) => {
          const board = boards[id];
          if (!board) return null;
          const firstItem = board.itemIds
            .map((itemId) => board.items[itemId])
            .filter(Boolean)
            .sort((a, b) => a!.z - b!.z)[0];
          const asset = firstItem ? assets[firstItem.assetId] : undefined;
          return (
            <div key={id} className="board-tile">
              <button className="board-tile__body" onClick={() => onOpen(id)}>
                {asset ? (
                  <img src={desktop().assetUrl(asset.thumbFileName)} alt="" />
                ) : (
                  <div className="board-tile__placeholder">
                    <LayoutGrid size={28} />
                  </div>
                )}
                <span className="board-tile__name">{board.name || 'Untitled board'}</span>
                <span className="board-tile__count">
                  {board.itemIds.length} image{board.itemIds.length === 1 ? '' : 's'}
                </span>
              </button>
              <button
                className="board-tile__remove"
                onClick={() => {
                  if (window.confirm(`Move "${board.name || 'Untitled board'}" to trash?`)) removeBoard(id);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        {boardIds.length === 0 && <p className="empty-row">No idea boards yet.</p>}
      </div>
    </section>
  );
}
