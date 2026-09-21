export interface StillsOffBridge {
  isDesktop: true;
  readData(): Promise<string | null>;
  writeData(json: string): Promise<boolean>;
  pathExists(targetPath: string): Promise<boolean>;
  ensureDir(targetPath: string): Promise<boolean>;
  copyFile(src: string, dest: string): Promise<string>;
  openPath(targetPath: string): Promise<string | null>;
  openExternal(url: string): Promise<boolean>;
  pickFile(filters?: { name: string; extensions: string[] }[]): Promise<string | null>;
  pickFolder(): Promise<string | null>;
  pickSavePath(defaultName: string): Promise<string | null>;
  writeAsset(hash: string, ext: string, base64: string): Promise<string>;
  writeAssetThumb(hash: string, base64: string): Promise<string>;
  exportBuffer(filePath: string, base64: string): Promise<boolean>;
  assetUrl(fileName: string): string;
  vaultIsAvailable(): Promise<boolean>;
  vaultEncrypt(plainText: string): Promise<string>;
  vaultDecrypt(cipherBase64: string): Promise<string>;
  listDir(targetPath: string): Promise<{ name: string; path: string; modifiedAt: number }[]>;
  runBackup(destFolder: string): Promise<string>;
}

declare global {
  interface Window {
    stillsoff?: StillsOffBridge;
  }
}

export function isDesktop(): boolean {
  return typeof window !== 'undefined' && window.stillsoff?.isDesktop === true;
}

export function desktop(): StillsOffBridge {
  if (!window.stillsoff) {
    throw new Error('Stills Off is running without the desktop shell — this feature needs the desktop app.');
  }
  return window.stillsoff;
}
