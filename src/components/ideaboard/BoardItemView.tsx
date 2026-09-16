import { useRef } from 'react';
import { desktop } from '@/lib/desktop';
import type { AssetDef, BoardItem } from '@/state/schema';
import { X } from 'lucide-react';

interface BoardItemViewProps {
  item: BoardItem;
  asset: AssetDef | undefined;
  onCommit: (patch: Partial<Omit<BoardItem, 'id'>>) => void;
  onRemove: () => void;
  onBringToFront: () => void;
}

const MIN_SIZE = 60;

export function BoardItemView({ item, asset, onCommit, onRemove, onBringToFront }: BoardItemViewProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  function startDrag(e: React.PointerEvent) {
    e.preventDefault();
    onBringToFront();
    const node = nodeRef.current;
    if (!node) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const originX = item.x;
    const originY = item.y;

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      node!.style.left = `${originX + dx}px`;
      node!.style.top = `${originY + dy}px`;
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      onCommit({ x: originX + dx, y: originY + dy });
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function startResize(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const node = nodeRef.current;
    if (!node) return;
    const startX = e.clientX;
    const originW = item.width;
    const originH = item.height;
    const ratio = originH / originW;

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const width = Math.max(MIN_SIZE, originW + dx);
      node!.style.width = `${width}px`;
      node!.style.height = `${width * ratio}px`;
    }
    function onUp(ev: PointerEvent) {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const dx = ev.clientX - startX;
      const width = Math.max(MIN_SIZE, originW + dx);
      onCommit({ width, height: width * ratio });
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  const src = asset ? desktop().assetUrl(asset.thumbFileName) : '';

  return (
    <div
      ref={nodeRef}
      className="board-item"
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        transform: `rotate(${item.rotation}deg)`,
        zIndex: item.z,
      }}
      onPointerDown={startDrag}
    >
      {src && <img src={src} alt={asset?.originalName ?? ''} draggable={false} />}
      <button
        className="board-item__remove"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
      >
        <X size={12} />
      </button>
      <div className="board-item__resize" onPointerDown={startResize} />
    </div>
  );
}
