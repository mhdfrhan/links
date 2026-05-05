export interface CompressionOptions {
  quality?: number;      // 0-1, default 0.8
  maxWidth?: number;     // max px width
  maxHeight?: number;    // max px height
  format?: "webp" | "jpeg" | "png";
}

export function getImageDimensions(file: File | Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error("Gagal memuat gambar."));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

export function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<Blob> {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080,
    format = "webp",
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;

      // Scale down if exceeds max dimensions
      if (w > maxWidth || h > maxHeight) {
        const ratio = Math.min(maxWidth / w, maxHeight / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context tidak tersedia."));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);

      const mimeType = format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp";

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Gagal mengkompresi gambar."));
          }
        },
        mimeType,
        format === "png" ? undefined : quality
      );

      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      reject(new Error("Gagal memuat gambar untuk kompresi."));
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(file);
  });
}

export function cropImage(
  file: File | Blob,
  crop: { x: number; y: number; width: number; height: number },
  outputSize?: { width: number; height: number },
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const outW = outputSize?.width || crop.width;
      const outH = outputSize?.height || crop.height;
      canvas.width = outW;
      canvas.height = outH;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context tidak tersedia."));
        return;
      }

      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, outW, outH);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Gagal crop gambar."));
        },
        "image/webp",
        quality
      );

      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      reject(new Error("Gagal memuat gambar untuk crop."));
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
