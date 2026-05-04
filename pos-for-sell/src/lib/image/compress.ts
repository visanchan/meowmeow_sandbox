"use client";

// Client-side image compression using OffscreenCanvas / HTMLCanvasElement.
// Used by the product-image upload step (DD-46) before sending to Supabase Storage.

export type CompressOpts = {
  maxWidth?: number;
  maxHeight?: number;
  /** 0–1 quality for lossy formats. Default 0.82. */
  quality?: number;
  mimeType?: "image/webp" | "image/jpeg";
};

export type CompressResult = {
  blob: Blob;
  width: number;
  height: number;
  bytes: number;
  mimeType: string;
};

export async function compressImage(
  source: File | Blob,
  opts: CompressOpts = {},
): Promise<CompressResult> {
  const maxW = opts.maxWidth ?? 1024;
  const maxH = opts.maxHeight ?? 1024;
  const quality = opts.quality ?? 0.82;
  const mimeType = opts.mimeType ?? "image/webp";

  const bitmap = await createImageBitmap(source);
  const ratio = Math.min(maxW / bitmap.width, maxH / bitmap.height, 1);
  const w = Math.max(1, Math.round(bitmap.width * ratio));
  const h = Math.max(1, Math.round(bitmap.height * ratio));

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(w, h)
      : (() => {
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          return c;
        })();

  const ctx = canvas.getContext("2d") as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null;
  if (!ctx) throw new Error("[image/compress] 2D context unavailable");

  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await canvasToBlob(canvas, mimeType, quality);
  return { blob, width: w, height: h, bytes: blob.size, mimeType: blob.type };
}

async function canvasToBlob(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
      type,
      quality,
    );
  });
}
