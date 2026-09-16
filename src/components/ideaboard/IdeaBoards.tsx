import { useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { BoardGallery } from './BoardGallery';
import { BoardEditor } from './BoardEditor';

export function IdeaBoards() {
  const boards = useAppStore((s) => s.data.boards);
  const [openBoardId, setOpenBoardId] = useState<string | null>(null);

  const openBoard = openBoardId ? boards[openBoardId] : undefined;

  if (openBoard) {
    return <BoardEditor board={openBoard} onBack={() => setOpenBoardId(null)} />;
  }

  return <BoardGallery onOpen={setOpenBoardId} />;
}
