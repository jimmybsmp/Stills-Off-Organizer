import { desktop } from './desktop';
import { sha256Hex } from './hash';

const THUMB_MAX = 480;

export interface ImportedImage {
  id: string;
  fileName: string;
  thumbFileName: string;
  originalName: string;
  width: number;
  height: number;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function makeThumbnail(img: HTMLImageElement): Promise<string> {
  const scale = Math.min(1, THUMB_MAX / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0, w, h);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
  return dataUrl.split(',')[1] ?? '';
}

/** Imports a dropped/picked image file: hashes it, writes the full file and a
 * thumbnail into the desktop asset store, and returns its metadata. The same
 * frame imported twice resolves to the same asset id. */
export async function importImageFile(file: File): Promise<ImportedImage> {
  const buffer = await file.arrayBuffer();
  const hash = await sha256Hex(buffer);
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const base64 = arrayBufferToBase64(buffer);

  const bridge = desktop();
  const fileName = await bridge.writeAsset(hash, ext, base64);

  const objectUrl = URL.createObjectURL(file);
  let width = 0;
  let height = 0;
  let thumbFileName = fileName;
  try {
    const img = await loadImageElement(objectUrl);
    width = img.naturalWidth;
    height = img.naturalHeight;
    const thumbBase64 = await makeThumbnail(img);
    thumbFileName = await bridge.writeAssetThumb(hash, thumbBase64);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  return {
    id: hash,
    fileName,
    thumbFileName,
    originalName: file.name,
    width,
    height,
  };
}
