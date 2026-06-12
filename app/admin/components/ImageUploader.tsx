"use client";

import { useState, useRef, useCallback } from "react";
import { compressImage, formatFileSize, getImageDimensions, type CompressionOptions } from "@/lib/utils/imageCompression";
import { uploadToCloudinary } from "@/lib/cloudinary/config";

interface ImageUploaderProps {
  currentImageUrl?: string;
  onUploadComplete: (url: string, publicId: string) => void;
  folder?: string;
  label?: string;
  maxSizeMB?: number;
  showCompressionSettings?: boolean;
}

export function ImageUploader({
  currentImageUrl,
  onUploadComplete,
  folder = "portfolio",
  label = "Upload Gambar",
  maxSizeMB = 10,
  showCompressionSettings = true,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState("");

  // Compression settings
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [format, setFormat] = useState<"webp" | "jpeg" | "png">("webp");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Ukuran file maks ${maxSizeMB}MB.`);
      return;
    }

    setOriginalFile(file);
    setOriginalSize(file.size);

    // Compress immediately for preview
    try {
      const compressed = await compressImage(file, {
        quality: quality / 100,
        maxWidth,
        maxHeight: Math.round(maxWidth * 0.75),
        format,
      });
      setCompressedSize(compressed.size);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      // Fallback to original
      setPreview(URL.createObjectURL(file));
      setCompressedSize(file.size);
    }
  }, [quality, maxWidth, format, maxSizeMB]);

  const recompress = useCallback(async () => {
    if (!originalFile) return;
    try {
      const compressed = await compressImage(originalFile, {
        quality: quality / 100,
        maxWidth,
        maxHeight: Math.round(maxWidth * 0.75),
        format,
      });
      setCompressedSize(compressed.size);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.error("Recompress error:", err);
    }
  }, [originalFile, quality, maxWidth, format, preview]);

  const handleUpload = async () => {
    if (!originalFile) return;
    setUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      const compressed = await compressImage(originalFile, {
        quality: quality / 100,
        maxWidth,
        maxHeight: Math.round(maxWidth * 0.75),
        format,
      });

      const result = await uploadToCloudinary(compressed, {
        folder,
        onProgress: setUploadProgress,
      });

      onUploadComplete(result.secure_url, result.public_id);
    } catch (err: any) {
      setError(err.message || "Gagal mengupload gambar.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const savings = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0;

  return (
    <div className="space-y-4">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}

      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed  p-6 text-center transition-all cursor-pointer ${
          isDragOver ? "border-accent bg-accent/5" : "border-border hover:border-accent/50 hover:bg-accent/5"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {preview || currentImageUrl ? (
          <div className="space-y-3">
            <img
              src={preview || currentImageUrl}
              alt="Preview"
              className="max-h-48 mx-auto  object-cover"
            />
            <p className="text-xs text-muted-foreground">Klik atau drag untuk ganti gambar</p>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mx-auto text-muted-foreground/50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-foreground">Drag & drop gambar atau klik untuk browse</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP (maks {maxSizeMB}MB)</p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Compression info & settings */}
      {originalFile && (
        <div className="space-y-4 p-4  bg-muted/30 border border-border">
          {/* Size info */}
          <div className="flex items-center justify-between text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Asli: <span className="text-foreground font-medium">{formatFileSize(originalSize)}</span></p>
              <p className="text-muted-foreground">Terkompresi: <span className="text-accent font-medium">{formatFileSize(compressedSize)}</span></p>
            </div>
            {savings > 0 && (
              <span className="px-3 py-1.5 bg-accent/10 text-accent text-xs font-bold ">
                -{savings}%
              </span>
            )}
          </div>

          {/* Compression settings */}
          {showCompressionSettings && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Kualitas</span>
                  <span className="font-medium text-foreground">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  onMouseUp={recompress}
                  onTouchEnd={recompress}
                  className="w-full accent-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Max Lebar (px)</label>
                  <input
                    type="number"
                    value={maxWidth}
                    onChange={(e) => setMaxWidth(Number(e.target.value))}
                    onBlur={recompress}
                    className="w-full p-2 text-sm  bg-background/50 border border-border focus:border-accent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Format</label>
                  <select
                    value={format}
                    onChange={(e) => { setFormat(e.target.value as any); setTimeout(recompress, 50); }}
                    className="w-full p-2 text-sm  bg-background/50 border border-border focus:border-accent outline-none"
                  >
                    <option value="webp">WebP (Terkecil)</option>
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG (Terbesar)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3 px-4 bg-accent text-accent-foreground font-semibold  hover:bg-accent/90 disabled:opacity-70 transition-all"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin  h-4 w-4 border-t-2 border-b-2 border-accent-foreground" />
                Mengupload... {uploadProgress}%
              </span>
            ) : (
              "Upload Gambar"
            )}
          </button>

          {uploading && (
            <div className="w-full h-2 bg-muted  overflow-hidden">
              <div
                className="h-full bg-accent  transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
