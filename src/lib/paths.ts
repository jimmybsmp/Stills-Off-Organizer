import { desktop } from './desktop';
import { useAppStore } from '@/state/useAppStore';
import type { DocType } from '@/state/schema';

function monthFolderName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function resolveDestinationFolder(docType: DocType): string {
  if (!docType.dateSubfolder) return docType.destinationFolder;
  return `${docType.destinationFolder.replace(/\/+$/, '')}/${monthFolderName()}`;
}

/** Copies a template into its document type's folder (creating the folder if
 * needed) and opens the new copy with the OS default application. This is
 * the closest an unattended copy can get to "autosaved on open": the file
 * already exists on disk, under the right folder, before Word or Excel ever
 * takes over. */
export async function launchTemplateCopy(
  sourcePath: string,
  docType: DocType,
  fileName: string,
): Promise<void> {
  const bridge = desktop();
  const folder = resolveDestinationFolder(docType);
  await bridge.ensureDir(folder);
  const destPath = `${folder}/${fileName}`;
  const finalPath = await bridge.copyFile(sourcePath, destPath);
  const err = await bridge.openPath(finalPath);
  if (err) throw new Error(err);
  useAppStore.getState().pushRecentFile(fileName, finalPath);
}
