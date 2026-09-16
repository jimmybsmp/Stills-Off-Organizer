import { useCallback, useRef, useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { BoardItemView } from './BoardItemView';
import { importImageFile } from '@/lib/images';
import { desktop } from '@/lib/desktop';
import { ArrowLeft, Download } from 'lucide-react';
import type { BoardDef } from '@/state/schema';

export const BOARD_WIDTH = 1600;
export const BOARD_HEIGHT = 1000;
const DEFAULT_ITEM_SIZE = 240;

interface BoardEditorProps {
  board: BoardDef;
  onBack: () => void;
}

export function BoardEditor({ board, onBack }: BoardEditorProps) {
  const assets = useAppStore((s) => s.data.assets);
  const registerAsset = useAppStore((s) => s.registerAsset);
  const addBoardItem = useAppStore((s) => s.addBoardItem);
  const updateBoardItem = useAppStore((s) => s.updateBoardItem);
  const removeBoardItem = useAppStore((s) => s.removeBoardItem);
  const renameBoard = useAppStore((s) => s.renameBoard);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [exporting, setExporting] = useState(false);
  const nextZRef = useRef(board.itemIds.length);

  const handleFiles = useCallback(
    async (files: FileList, dropX: number, dropY: number) => {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      for (let i = 0; i < imageFiles.length; i += 1) {
        const file = imageFiles[i];
        try {
          const imported = await importImageFile(file);
          registerAsset(
            {
              fileName: imported.fileName,
              thumbFileName: imported.thumbFileName,
              originalName: imported.originalName,
              width: imported.width,
              height: imported.height,
              addedAt: Date.now(),
            },
            imported.id,
          );
          const ratio = imported.height / imported.width || 1;
          const width = DEFAULT_ITEM_SIZE;
          const height = width * ratio;
          nextZRef.current += 1;
          addBoardItem(board.id, {
            assetId: imported.id,
            x: dropX + i * 24 - width / 2,
            y: dropY + i * 24 - height / 2,
            width,
            height,
            rotation: 0,
          });
        } catch {
          // A failed import just skips that file — nothing to roll back.
        }
      }
    },
    [addBoardItem, board.id, registerAsset],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const rect = surfaceRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : 0;
    const y = rect ? e.clientY - rect.top : 0;
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files, x, y);
    }
  }

  function bringToFront(itemId: string) {
    nextZRef.current += 1;
    updateBoardItem(board.id, itemId, { z: nextZRef.current });
  }

  async function exportBoard() {
    setExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = BOARD_WIDTH;
      canvas.height = BOARD_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

      const ordered = [...board.itemIds]
        .map((id) => board.items[id])
        .filter((it): it is NonNullable<typeof it> => Boolean(it))
        .sort((a, b) => a.z - b.z);

      const bridge = desktop();
      for (const item of ordered) {
        const asset = assets[item.assetId];
        if (!asset) continue;
        const img = await loadImage(bridge.assetUrl(asset.fileName));
        ctx.save();
        ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.drawImage(img, -item.width / 2, -item.height / 2, item.width, item.height);
        ctx.restore();
      }

      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1] ?? '';
      const savePath = await bridge.pickSavePath(`${board.name || 'board'}.png`);
      if (savePath) {
        await bridge.exportBuffer(savePath, base64);
      }
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <div className="board-editor__title">
          <button className="btn btn--icon" onClick={onBack}>
            <ArrowLeft size={16} />
          </button>
          <input
            className="field field--title"
            value={board.name}
            onChange={(e) => renameBoard(board.id, e.target.value)}
          />
        </div>
        <div className="panel__actions">
          <button className="btn btn--accent" onClick={exportBoard} disabled={exporting}>
            <Download size={16} />
            {exporting ? 'Exporting…' : 'Export as Image'}
          </button>
        </div>
      </header>

      <div className="board-surface-wrapper">
        <div
          ref={surfaceRef}
          className={`board-surface${dragOver ? ' board-surface--drop' : ''}`}
          style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {board.itemIds.length === 0 && (
            <p className="board-surface__hint">Drag JPEGs in from Finder to start this board.</p>
          )}
          {board.itemIds.map((id) => {
            const item = board.items[id];
            if (!item) return null;
            return (
              <BoardItemView
                key={id}
                item={item}
                asset={assets[item.assetId]}
                onCommit={(patch) => updateBoardItem(board.id, id, patch)}
                onRemove={() => removeBoardItem(board.id, id)}
                onBringToFront={() => bringToFront(id)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
